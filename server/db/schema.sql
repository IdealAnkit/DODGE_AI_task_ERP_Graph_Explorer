-- ERP Graph System - PostgreSQL Schema
-- SAP Order-to-Cash Dataset

-- ============================================================
-- Customers (Business Partners)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  customer          VARCHAR(50) PRIMARY KEY,
  business_partner  VARCHAR(50),
  full_name         TEXT,
  name              VARCHAR(255),
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  bp_category       VARCHAR(10),
  grouping          VARCHAR(20),
  is_blocked        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ,
  last_changed_at   TIMESTAMPTZ
);

-- Business partner addresses (linked to customers)
CREATE TABLE IF NOT EXISTS customer_addresses (
  business_partner  VARCHAR(50) REFERENCES customers(customer) ON DELETE CASCADE,
  address_id        VARCHAR(50),
  street_name       VARCHAR(255),
  house_number      VARCHAR(50),
  city_name         VARCHAR(100),
  postal_code       VARCHAR(20),
  region            VARCHAR(50),
  country           VARCHAR(10),
  PRIMARY KEY (business_partner, address_id)
);

-- ============================================================
-- Products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  product               VARCHAR(100) PRIMARY KEY,
  product_type          VARCHAR(20),
  product_old_id        VARCHAR(100),
  product_group         VARCHAR(50),
  base_unit             VARCHAR(10),
  division              VARCHAR(10),
  industry_sector       VARCHAR(10),
  gross_weight          NUMERIC(15,4),
  net_weight            NUMERIC(15,4),
  weight_unit           VARCHAR(10),
  is_marked_for_deletion BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ,
  last_changed_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_descriptions (
  product       VARCHAR(100) REFERENCES products(product) ON DELETE CASCADE,
  language      VARCHAR(10),
  description   TEXT,
  PRIMARY KEY (product, language)
);

-- ============================================================
-- Plants
-- ============================================================
CREATE TABLE IF NOT EXISTS plants (
  plant         VARCHAR(20) PRIMARY KEY,
  plant_name    VARCHAR(255),
  company_code  VARCHAR(20),
  country       VARCHAR(10),
  region        VARCHAR(50),
  city_name     VARCHAR(100)
);

-- ============================================================
-- Sales Orders
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_orders (
  sales_order               VARCHAR(50) PRIMARY KEY,
  sales_order_type          VARCHAR(10),
  sales_organization        VARCHAR(20),
  distribution_channel      VARCHAR(10),
  organization_division     VARCHAR(10),
  sold_to_party             VARCHAR(50) REFERENCES customers(customer) ON DELETE SET NULL,
  requested_delivery_date   DATE,
  creation_date             TIMESTAMPTZ,
  customer_payment_terms    VARCHAR(20),
  total_credit_check_status VARCHAR(10),
  delivery_block_reason     VARCHAR(10),
  header_billing_block      VARCHAR(10),
  incoterms                 VARCHAR(20),
  incoterms_location        VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  sales_order               VARCHAR(50) REFERENCES sales_orders(sales_order) ON DELETE CASCADE,
  sales_order_item          VARCHAR(10),
  item_category             VARCHAR(10),
  material                  VARCHAR(100) REFERENCES products(product) ON DELETE SET NULL,
  requested_quantity        NUMERIC(15,4),
  quantity_unit             VARCHAR(10),
  net_amount                NUMERIC(15,2),
  transaction_currency      VARCHAR(10),
  material_group            VARCHAR(50),
  production_plant          VARCHAR(20),
  storage_location          VARCHAR(20),
  rejection_reason          VARCHAR(10),
  billing_block             VARCHAR(10),
  PRIMARY KEY (sales_order, sales_order_item)
);

CREATE TABLE IF NOT EXISTS sales_order_schedule_lines (
  sales_order       VARCHAR(50),
  sales_order_item  VARCHAR(10),
  schedule_line     VARCHAR(10),
  delivery_document VARCHAR(50),
  req_qty           NUMERIC(15,4),
  quantity_unit     VARCHAR(10),
  PRIMARY KEY (sales_order, sales_order_item, schedule_line),
  FOREIGN KEY (sales_order, sales_order_item) REFERENCES sales_order_items(sales_order, sales_order_item) ON DELETE CASCADE
);

-- ============================================================
-- Deliveries
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
  delivery_document               VARCHAR(50) PRIMARY KEY,
  shipping_point                  VARCHAR(20),
  creation_date                   TIMESTAMPTZ,
  actual_goods_movement_date      DATE,
  overall_goods_movement_status   VARCHAR(5),
  overall_picking_status          VARCHAR(5),
  delivery_block_reason           VARCHAR(10),
  header_billing_block            VARCHAR(10),
  incompletion_status             VARCHAR(5)
);

CREATE TABLE IF NOT EXISTS delivery_items (
  delivery_document       VARCHAR(50) REFERENCES deliveries(delivery_document) ON DELETE CASCADE,
  delivery_document_item  VARCHAR(10),
  reference_sales_order   VARCHAR(50) REFERENCES sales_orders(sales_order) ON DELETE SET NULL,
  reference_so_item       VARCHAR(10),
  material                VARCHAR(100) REFERENCES products(product) ON DELETE SET NULL,
  actual_delivery_qty     NUMERIC(15,4),
  quantity_unit           VARCHAR(10),
  plant                   VARCHAR(20) REFERENCES plants(plant) ON DELETE SET NULL,
  storage_location        VARCHAR(20),
  batch                   VARCHAR(50),
  billing_block           VARCHAR(10),
  PRIMARY KEY (delivery_document, delivery_document_item)
);

-- ============================================================
-- Billing Documents
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_documents (
  billing_document          VARCHAR(50) PRIMARY KEY,
  billing_document_type     VARCHAR(10),
  sold_to_party             VARCHAR(50) REFERENCES customers(customer) ON DELETE SET NULL,
  accounting_document       VARCHAR(50),
  total_net_amount          NUMERIC(15,2),
  transaction_currency      VARCHAR(10),
  company_code              VARCHAR(20),
  fiscal_year               VARCHAR(10),
  creation_date             TIMESTAMPTZ,
  is_cancelled              BOOLEAN DEFAULT FALSE,
  cancelled_billing_doc     VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS billing_items (
  billing_document          VARCHAR(50) REFERENCES billing_documents(billing_document) ON DELETE CASCADE,
  billing_document_item     VARCHAR(10),
  material                  VARCHAR(100) REFERENCES products(product) ON DELETE SET NULL,
  reference_delivery_doc    VARCHAR(50) REFERENCES deliveries(delivery_document) ON DELETE SET NULL,
  reference_delivery_item   VARCHAR(10),
  billing_quantity          NUMERIC(15,4),
  quantity_unit             VARCHAR(10),
  net_amount                NUMERIC(15,2),
  transaction_currency      VARCHAR(10),
  PRIMARY KEY (billing_document, billing_document_item)
);

-- ============================================================
-- Journal Entries (Accounts Receivable)
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  accounting_document           VARCHAR(50),
  fiscal_year                   VARCHAR(10),
  company_code                  VARCHAR(20),
  gl_account                    VARCHAR(20),
  reference_document            VARCHAR(50) REFERENCES billing_documents(billing_document) ON DELETE SET NULL,
  customer                      VARCHAR(50) REFERENCES customers(customer) ON DELETE SET NULL,
  profit_center                 VARCHAR(20),
  cost_center                   VARCHAR(20),
  amount                        NUMERIC(15,2),
  currency                      VARCHAR(10),
  clearing_date                 DATE,
  clearing_accounting_document  VARCHAR(50),
  clearing_doc_fiscal_year      VARCHAR(10),
  PRIMARY KEY (accounting_document, fiscal_year, gl_account)
);

-- ============================================================
-- Payments (Accounts Receivable)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  accounting_document           VARCHAR(50),
  accounting_document_item      VARCHAR(10),
  company_code                  VARCHAR(20),
  fiscal_year                   VARCHAR(10),
  customer                      VARCHAR(50) REFERENCES customers(customer) ON DELETE SET NULL,
  clearing_date                 DATE,
  clearing_accounting_document  VARCHAR(50),
  clearing_doc_fiscal_year      VARCHAR(10),
  amount_in_transaction_currency NUMERIC(15,2),
  transaction_currency          VARCHAR(10),
  amount_in_company_code_currency NUMERIC(15,2),
  company_code_currency         VARCHAR(10),
  invoice_reference             VARCHAR(50),
  sales_document                VARCHAR(50),
  posting_date                  DATE,
  document_date                 DATE,
  gl_account                    VARCHAR(20),
  profit_center                 VARCHAR(20),
  PRIMARY KEY (accounting_document, accounting_document_item, fiscal_year)
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_so_items_material ON sales_order_items(material);
CREATE INDEX IF NOT EXISTS idx_so_items_sales_order ON sales_order_items(sales_order);
CREATE INDEX IF NOT EXISTS idx_delivery_items_ref_so ON delivery_items(reference_sales_order);
CREATE INDEX IF NOT EXISTS idx_billing_items_ref_delivery ON billing_items(reference_delivery_doc);
CREATE INDEX IF NOT EXISTS idx_billing_docs_accounting ON billing_documents(accounting_document);
CREATE INDEX IF NOT EXISTS idx_journal_entries_ref_doc ON journal_entries(reference_document);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer);
CREATE INDEX IF NOT EXISTS idx_sales_orders_sold_to ON sales_orders(sold_to_party);
