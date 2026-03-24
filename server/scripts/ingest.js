/**
 * Data Ingestion Script
 * Reads all JSONL files from the SAP O2C dataset and upserts into PostgreSQL.
 * Run: node scripts/ingest.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(__dirname, '..', process.env.DATA_PATH)
  : path.resolve(__dirname, '../../../sap-order-to-cash-dataset/sap-o2c-data');

let inserted = {};
let errors = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(val) {
  if (!val) return null;
  try { return new Date(val).toISOString(); } catch { return null; }
}
function parseNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}
function str(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}
function bool(val) {
  if (val === null || val === undefined) return false;
  return Boolean(val);
}

/** Read a JSONL file line by line, parse each JSON line */
async function readJsonl(filePath) {
  const records = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try { records.push(JSON.parse(trimmed)); } catch {}
  }
  return records;
}

/** Get all .jsonl files recursively within a folder */
function getJsonlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(getJsonlFiles(full));
    else if (e.name.endsWith('.jsonl')) files.push(full);
  }
  return files;
}

async function upsertBatch(client, sql, rows) {
  let count = 0;
  for (const row of rows) {
    try {
      await client.query(sql, row);
      count++;
    } catch (e) {
      // Silently skip FK violations during ingestion order issues
      if (e.code !== '23503') errors.push({ sql: sql.substring(0, 60), msg: e.message });
    }
  }
  return count;
}

// ── Ingestion functions ───────────────────────────────────────────────────────

async function ingestBusinessPartners(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'business_partners'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO customers
      (customer, business_partner, full_name, name, first_name, last_name,
       bp_category, grouping, is_blocked, created_at, last_changed_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (customer) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      name = EXCLUDED.name,
      is_blocked = EXCLUDED.is_blocked,
      last_changed_at = EXCLUDED.last_changed_at`;

  const params = rows.map(r => [
    str(r.customer) || str(r.businessPartner),
    str(r.businessPartner),
    str(r.businessPartnerFullName),
    str(r.businessPartnerName) || str(r.organizationBpName1),
    str(r.firstName),
    str(r.lastName),
    str(r.businessPartnerCategory),
    str(r.businessPartnerGrouping),
    bool(r.businessPartnerIsBlocked),
    parseDate(r.creationDate),
    parseDate(r.lastChangeDate),
  ]);
  const n = await upsertBatch(client, sql, params);
  inserted['customers'] = (inserted['customers'] || 0) + n;
  console.log(`  ✓ customers: ${n} rows`);
}

async function ingestBusinessPartnerAddresses(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'business_partner_addresses'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO customer_addresses
      (business_partner, address_id, street_name, house_number, city_name, postal_code, region, country)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (business_partner, address_id) DO NOTHING`;

  const params = rows.map(r => [
    str(r.businessPartner),
    str(r.addressID) || str(r.addressId) || '0',
    str(r.streetName),
    str(r.houseNumber),
    str(r.cityName),
    str(r.postalCode),
    str(r.region),
    str(r.country),
  ]);
  const n = await upsertBatch(client, sql, params);
  console.log(`  ✓ customer_addresses: ${n} rows`);
}

async function ingestProducts(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'products'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO products
      (product, product_type, product_old_id, product_group, base_unit, division,
       industry_sector, gross_weight, net_weight, weight_unit, is_marked_for_deletion,
       created_at, last_changed_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (product) DO UPDATE SET
      product_type = EXCLUDED.product_type,
      product_group = EXCLUDED.product_group,
      last_changed_at = EXCLUDED.last_changed_at`;

  const params = rows.map(r => [
    str(r.product),
    str(r.productType),
    str(r.productOldId),
    str(r.productGroup),
    str(r.baseUnit),
    str(r.division),
    str(r.industrySector),
    parseNum(r.grossWeight),
    parseNum(r.netWeight),
    str(r.weightUnit),
    bool(r.isMarkedForDeletion),
    parseDate(r.creationDate),
    parseDate(r.lastChangeDate),
  ]).filter(p => p[0] !== null);
  const n = await upsertBatch(client, sql, params);
  inserted['products'] = (inserted['products'] || 0) + n;
  console.log(`  ✓ products: ${n} rows`);
}

async function ingestProductDescriptions(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'product_descriptions'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO product_descriptions (product, language, description)
    VALUES ($1,$2,$3)
    ON CONFLICT (product, language) DO UPDATE SET description = EXCLUDED.description`;

  const params = rows
    .filter(r => str(r.product))
    .map(r => [str(r.product), str(r.language) || 'EN', str(r.productDescription)]);
  const n = await upsertBatch(client, sql, params);
  console.log(`  ✓ product_descriptions: ${n} rows`);
}

async function ingestPlants(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'plants'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO plants (plant, plant_name, company_code, country, region, city_name)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (plant) DO NOTHING`;

  const params = rows
    .filter(r => str(r.plant))
    .map(r => [str(r.plant), str(r.plantName), str(r.companyCode), str(r.country), str(r.region), str(r.cityName)]);
  const n = await upsertBatch(client, sql, params);
  console.log(`  ✓ plants: ${n} rows`);
}

async function ingestSalesOrders(client) {
  const headerFiles = getJsonlFiles(path.join(DATA_PATH, 'sales_order_headers'));
  let headers = [];
  for (const f of headerFiles) headers = headers.concat(await readJsonl(f));

  const sql = `
    INSERT INTO sales_orders
      (sales_order, sales_order_type, sales_organization, distribution_channel,
       organization_division, sold_to_party, requested_delivery_date, creation_date,
       customer_payment_terms, total_credit_check_status, delivery_block_reason,
       header_billing_block, incoterms, incoterms_location)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (sales_order) DO NOTHING`;

  const params = headers
    .filter(r => str(r.salesOrder))
    .map(r => [
      str(r.salesOrder), str(r.salesOrderType), str(r.salesOrganization),
      str(r.distributionChannel), str(r.organizationDivision), str(r.soldToParty),
      parseDate(r.requestedDeliveryDate), parseDate(r.creationDate),
      str(r.customerPaymentTerms), str(r.totalCreditCheckStatus),
      str(r.deliveryBlockReason), str(r.headerBillingBlockReason),
      str(r.incotermsClassification), str(r.incotermsLocation1),
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['sales_orders'] = n;
  console.log(`  ✓ sales_orders: ${n} rows`);
}

async function ingestSalesOrderItems(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'sales_order_items'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO sales_order_items
      (sales_order, sales_order_item, item_category, material, requested_quantity,
       quantity_unit, net_amount, transaction_currency, material_group,
       production_plant, storage_location, rejection_reason, billing_block)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (sales_order, sales_order_item) DO NOTHING`;

  const params = rows
    .filter(r => str(r.salesOrder) && str(r.salesOrderItem))
    .map(r => [
      str(r.salesOrder), str(r.salesOrderItem), str(r.salesOrderItemCategory),
      str(r.material), parseNum(r.requestedQuantity), str(r.requestedQuantityUnit),
      parseNum(r.netAmount), str(r.transactionCurrency), str(r.materialGroup),
      str(r.productionPlant), str(r.storageLocation),
      str(r.salesDocumentRjcnReason), str(r.itemBillingBlockReason),
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['sales_order_items'] = n;
  console.log(`  ✓ sales_order_items: ${n} rows`);
}

async function ingestSalesOrderScheduleLines(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'sales_order_schedule_lines'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO sales_order_schedule_lines
      (sales_order, sales_order_item, schedule_line, delivery_document, req_qty, quantity_unit)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (sales_order, sales_order_item, schedule_line) DO NOTHING`;

  const params = rows
    .filter(r => str(r.salesOrder) && str(r.salesOrderItem) && str(r.scheduleLine))
    .map(r => [
      str(r.salesOrder), str(r.salesOrderItem), str(r.scheduleLine),
      str(r.deliveryDocument) || null, parseNum(r.requestedQuantity),
      str(r.requestedQuantityUnit),
    ]);
  const n = await upsertBatch(client, sql, params);
  console.log(`  ✓ sales_order_schedule_lines: ${n} rows`);
}

async function ingestDeliveries(client) {
  const headerFiles = getJsonlFiles(path.join(DATA_PATH, 'outbound_delivery_headers'));
  let headers = [];
  for (const f of headerFiles) headers = headers.concat(await readJsonl(f));

  const sql = `
    INSERT INTO deliveries
      (delivery_document, shipping_point, creation_date, actual_goods_movement_date,
       overall_goods_movement_status, overall_picking_status, delivery_block_reason,
       header_billing_block, incompletion_status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (delivery_document) DO NOTHING`;

  const params = headers
    .filter(r => str(r.deliveryDocument))
    .map(r => [
      str(r.deliveryDocument), str(r.shippingPoint),
      parseDate(r.creationDate), parseDate(r.actualGoodsMovementDate),
      str(r.overallGoodsMovementStatus), str(r.overallPickingStatus),
      str(r.deliveryBlockReason), str(r.headerBillingBlockReason),
      str(r.hdrGeneralIncompletionStatus),
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['deliveries'] = n;
  console.log(`  ✓ deliveries: ${n} rows`);
}

async function ingestDeliveryItems(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'outbound_delivery_items'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO delivery_items
      (delivery_document, delivery_document_item, reference_sales_order, reference_so_item,
       material, actual_delivery_qty, quantity_unit, plant, storage_location, batch, billing_block)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (delivery_document, delivery_document_item) DO NOTHING`;

  const params = rows
    .filter(r => str(r.deliveryDocument) && str(r.deliveryDocumentItem))
    .map(r => [
      str(r.deliveryDocument), str(r.deliveryDocumentItem),
      str(r.referenceSdDocument), str(r.referenceSdDocumentItem),
      str(r.material) || null, parseNum(r.actualDeliveryQuantity),
      str(r.deliveryQuantityUnit), str(r.plant) || null, str(r.storageLocation),
      str(r.batch), str(r.itemBillingBlockReason),
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['delivery_items'] = n;
  console.log(`  ✓ delivery_items: ${n} rows`);
}

async function ingestBillingDocuments(client) {
  // Include cancellations folder too
  const hFolders = ['billing_document_headers', 'billing_document_cancellations'];
  let rows = [];
  for (const folder of hFolders) {
    const files = getJsonlFiles(path.join(DATA_PATH, folder));
    for (const f of files) rows = rows.concat(await readJsonl(f));
  }
  // Deduplicate by billingDocument
  const seen = new Set();
  const unique = rows.filter(r => {
    if (!r.billingDocument || seen.has(r.billingDocument)) return false;
    seen.add(r.billingDocument);
    return true;
  });

  const sql = `
    INSERT INTO billing_documents
      (billing_document, billing_document_type, sold_to_party, accounting_document,
       total_net_amount, transaction_currency, company_code, fiscal_year,
       creation_date, is_cancelled, cancelled_billing_doc)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (billing_document) DO UPDATE SET
      is_cancelled = EXCLUDED.is_cancelled,
      cancelled_billing_doc = EXCLUDED.cancelled_billing_doc`;

  const params = unique
    .filter(r => str(r.billingDocument))
    .map(r => [
      str(r.billingDocument), str(r.billingDocumentType), str(r.soldToParty),
      str(r.accountingDocument), parseNum(r.totalNetAmount),
      str(r.transactionCurrency), str(r.companyCode), str(r.fiscalYear),
      parseDate(r.creationDate), bool(r.billingDocumentIsCancelled),
      str(r.cancelledBillingDocument) || null,
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['billing_documents'] = n;
  console.log(`  ✓ billing_documents: ${n} rows`);
}

async function ingestBillingItems(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'billing_document_items'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO billing_items
      (billing_document, billing_document_item, material, reference_delivery_doc,
       reference_delivery_item, billing_quantity, quantity_unit, net_amount, transaction_currency)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (billing_document, billing_document_item) DO NOTHING`;

  const params = rows
    .filter(r => str(r.billingDocument) && str(r.billingDocumentItem))
    .map(r => [
      str(r.billingDocument), str(r.billingDocumentItem),
      str(r.material) || null, str(r.referenceSdDocument) || null,
      str(r.referenceSdDocumentItem), parseNum(r.billingQuantity),
      str(r.billingQuantityUnit), parseNum(r.netAmount), str(r.transactionCurrency),
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['billing_items'] = n;
  console.log(`  ✓ billing_items: ${n} rows`);
}

async function ingestJournalEntries(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'journal_entry_items_accounts_receivable'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO journal_entries
      (accounting_document, fiscal_year, company_code, gl_account, reference_document,
       customer, profit_center, cost_center, amount, currency,
       clearing_date, clearing_accounting_document, clearing_doc_fiscal_year)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (accounting_document, fiscal_year, gl_account) DO NOTHING`;

  const params = rows
    .filter(r => str(r.accountingDocument) && str(r.fiscalYear) && str(r.glAccount))
    .map(r => [
      str(r.accountingDocument), str(r.fiscalYear), str(r.companyCode),
      str(r.glAccount), str(r.referenceDocument) || null,
      str(r.customer) || null, str(r.profitCenter), str(r.costCenter),
      parseNum(r.amountInTransactionCurrency || r.amount),
      str(r.transactionCurrency || r.currency),
      parseDate(r.clearingDate), str(r.clearingAccountingDocument) || null,
      str(r.clearingDocFiscalYear),
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['journal_entries'] = n;
  console.log(`  ✓ journal_entries: ${n} rows`);
}

async function ingestPayments(client) {
  const files = getJsonlFiles(path.join(DATA_PATH, 'payments_accounts_receivable'));
  let rows = [];
  for (const f of files) rows = rows.concat(await readJsonl(f));

  const sql = `
    INSERT INTO payments
      (accounting_document, accounting_document_item, company_code, fiscal_year,
       customer, clearing_date, clearing_accounting_document, clearing_doc_fiscal_year,
       amount_in_transaction_currency, transaction_currency, amount_in_company_code_currency,
       company_code_currency, invoice_reference, sales_document, posting_date,
       document_date, gl_account, profit_center)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT (accounting_document, accounting_document_item, fiscal_year) DO NOTHING`;

  const params = rows
    .filter(r => str(r.accountingDocument) && str(r.accountingDocumentItem) && str(r.fiscalYear))
    .map(r => [
      str(r.accountingDocument), str(r.accountingDocumentItem),
      str(r.companyCode), str(r.fiscalYear), str(r.customer) || null,
      parseDate(r.clearingDate), str(r.clearingAccountingDocument) || null,
      str(r.clearingDocFiscalYear), parseNum(r.amountInTransactionCurrency),
      str(r.transactionCurrency), parseNum(r.amountInCompanyCodeCurrency),
      str(r.companyCodeCurrency), str(r.invoiceReference) || null,
      str(r.salesDocument) || null, parseDate(r.postingDate),
      parseDate(r.documentDate), str(r.glAccount), str(r.profitCenter),
    ]);
  const n = await upsertBatch(client, sql, params);
  inserted['payments'] = n;
  console.log(`  ✓ payments: ${n} rows`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Starting ERP data ingestion...');
  console.log(`   Data path: ${DATA_PATH}\n`);

  const client = await pool.connect();
  try {
    // Apply schema
    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Schema applied\n');

    // Ingest in FK-safe order
    await ingestBusinessPartners(client);
    await ingestBusinessPartnerAddresses(client);
    await ingestProducts(client);
    await ingestProductDescriptions(client);
    await ingestPlants(client);
    await ingestSalesOrders(client);
    await ingestSalesOrderItems(client);
    await ingestSalesOrderScheduleLines(client);
    await ingestDeliveries(client);
    await ingestDeliveryItems(client);
    await ingestBillingDocuments(client);
    await ingestBillingItems(client);
    await ingestJournalEntries(client);
    await ingestPayments(client);

    console.log('\n✅ Ingestion complete!');
    console.log('\nRow counts:', inserted);
    if (errors.length > 0) {
      console.warn(`\n⚠️  ${errors.length} non-critical errors (FK mismatches):`, errors.slice(0, 5));
    }
  } catch (err) {
    console.error('❌ Fatal ingestion error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
