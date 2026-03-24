/**
 * Graph Service
 * Builds a graph representation of ERP data from PostgreSQL.
 * Returns nodes and edges for visualization.
 */

const pool = require('../db/pool');
const logger = require('../utils/logger');

// Node type colors for frontend
const NODE_TYPES = {
  Customer: 'customer',
  SalesOrder: 'salesOrder',
  Delivery: 'delivery',
  BillingDocument: 'billing',
  JournalEntry: 'journal',
  Payment: 'payment',
  Product: 'product',
};

/**
 * Build and return the full graph.
 * For performance, we limit to a representative sample.
 */
async function buildGraph(options = {}) {
  const { limit = 200 } = options;
  const client = await pool.connect();

  try {
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    function addNode(id, type, label, data = {}) {
      if (nodeSet.has(id)) return;
      nodeSet.add(id);
      nodes.push({ id, type, label, data });
    }

    // ── Customers ──────────────────────────────────────────────────
    const customers = await client.query(
      `SELECT customer, full_name, name, bp_category, is_blocked
       FROM customers LIMIT $1`, [limit]
    );
    for (const c of customers.rows) {
      addNode(`customer_${c.customer}`, 'Customer',
        c.full_name || c.name || c.customer,
        { id: c.customer, type: 'Customer', fullName: c.full_name, name: c.name, isBlocked: c.is_blocked }
      );
    }

    // ── Sales Orders ───────────────────────────────────────────────
    const salesOrders = await client.query(
      `SELECT so.sales_order, so.sold_to_party, so.sales_order_type,
              so.requested_delivery_date, so.creation_date,
              so.delivery_block_reason, so.header_billing_block, so.incoterms,
              COUNT(soi.sales_order_item) as item_count
       FROM sales_orders so
       LEFT JOIN sales_order_items soi USING (sales_order)
       GROUP BY so.sales_order
       LIMIT $1`, [limit]
    );
    for (const so of salesOrders.rows) {
      addNode(`so_${so.sales_order}`, 'SalesOrder',
        `SO ${so.sales_order}`,
        {
          id: so.sales_order, type: 'SalesOrder',
          soldToParty: so.sold_to_party,
          orderType: so.sales_order_type,
          requestedDeliveryDate: so.requested_delivery_date,
          creationDate: so.creation_date,
          itemCount: parseInt(so.item_count),
          deliveryBlock: so.delivery_block_reason,
          billingBlock: so.header_billing_block,
          incoterms: so.incoterms,
        }
      );
      // Edge: SalesOrder → Customer
      if (so.sold_to_party) {
        edges.push({
          id: `so_cust_${so.sales_order}`,
          source: `so_${so.sales_order}`,
          target: `customer_${so.sold_to_party}`,
          label: 'soldTo',
          type: 'so_customer',
        });
      }
    }

    // ── Deliveries ─────────────────────────────────────────────────
    const deliveries = await client.query(
      `SELECT d.delivery_document, d.shipping_point, d.creation_date,
              d.overall_goods_movement_status, d.overall_picking_status,
              d.delivery_block_reason, d.incompletion_status,
              di.reference_sales_order
       FROM deliveries d
       LEFT JOIN delivery_items di ON di.delivery_document = d.delivery_document
       GROUP BY d.delivery_document, di.reference_sales_order
       LIMIT $1`, [limit]
    );
    for (const d of deliveries.rows) {
      addNode(`del_${d.delivery_document}`, 'Delivery',
        `DEL ${d.delivery_document}`,
        {
          id: d.delivery_document, type: 'Delivery',
          shippingPoint: d.shipping_point,
          creationDate: d.creation_date,
          goodsMovementStatus: d.overall_goods_movement_status,
          pickingStatus: d.overall_picking_status,
          deliveryBlock: d.delivery_block_reason,
          incompletionStatus: d.incompletion_status,
        }
      );
      // Edge: SalesOrder → Delivery
      if (d.reference_sales_order) {
        edges.push({
          id: `so_del_${d.delivery_document}_${d.reference_sales_order}`,
          source: `so_${d.reference_sales_order}`,
          target: `del_${d.delivery_document}`,
          label: 'hasDelivery',
          type: 'so_delivery',
        });
      }
    }

    // ── Billing Documents ──────────────────────────────────────────
    const billings = await client.query(
      `SELECT bd.billing_document, bd.billing_document_type, bd.sold_to_party,
              bd.accounting_document, bd.total_net_amount, bd.transaction_currency,
              bd.creation_date, bd.is_cancelled,
              ARRAY_AGG(DISTINCT bi.reference_delivery_doc) FILTER (WHERE bi.reference_delivery_doc IS NOT NULL) as delivery_docs
       FROM billing_documents bd
       LEFT JOIN billing_items bi ON bi.billing_document = bd.billing_document
       GROUP BY bd.billing_document
       LIMIT $1`, [limit]
    );
    for (const b of billings.rows) {
      addNode(`bill_${b.billing_document}`, 'BillingDocument',
        `BILL ${b.billing_document}`,
        {
          id: b.billing_document, type: 'BillingDocument',
          documentType: b.billing_document_type,
          soldToParty: b.sold_to_party,
          accountingDocument: b.accounting_document,
          totalNetAmount: parseFloat(b.total_net_amount || 0),
          currency: b.transaction_currency,
          creationDate: b.creation_date,
          isCancelled: b.is_cancelled,
        }
      );
      // Edge: Delivery → Billing
      for (const delDoc of (b.delivery_docs || [])) {
        if (delDoc) {
          edges.push({
            id: `del_bill_${delDoc}_${b.billing_document}`,
            source: `del_${delDoc}`,
            target: `bill_${b.billing_document}`,
            label: 'billed',
            type: 'delivery_billing',
          });
        }
      }
    }

    // ── Journal Entries ────────────────────────────────────────────
    const journals = await client.query(
      `SELECT accounting_document, fiscal_year, company_code,
              reference_document, customer,
              SUM(amount) as total_amount, currency,
              MAX(clearing_date) as clearing_date
       FROM journal_entries
       WHERE reference_document IS NOT NULL
       GROUP BY accounting_document, fiscal_year, company_code, reference_document, customer, currency
       LIMIT $1`, [limit]
    );
    for (const j of journals.rows) {
      const jId = `je_${j.accounting_document}_${j.fiscal_year}`;
      addNode(jId, 'JournalEntry',
        `JE ${j.accounting_document}`,
        {
          id: j.accounting_document, type: 'JournalEntry',
          fiscalYear: j.fiscal_year,
          companyCode: j.company_code,
          referenceDocument: j.reference_document,
          totalAmount: parseFloat(j.total_amount || 0),
          currency: j.currency,
          clearingDate: j.clearing_date,
        }
      );
      // Edge: BillingDocument → JournalEntry
      if (j.reference_document) {
        edges.push({
          id: `bill_je_${j.reference_document}_${j.accounting_document}`,
          source: `bill_${j.reference_document}`,
          target: jId,
          label: 'posted',
          type: 'billing_journal',
        });
      }
    }

    // ── Payments ───────────────────────────────────────────────────
    const payments = await client.query(
      `SELECT accounting_document, fiscal_year, customer,
              SUM(amount_in_transaction_currency) as total_amount,
              transaction_currency, MAX(clearing_date) as clearing_date,
              MAX(posting_date) as posting_date,
              MAX(clearing_accounting_document) as clearing_accounting_document
       FROM payments
       WHERE customer IS NOT NULL
       GROUP BY accounting_document, fiscal_year, customer, transaction_currency
       LIMIT $1`, [Math.floor(limit / 2)]
    );

    // Collect customer IDs referenced by payments that are NOT already nodes
    const missingCustomerIds = [...new Set(
      payments.rows.map(p => p.customer).filter(c => c && !nodeSet.has(`customer_${c}`))
    )];

    // Load missing customers so payment edges are never dangling
    if (missingCustomerIds.length > 0) {
      const extra = await client.query(
        `SELECT customer, full_name, name, is_blocked FROM customers WHERE customer = ANY($1)`,
        [missingCustomerIds]
      );
      for (const c of extra.rows) {
        addNode(`customer_${c.customer}`, 'Customer',
          c.full_name || c.name || c.customer,
          { id: c.customer, type: 'Customer', fullName: c.full_name, name: c.name, isBlocked: c.is_blocked }
        );
      }
    }

    for (const p of payments.rows) {
      const pId = `pay_${p.accounting_document}_${p.fiscal_year}`;
      addNode(pId, 'Payment',
        `PAY ${p.accounting_document}`,
        {
          id: p.accounting_document, type: 'Payment',
          fiscalYear: p.fiscal_year,
          customer: p.customer,
          totalAmount: parseFloat(p.total_amount || 0),
          currency: p.transaction_currency,
          clearingDate: p.clearing_date,
          postingDate: p.posting_date,
          clearingAccountingDocument: p.clearing_accounting_document,
        }
      );

      // Edge: Customer → Payment
      if (p.customer) {
        edges.push({
          id: `cust_pay_${p.customer}_${p.accounting_document}`,
          source: `customer_${p.customer}`,
          target: pId,
          label: 'paid',
          type: 'customer_payment',
        });
      }

      // Edge: JournalEntry → Payment (via clearing_accounting_document)
      // This links the payment back into the billing chain
      if (p.clearing_accounting_document) {
        const jeId = `je_${p.clearing_accounting_document}_${p.fiscal_year}`;
        if (nodeSet.has(jeId)) {
          edges.push({
            id: `je_pay_${p.clearing_accounting_document}_${p.accounting_document}`,
            source: jeId,
            target: pId,
            label: 'cleared',
            type: 'billing_journal',
          });
        }
      }
    }


    // Deduplicate edges
    const edgeSet = new Set();
    const uniqueEdges = edges.filter(e => {
      if (edgeSet.has(e.id)) return false;
      edgeSet.add(e.id);
      // Only include edge if both nodes exist
      return nodeSet.has(e.source) && nodeSet.has(e.target);
    });

    logger.info(`Graph built: ${nodes.length} nodes, ${uniqueEdges.length} edges`);
    return { nodes, edges: uniqueEdges };

  } finally {
    client.release();
  }
}

/**
 * Get details for a specific node by type and id
 */
async function getNodeDetails(nodeType, nodeId) {
  const client = await pool.connect();
  try {
    switch (nodeType) {
      case 'SalesOrder':
        return await getSalesOrderDetails(client, nodeId);
      case 'Delivery':
        return await getDeliveryDetails(client, nodeId);
      case 'BillingDocument':
        return await getBillingDetails(client, nodeId);
      case 'Customer':
        return await getCustomerDetails(client, nodeId);
      case 'JournalEntry':
        return await getJournalDetails(client, nodeId);
      case 'Payment':
        return await getPaymentDetails(client, nodeId);
      default:
        return null;
    }
  } finally {
    client.release();
  }
}

async function getSalesOrderDetails(client, id) {
  const { rows: [so] } = await client.query(
    `SELECT so.*, c.full_name as customer_name
     FROM sales_orders so
     LEFT JOIN customers c ON c.customer = so.sold_to_party
     WHERE so.sales_order = $1`, [id]
  );
  const { rows: items } = await client.query(
    `SELECT soi.*, pd.description as product_name
     FROM sales_order_items soi
     LEFT JOIN product_descriptions pd ON pd.product = soi.material AND pd.language = 'EN'
     WHERE soi.sales_order = $1`, [id]
  );
  return { ...so, items };
}

async function getDeliveryDetails(client, id) {
  const { rows: [d] } = await client.query(
    `SELECT * FROM deliveries WHERE delivery_document = $1`, [id]
  );
  const { rows: items } = await client.query(
    `SELECT di.*, pd.description as product_name
     FROM delivery_items di
     LEFT JOIN product_descriptions pd ON pd.product = di.material AND pd.language = 'EN'
     WHERE di.delivery_document = $1`, [id]
  );
  return { ...d, items };
}

async function getBillingDetails(client, id) {
  const { rows: [b] } = await client.query(
    `SELECT bd.*, c.full_name as customer_name
     FROM billing_documents bd
     LEFT JOIN customers c ON c.customer = bd.sold_to_party
     WHERE bd.billing_document = $1`, [id]
  );
  const { rows: items } = await client.query(
    `SELECT bi.*, pd.description as product_name
     FROM billing_items bi
     LEFT JOIN product_descriptions pd ON pd.product = bi.material AND pd.language = 'EN'
     WHERE bi.billing_document = $1`, [id]
  );
  return { ...b, items };
}

async function getCustomerDetails(client, id) {
  const { rows: [c] } = await client.query(
    `SELECT cu.*, ca.street_name, ca.city_name, ca.country, ca.postal_code
     FROM customers cu
     LEFT JOIN customer_addresses ca ON ca.business_partner = cu.customer
     WHERE cu.customer = $1 LIMIT 1`, [id]
  );
  const { rows: orders } = await client.query(
    `SELECT sales_order, sales_order_type, creation_date, requested_delivery_date
     FROM sales_orders WHERE sold_to_party = $1 LIMIT 10`, [id]
  );
  return { ...c, recentOrders: orders };
}

async function getJournalDetails(client, id) {
  const { rows } = await client.query(
    `SELECT * FROM journal_entries WHERE accounting_document = $1`, [id]
  );
  return rows;
}

async function getPaymentDetails(client, id) {
  const { rows } = await client.query(
    `SELECT * FROM payments WHERE accounting_document = $1 LIMIT 20`, [id]
  );
  return rows;
}

/**
 * Trace the full flow of a billing document:
 * BillingDocument → Delivery → SalesOrder → Customer + JournalEntry
 */
async function traceFlow(billingDocId) {
  const client = await pool.connect();
  try {
    const trace = { billingDocument: null, deliveries: [], salesOrders: [], customer: null, journalEntries: [] };

    // Billing doc
    const { rows: [bd] } = await client.query(
      `SELECT * FROM billing_documents WHERE billing_document = $1`, [billingDocId]
    );
    if (!bd) return null;
    trace.billingDocument = bd;

    // Deliveries via billing items
    const { rows: deliveries } = await client.query(
      `SELECT DISTINCT d.* FROM deliveries d
       JOIN billing_items bi ON bi.reference_delivery_doc = d.delivery_document
       WHERE bi.billing_document = $1`, [billingDocId]
    );
    trace.deliveries = deliveries;

    // Sales orders via delivery items
    if (deliveries.length > 0) {
      const deliveryIds = deliveries.map(d => d.delivery_document);
      const { rows: salesOrders } = await client.query(
        `SELECT DISTINCT so.* FROM sales_orders so
         JOIN delivery_items di ON di.reference_sales_order = so.sales_order
         WHERE di.delivery_document = ANY($1)`, [deliveryIds]
      );
      trace.salesOrders = salesOrders;
    }

    // Customer
    if (bd.sold_to_party) {
      const { rows: [c] } = await client.query(
        `SELECT * FROM customers WHERE customer = $1`, [bd.sold_to_party]
      );
      trace.customer = c;
    }

    // Journal entries
    const { rows: journals } = await client.query(
      `SELECT * FROM journal_entries WHERE reference_document = $1`, [billingDocId]
    );
    trace.journalEntries = journals;

    return trace;
  } finally {
    client.release();
  }
}

/**
 * Find broken flows:
 * - Sales orders with deliveries but no billing
 * - Sales orders with neither delivery nor billing
 */
async function findBrokenFlows() {
  const client = await pool.connect();
  try {
    // Orders delivered but not billed
    const { rows: deliveredNotBilled } = await client.query(`
      SELECT DISTINCT so.sales_order, so.creation_date, so.sold_to_party,
        c.full_name as customer_name,
        'Delivered but not billed' as issue
      FROM sales_orders so
      JOIN delivery_items di ON di.reference_sales_order = so.sales_order
      JOIN deliveries d ON d.delivery_document = di.delivery_document
      LEFT JOIN billing_items bi ON bi.reference_delivery_doc = di.delivery_document
      WHERE bi.billing_document IS NULL
      LIMIT 50
    `);

    // Orders not delivered at all
    const { rows: notDelivered } = await client.query(`
      SELECT DISTINCT so.sales_order, so.creation_date, so.sold_to_party,
        c.full_name as customer_name,
        'No delivery found' as issue
      FROM sales_orders so
      LEFT JOIN customers c ON c.customer = so.sold_to_party
      LEFT JOIN delivery_items di ON di.reference_sales_order = so.sales_order
      WHERE di.delivery_document IS NULL
      LIMIT 50
    `);

    // Billed without delivery
    const { rows: billedNoDelivery } = await client.query(`
      SELECT DISTINCT bd.billing_document, bd.creation_date, bd.sold_to_party,
        c.full_name as customer_name,
        'Billing without delivery' as issue
      FROM billing_documents bd
      LEFT JOIN customers c ON c.customer = bd.sold_to_party
      LEFT JOIN billing_items bi ON bi.billing_document = bd.billing_document
      WHERE bi.reference_delivery_doc IS NULL
      LIMIT 50
    `);

    return { deliveredNotBilled, notDelivered, billedNoDelivery };
  } finally {
    client.release();
  }
}

module.exports = { buildGraph, getNodeDetails, traceFlow, findBrokenFlows };
