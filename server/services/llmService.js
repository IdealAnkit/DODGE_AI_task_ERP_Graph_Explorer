/**
 * LLM Service
 * Handles natural language to SQL translation using Google Gemini API.
 * Supports conversation memory (multi-turn) and streaming responses.
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../db/pool');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const PREVIEW_REQUEST_OPTIONS = { apiVersion: 'v1alpha' };

// ── Schema Context ─────────────────────────────────────────────────────────
const DB_SCHEMA = `
DATABASE SCHEMA (PostgreSQL):

1. customers (customer PK, business_partner, full_name, name, is_blocked, created_at)
2. customer_addresses (business_partner FK→customers, address_id, street_name, city_name, postal_code, country)
3. products (product PK, product_type, product_old_id, product_group, base_unit, division, is_marked_for_deletion)
4. product_descriptions (product FK→products, language, description)
5. plants (plant PK, plant_name, company_code, country, city_name)
6. sales_orders (sales_order PK, sales_order_type, sales_organization, sold_to_party FK→customers,
     requested_delivery_date, creation_date, customer_payment_terms, delivery_block_reason, header_billing_block, incoterms)
7. sales_order_items (sales_order FK→sales_orders, sales_order_item, item_category, material FK→products,
     requested_quantity, quantity_unit, net_amount, transaction_currency, material_group, production_plant, storage_location)
8. sales_order_schedule_lines (sales_order, sales_order_item FK→sales_order_items, schedule_line, delivery_document, req_qty)
9. deliveries (delivery_document PK, shipping_point, creation_date, actual_goods_movement_date,
     overall_goods_movement_status, overall_picking_status, delivery_block_reason)
10. delivery_items (delivery_document FK→deliveries, delivery_document_item,
      reference_sales_order FK→sales_orders, reference_so_item, material FK→products,
      actual_delivery_qty, quantity_unit, plant FK→plants, storage_location)
11. billing_documents (billing_document PK, billing_document_type, sold_to_party FK→customers,
      accounting_document, total_net_amount, transaction_currency, company_code, fiscal_year,
      creation_date, is_cancelled)
12. billing_items (billing_document FK→billing_documents, billing_document_item,
      material FK→products, reference_delivery_doc FK→deliveries, reference_delivery_item,
      billing_quantity, quantity_unit, net_amount, transaction_currency)
13. journal_entries (accounting_document, fiscal_year, company_code, gl_account,
      reference_document FK→billing_documents, customer FK→customers,
      amount, currency, clearing_date, clearing_accounting_document)
14. payments (accounting_document, accounting_document_item, fiscal_year, customer FK→customers,
      clearing_date, clearing_accounting_document, amount_in_transaction_currency,
      transaction_currency, invoice_reference, sales_document, posting_date, gl_account)

KEY RELATIONSHIPS:
- sales_orders.sold_to_party → customers.customer
- delivery_items.reference_sales_order → sales_orders.sales_order
- billing_items.reference_delivery_doc → deliveries.delivery_document
- journal_entries.reference_document → billing_documents.billing_document
- payments.customer → customers.customer
`;

const SYSTEM_PROMPT = `You are an ERP data assistant for a SAP Order-to-Cash system.

Your ONLY job is to answer questions about the ERP dataset using SQL queries on the PostgreSQL database.

${DB_SCHEMA}

RULES:
1. ONLY answer questions related to the ERP dataset.
2. If the query is NOT related to ERP data, respond ONLY with: {"type": "rejected", "reason": "This system is designed to answer questions related to the provided ERP dataset only."}
3. For valid ERP queries, respond ONLY with valid JSON:
   {"type": "sql", "intent": "lookup|aggregation|trace|analysis", "sql": "SELECT ...", "explanation": "brief description"}
4. Generate ONLY valid PostgreSQL SQL. No markdown, no code blocks.
5. Always use proper JOINs based on KEY RELATIONSHIPS.
6. LIMIT results to 100 rows max unless the user asks for aggregates.
7. For trace queries, use JOINs to show the full O2C chain.
8. Do not include any text outside the JSON response.
9. Never hallucinate column names - use ONLY the columns listed in the schema.
10. You have access to conversation context - use it for follow-up questions (e.g. "show me more about that customer").`;

const ANSWER_SYSTEM_PROMPT = `You are an ERP data assistant. Convert SQL results into clear, concise natural language.
Be factual and specific. Use numbers exactly as provided. Format currency values nicely.
Use markdown formatting: **bold** for key values, numbered lists for ranked results.
If the result is empty, say so clearly. Keep responses under 250 words.`;

// ── Domain Check ──────────────────────────────────────────────────────────
const ERP_KEYWORDS = [
  'sales order', 'delivery', 'billing', 'invoice', 'payment', 'customer', 'product',
  'material', 'journal', 'journal entry', 'accounting', 'plant', 'shipment', 'order',
  'revenue', 'amount', 'quantity', 'stock', 'item', 'trace', 'flow', 'broken',
  'fiscal', 'incoterms', 'goods movement', 'schedule line', 'erp', 'sap', 'o2c',
  'outstanding', 'cleared', 'cancelled', 'billed', 'shipped', 'dispatched',
];

function isErpRelated(query) {
  const lower = query.toLowerCase();
  return ERP_KEYWORDS.some(kw => lower.includes(kw));
}

// ── SQL Extraction & Validation ────────────────────────────────────────────
function extractJsonResponse(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

function sanitizeSql(sql) {
  if (!sql) return null;
  const upper = sql.trim().toUpperCase();
  if (!upper.startsWith('SELECT')) throw new Error('Only SELECT queries are permitted');
  const dangerous = ['DROP ', 'DELETE ', 'INSERT ', 'UPDATE ', 'TRUNCATE ', 'ALTER ', 'CREATE ', 'GRANT '];
  for (const d of dangerous) {
    if (upper.includes(d)) throw new Error(`Unsafe SQL operation detected: ${d}`);
  }
  return sql;
}

// ── Node Highlight Extraction ──────────────────────────────────────────────
function extractHighlightedNodes(rows, sql) {
  const highlighted = [];
  if (!rows || rows.length === 0) return highlighted;
  const sqlUpper = sql.toUpperCase();

  for (const row of rows.slice(0, 30)) {
    if (row.billing_document)  highlighted.push(`bill_${row.billing_document}`);
    if (row.sales_order)       highlighted.push(`so_${row.sales_order}`);
    if (row.delivery_document) highlighted.push(`del_${row.delivery_document}`);

    const custVal = row.customer || row.sold_to_party;
    if (custVal && String(custVal).length <= 20) highlighted.push(`customer_${custVal}`);

    if (row.accounting_document && (sqlUpper.includes('JOURNAL') || sqlUpper.includes('GL_ACCOUNT') || sqlUpper.includes('CLEARING'))) {
      if (row.fiscal_year) highlighted.push(`je_${row.accounting_document}_${row.fiscal_year}`);
      highlighted.push(`je_${row.accounting_document}`);
    }
    if (row.accounting_document && (sqlUpper.includes('PAYMENT') || sqlUpper.includes('POSTING_DATE') || sqlUpper.includes('CLEARING_DATE'))) {
      if (row.fiscal_year) highlighted.push(`pay_${row.accounting_document}_${row.fiscal_year}`);
      highlighted.push(`pay_${row.accounting_document}`);
    }
    if (row.material) highlighted.push(`prod_${row.material}`);
  }
  return [...new Set(highlighted)];
}

// ── Build conversation context for NL→SQL prompt ──────────────────────────
function buildConversationContents(userQuery, history) {
  // history = [{role:'user'|'assistant', content:string, sql:string|null}]
  const contents = [];

  // Add last 6 turns for context (3 user+assistant pairs)
  const recent = history.slice(-6);
  for (const msg of recent) {
    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'assistant' && msg.content) {
      // Give the model a summary of what it previously answered
      const summary = msg.sql
        ? `I answered with SQL: ${msg.sql.substring(0, 200)}\nAnswer: ${msg.content.substring(0, 300)}`
        : msg.content.substring(0, 300);
      contents.push({ role: 'model', parts: [{ text: summary }] });
    }
  }

  // Add current query
  contents.push({ role: 'user', parts: [{ text: userQuery }] });
  return contents;
}

// ── Main Query Pipeline (non-streaming) ───────────────────────────────────
async function processQuery(userQuery, conversationHistory = []) {
  logger.info(`Processing query: "${userQuery}" (history: ${conversationHistory.length} turns)`);

  if (!isErpRelated(userQuery)) {
    return {
      type: 'rejected',
      answer: 'This system is designed to answer questions related to the provided ERP dataset only. Please ask about sales orders, deliveries, billing documents, customers, products, payments, or journal entries.',
      sql: null, data: null, highlightedNodes: [],
    };
  }

  const model = genAI.getGenerativeModel(
    { model: 'gemini-2.5-flash' },
    PREVIEW_REQUEST_OPTIONS
  );

  // ── Step 1: NL → SQL (with conversation context) ─────────────────────────
  const sqlContents = buildConversationContents(userQuery, conversationHistory);
  const sqlResponse = await model.generateContent({
    systemInstruction: SYSTEM_PROMPT,
    contents: sqlContents,
  });

  const sqlText = sqlResponse.response.text().trim();
  logger.info(`LLM SQL response: ${sqlText.substring(0, 300)}`);

  const parsed = extractJsonResponse(sqlText);

  if (!parsed) {
    return { type: 'error', answer: 'Could not parse AI response. Please rephrase.', sql: null, data: null, highlightedNodes: [] };
  }
  if (parsed.type === 'rejected') {
    return { type: 'rejected', answer: parsed.reason, sql: null, data: null, highlightedNodes: [] };
  }

  // ── Step 2: Execute SQL ───────────────────────────────────────────────────
  let sql, rows;
  try {
    sql = sanitizeSql(parsed.sql);
    logger.info(`Executing SQL: ${sql.substring(0, 200)}`);
    const result = await pool.query(sql);
    rows = result.rows;
    logger.info(`SQL returned ${rows.length} rows`);
  } catch (err) {
    logger.error('SQL execution error:', err.message);
    return { type: 'error', answer: `SQL error: ${err.message}. Try rephrasing.`, sql: parsed.sql, data: null, highlightedNodes: [] };
  }

  // ── Step 3: Results → Natural Language ───────────────────────────────────
  const resultSummary = rows.length === 0 ? 'No data found.' : JSON.stringify(rows.slice(0, 50), null, 2);
  const answerPrompt = `User question: "${userQuery}"

SQL executed: ${sql}

Query results (${rows.length} rows total):
${resultSummary}

Provide a clear, natural language answer. Use markdown formatting.`;

  const answerResponse = await model.generateContent({
    systemInstruction: ANSWER_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: answerPrompt }] }],
  });

  const answer = answerResponse.response.text().trim();
  return {
    type: 'success',
    intent: parsed.intent,
    answer,
    sql,
    data: rows.slice(0, 50),
    rowCount: rows.length,
    highlightedNodes: extractHighlightedNodes(rows, sql),
  };
}

// ── Streaming Pipeline ─────────────────────────────────────────────────────
// Runs NL→SQL→Execute (not streamed), then STREAMS the NL answer.
// Calls onChunk(text) for each token, resolves with full result object.
async function processQueryStream(userQuery, conversationHistory = [], onChunk) {
  logger.info(`Stream query: "${userQuery}"`);

  if (!isErpRelated(userQuery)) {
    const msg = 'This system is designed to answer questions related to the provided ERP dataset only.';
    onChunk(msg);
    return { type: 'rejected', answer: msg, sql: null, data: null, highlightedNodes: [], rowCount: 0 };
  }

  const model = genAI.getGenerativeModel(
    { model: 'gemini-2.5-flash' },
    PREVIEW_REQUEST_OPTIONS
  );

  // Step 1: NL → SQL (not streamed — need full JSON before executing)
  const sqlContents = buildConversationContents(userQuery, conversationHistory);
  const sqlResponse = await model.generateContent({
    systemInstruction: SYSTEM_PROMPT,
    contents: sqlContents,
  });
  const sqlText = sqlResponse.response.text().trim();
  const parsed  = extractJsonResponse(sqlText);

  if (!parsed) {
    const msg = 'Could not parse AI response. Please rephrase your query.';
    onChunk(msg);
    return { type: 'error', answer: msg, sql: null, data: null, highlightedNodes: [], rowCount: 0 };
  }
  if (parsed.type === 'rejected') {
    onChunk(parsed.reason);
    return { type: 'rejected', answer: parsed.reason, sql: null, data: null, highlightedNodes: [], rowCount: 0 };
  }

  // Step 2: Execute SQL
  let sql, rows;
  try {
    sql = sanitizeSql(parsed.sql);
    const result = await pool.query(sql);
    rows = result.rows;
    logger.info(`SQL returned ${rows.length} rows`);
  } catch (err) {
    const msg = `SQL error: ${err.message}. Try rephrasing.`;
    onChunk(msg);
    return { type: 'error', answer: msg, sql: parsed.sql, data: null, highlightedNodes: [], rowCount: 0 };
  }

  // Step 3: STREAM the NL answer
  const resultSummary = rows.length === 0 ? 'No data found.' : JSON.stringify(rows.slice(0, 50), null, 2);
  const answerPrompt = `User question: "${userQuery}"
SQL executed: ${sql}
Query results (${rows.length} rows total):
${resultSummary}
Provide a clear, natural language answer. Use markdown formatting. Use **bold** for key values and numbered lists for rankings.`;

  let fullAnswer = '';
  const streamResult = await model.generateContentStream({
    systemInstruction: ANSWER_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: answerPrompt }] }],
  });

  for await (const chunk of streamResult.stream) {
    const text = chunk.text();
    if (text) {
      fullAnswer += text;
      onChunk(text);
    }
  }

  return {
    type: 'success',
    intent: parsed.intent,
    answer: fullAnswer,
    sql,
    data: rows.slice(0, 50),
    rowCount: rows.length,
    highlightedNodes: extractHighlightedNodes(rows, sql),
  };
}

module.exports = { processQuery, processQueryStream };
