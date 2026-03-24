import React from 'react';

const NODE_CONFIG = {
  SalesOrder:        { icon: '📋', color: '#1f6feb', badgeBg: 'rgba(31,111,235,0.15)', label: 'Sales Order' },
  Delivery:          { icon: '🚚', color: '#238636', badgeBg: 'rgba(35,134,54,0.15)',  label: 'Delivery' },
  BillingDocument:   { icon: '🧾', color: '#9e6a03', badgeBg: 'rgba(158,106,3,0.15)', label: 'Billing Document' },
  JournalEntry:      { icon: '📒', color: '#6e40c9', badgeBg: 'rgba(110,64,201,0.15)', label: 'Journal Entry' },
  Payment:           { icon: '💳', color: '#bf4b8a', badgeBg: 'rgba(191,75,138,0.15)', label: 'Payment' },
  Customer:          { icon: '👤', color: '#0e9aa7', badgeBg: 'rgba(14,154,167,0.15)', label: 'Customer' },
  Product:           { icon: '📦', color: '#5a6a82', badgeBg: 'rgba(90,106,130,0.15)', label: 'Product' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatCurrency(amt, currency = 'INR') {
  if (amt == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amt);
}
function val(v) { return v ?? '—'; }

function Field({ label, value, mono = false, full = false }) {
  return (
    <div className={`detail-field${full ? ' full' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className={`detail-value${mono ? ' mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

function StatusBadge({ status, trueLabel = 'Yes', falseLabel = 'No' }) {
  if (status === null || status === undefined) return <span>—</span>;
  const label = status ? trueLabel : falseLabel;
  const cls = status ? 'red' : 'green';
  return <span className={`status-badge ${cls}`}>{label}</span>;
}

// Node detail renderers
function SalesOrderDetail({ data }) {
  return (
    <>
      <div className="detail-grid">
        <Field label="Sales Order" value={data.id} mono />
        <Field label="Order Type" value={val(data.orderType)} />
        <Field label="Customer" value={data.soldToParty} mono />
        <Field label="Customer Name" value={val(data.customerName)} />
        <Field label="Requested Delivery" value={formatDate(data.requestedDeliveryDate)} />
        <Field label="Created" value={formatDate(data.creationDate)} />
        <Field label="Incoterms" value={val(data.incoterms)} />
        <Field label="Item Count" value={data.itemCount} />
        <Field label="Delivery Block" value={data.deliveryBlock || 'None'} />
        <Field label="Billing Block" value={data.billingBlock || 'None'} />
      </div>
      {data.items?.length > 0 && (
        <>
          <div className="detail-section-title">Line Items</div>
          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Material</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.slice(0, 10).map(item => (
                <tr key={item.sales_order_item}>
                  <td>{item.sales_order_item}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{item.material || '—'}</span></td>
                  <td>{item.product_name || '—'}</td>
                  <td>{item.requested_quantity} {item.quantity_unit}</td>
                  <td>{item.net_amount ? formatCurrency(item.net_amount, item.transaction_currency) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function DeliveryDetail({ data }) {
  return (
    <>
      <div className="detail-grid">
        <Field label="Delivery Doc" value={data.id} mono />
        <Field label="Shipping Point" value={val(data.shippingPoint)} />
        <Field label="Created" value={formatDate(data.creationDate)} />
        <Field label="Goods Movement Date" value={formatDate(data.actual_goods_movement_date)} />
        <Field label="Goods Movement Status" value={val(data.goodsMovementStatus)} />
        <Field label="Picking Status" value={val(data.pickingStatus)} />
        <Field label="Delivery Block" value={data.deliveryBlock || 'None'} />
        <Field label="Incompletion Status" value={val(data.incompletionStatus)} />
      </div>
      {data.items?.length > 0 && (
        <>
          <div className="detail-section-title">Delivery Items</div>
          <table className="items-table">
            <thead>
              <tr><th>Item</th><th>Material</th><th>Description</th><th>Qty</th><th>Plant</th></tr>
            </thead>
            <tbody>
              {data.items.slice(0, 10).map(item => (
                <tr key={item.delivery_document_item}>
                  <td>{item.delivery_document_item}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{item.material || '—'}</span></td>
                  <td>{item.product_name || '—'}</td>
                  <td>{item.actual_delivery_qty} {item.quantity_unit}</td>
                  <td>{item.plant || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function BillingDetail({ data }) {
  return (
    <>
      <div className="detail-grid">
        <Field label="Billing Document" value={data.id} mono />
        <Field label="Type" value={val(data.documentType)} />
        <Field label="Customer" value={val(data.soldToParty)} mono />
        <Field label="Customer Name" value={val(data.customerName)} />
        <Field label="Total Net Amount" value={formatCurrency(data.totalNetAmount, data.currency)} />
        <Field label="Accounting Doc" value={val(data.accountingDocument)} mono />
        <Field label="Created" value={formatDate(data.creationDate)} />
        <div className="detail-field">
          <span className="detail-label">Cancelled</span>
          <StatusBadge status={data.isCancelled} trueLabel="Cancelled" falseLabel="Active" />
        </div>
      </div>
      {data.items?.length > 0 && (
        <>
          <div className="detail-section-title">Billing Items</div>
          <table className="items-table">
            <thead>
              <tr><th>Item</th><th>Material</th><th>Description</th><th>Qty</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {data.items.slice(0, 10).map(item => (
                <tr key={item.billing_document_item}>
                  <td>{item.billing_document_item}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{item.material || '—'}</span></td>
                  <td>{item.product_name || '—'}</td>
                  <td>{item.billing_quantity} {item.quantity_unit}</td>
                  <td>{item.net_amount ? formatCurrency(item.net_amount, item.transaction_currency) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function CustomerDetail({ data }) {
  return (
    <>
      <div className="detail-grid">
        <Field label="Customer ID" value={data.id} mono />
        <Field label="Full Name" value={val(data.full_name)} full />
        <Field label="Name" value={val(data.name)} />
        <Field label="BP Category" value={val(data.bp_category)} />
        <Field label="City" value={val(data.city_name)} />
        <Field label="Country" value={val(data.country)} />
        <Field label="Postal Code" value={val(data.postal_code)} />
        <Field label="Street" value={val(data.street_name)} />
        <div className="detail-field">
          <span className="detail-label">Blocked</span>
          <StatusBadge status={data.is_blocked} trueLabel="Blocked" falseLabel="Active" />
        </div>
      </div>
      {data.recentOrders?.length > 0 && (
        <>
          <div className="detail-section-title">Recent Orders</div>
          <table className="items-table">
            <thead>
              <tr><th>Sales Order</th><th>Type</th><th>Created</th><th>Requested Delivery</th></tr>
            </thead>
            <tbody>
              {data.recentOrders.map(o => (
                <tr key={o.sales_order}>
                  <td style={{ fontFamily: 'monospace' }}>{o.sales_order}</td>
                  <td>{o.sales_order_type}</td>
                  <td>{formatDate(o.creation_date)}</td>
                  <td>{formatDate(o.requested_delivery_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function GenericDetail({ data }) {
  const skip = ['type', 'rfNodeId', 'onNodeClick', 'highlighted', 'id'];
  return (
    <div className="detail-grid">
      {Object.entries(data)
        .filter(([k]) => !skip.includes(k) && data[k] !== null && data[k] !== undefined)
        .map(([k, v]) => (
          <Field
            key={k}
            label={k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
            value={v instanceof Date ? formatDate(v) : String(v)}
          />
        ))}
    </div>
  );
}

export default function NodeDetailModal({ node, onClose }) {
  if (!node) return null;
  const cfg = NODE_CONFIG[node.type] || { icon: '⬡', color: '#666', badgeBg: '#333', label: node.type };

  const renderDetail = () => {
    switch (node.type) {
      case 'SalesOrder': return <SalesOrderDetail data={node} />;
      case 'Delivery': return <DeliveryDetail data={node} />;
      case 'BillingDocument': return <BillingDetail data={node} />;
      case 'Customer': return <CustomerDetail data={node} />;
      default: return <GenericDetail data={node} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{node.label}</div>
              <span
                className="modal-type-badge"
                style={{ background: cfg.badgeBg, color: cfg.color, border: `1px solid ${cfg.color}55` }}
              >
                {cfg.label}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {renderDetail()}
        </div>
      </div>
    </div>
  );
}
