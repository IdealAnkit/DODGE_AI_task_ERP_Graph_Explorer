# AI Coding Session Log — Dodge AI FDE Assessment
**Tool Used:** Antigravity AI (Google DeepMind) inside VS Code  
**Session Date:** 24 March 2026  
**Candidate:** Ankit Kumar (mrankitkumar1530@gmail.com)  
**Task:** Graph-Based Data Modeling and Query System — SAP Order-to-Cash Dataset

---

## Session Overview

This log documents the complete AI-assisted development session for the Dodge AI Forward Deployed Engineer assessment task. Every prompt, decision, debugging step, and iteration is recorded below in chronological order.

---

## Phase 1 — Project Scaffolding & Architecture Design

### Prompt 1
> "Help me build the ERP graph system. I have the SAP Order-to-Cash JSONL dataset. I need a graph visualization with a natural language query interface using Gemini AI."

**AI Response & Actions:**
- Analyzed the dataset folder structure (19 JSONL subfolders)
- Designed the full-stack architecture:
  - **Backend:** Node.js + Express + PostgreSQL
  - **Frontend:** React + Vite + React Flow
  - **LLM:** Google Gemini API (free tier)
- Created project folder: `erp-graph-system/`
- Created `package.json` with `concurrently` for running both servers

**Architecture Decision:** PostgreSQL over Neo4j (graph DB) because:
1. The dataset is relational by nature (FK references everywhere)
2. SQL is more expressive for aggregation queries
3. Free tier availability (no graph DB free tier)
4. The LLM can generate SQL directly — much simpler than Cypher

---

### Prompt 2
> "Design the database schema"

**AI Actions:**
- Created `server/db/schema.sql` with **14 tables**:

```
customers, customer_addresses, products, product_descriptions,
plants, sales_orders, sales_order_items, sales_order_schedule_lines,
deliveries, delivery_items, billing_documents, billing_items,
journal_entries, payments
```

- All tables include proper FK constraints and indexes
- Added composite primary keys where needed (e.g., `journal_entries(accounting_document, fiscal_year)`)

**Key Schema Decision:** Normalized all JSONL files into relational tables rather than storing as JSON blobs — this gives the LLM full SQL expressiveness over the data.

---

### Prompt 3
> "Create the data ingestion script"

**AI Actions:**
- Created `server/scripts/ingest.js`
- Reads all 19 JSONL subfolders using `glob`
- Bulk inserts with `ON CONFLICT DO NOTHING` for idempotency
- Handles nested JSON fields (e.g., `business_partner_addresses` has address blocks)
- Maps JSONL field names to SQL columns (camelCase → snake_case)

**Debugging:** Initial ingest failed on `journal_entry_items_accounts_receivable` — the JSONL had a different field naming convention. Fixed by adding field aliasing in the mapping function.

---

## Phase 2 — Graph Construction

### Prompt 4
> "Build the graph service — construct nodes and edges from the database"

**AI Actions:**
- Created `server/services/graphService.js`
- Defined **7 node types** with colors and icons:

| Node Type | Color | Icon |
|---|---|---|
| Customer | #0e9aa7 | 👤 |
| SalesOrder | #1f6feb | 📋 |
| Delivery | #238636 | 🚚 |
| BillingDocument | #9e6a03 | 🧾 |
| JournalEntry | #6e40c9 | 📒 |
| Payment | #bf4b8a | 💳 |
| Product | #5a6a82 | 📦 |

- Defined **5 edge types**:
  - `so_customer`: Customer → SalesOrder
  - `so_delivery`: SalesOrder → Delivery (via schedule lines)
  - `delivery_billing`: Delivery → BillingDocument
  - `billing_journal`: BillingDocument → JournalEntry
  - `customer_payment`: Customer → Payment

- Added `traceFlow(billingDocId)` — traces the full O2C chain for one billing document
- Added `findBrokenFlows()` — detects 3 categories of incomplete flows:
  1. Delivered but not billed
  2. Billed but no journal entry
  3. Sales orders with no delivery

**Graph Limit:** Set to 200 nodes per type (configurable via `?limit=N` query param) to keep initial render fast.

---

## Phase 3 — LLM Integration

### Prompt 5
> "Integrate Gemini API for natural language to SQL pipeline"

**AI Actions:**
- Created `server/services/llmService.js`
- Implemented a **2-stage pipeline**:
  1. **NL → SQL:** Gemini reads schema context + user query → outputs JSON `{type, sql, intent, explanation}`
  2. **SQL → NL:** Execute SQL against PostgreSQL, pass results to Gemini → outputs natural language answer

**System Prompt Design:**
```
You are an ERP data assistant. 
Only answer questions about the ERP dataset.
For valid queries: respond ONLY with JSON {type: "sql", sql: "SELECT ...", intent, explanation}
For off-topic: respond ONLY with {type: "rejected", reason: "..."}
Never hallucinate column names - use ONLY schema columns.
```

**Guardrails implemented:**
1. **Keyword pre-filter** — fast check before hitting API: `['sales order', 'billing', 'delivery', 'payment', ...]`
2. **LLM domain check** — LLM itself rejects off-topic prompts
3. **SQL sanitization** — blocks DROP, DELETE, INSERT, UPDATE, TRUNCATE, ALTER
4. **SELECT-only enforcement** — rejects any non-SELECT query

---

### Debugging Session: 404 Model Not Found

**Error:**
```
[GoogleGenerativeAI Error]: models/gemini-1.5-flash is not found for API version v1beta
```

**Investigation:**
- Checked available models via `curl`
- Found `gemini-1.5-flash` was deprecated on v1beta
- Tried `gemini-pro` — also deprecated

**Fix:** Switched to `gemini-2.5-flash` (latest preview) with `v1alpha` API version override:
```javascript
const PREVIEW_REQUEST_OPTIONS = { apiVersion: 'v1alpha' };
const model = genAI.getGenerativeModel(
  { model: 'gemini-2.5-flash' },
  PREVIEW_REQUEST_OPTIONS  // per-model override, not global
);
```

**Key Learning:** SDK v0.24.1 defaults to `v1beta`. Preview models need `v1alpha`. The override must be passed as the second argument to `getGenerativeModel()`, not to the `GoogleGenerativeAI` constructor.

---

## Phase 4 — Frontend Build

### Prompt 6
> "Build the React frontend — graph view + chat panel"

**AI Actions:**
- Set up Vite + React project in `client/`
- Created layout: `75% graph panel | 25% chat panel`
- Built custom React Flow node component `ERPNode` with:
  - Type-specific colors, icons, labels
  - Hover effects and transitions
  - Source/target handles for edges

**Debugging: Black Screen Issue**
```
[React Flow]: It looks like you've created a new nodeTypes or edgeTypes object.
```

**Root Cause:** `nodeTypes` was defined inside the component → recreated on every render → React Flow warning + broken rendering.

**Fix:**
1. Moved `nodeTypes` object outside all components (module scope)
2. Removed `React.StrictMode` from `main.jsx` (it double-invokes renders in dev, causing false React Flow warnings)
3. Wrapped `ReactFlow` in a `ReactFlowProvider` context

---

### Phase 4b — Chat Panel

**AI Actions:**
- Created `ChatPanel.jsx` with:
  - Suggestion chips for common ERP queries
  - Message bubbles (user right / assistant left)
  - `react-markdown` rendering for structured responses
  - Collapsible SQL block showing the generated query
  - Collapsible data table for raw results
  - Typing dots animation while loading
  - Keyboard shortcut: `Enter` to send, `Shift+Enter` for newline

---

## Phase 5 — Graph UX Improvements

### Prompt 7
> "The graph is very small, the zoom is too slow, edges are overlapping, the minimap isn't showing position correctly, and when I ask a question the highlighted nodes disappear when I scroll"

**AI Actions:**

**Zoom Controls:**
- Added inner control panel with zoom slider (`<input type="range">`)
- Added `+` / `−` buttons using `useReactFlow` hook
- Added `⛶ Fit` button for fit-to-view

**Arrow Pad:**
- Added D-pad navigation buttons (▲▼◀▶ + ⊙ center)
- Implemented pan via `setViewport()` with smooth animation

**Performance:**
- Switched from `straight` to `bezier` edge type — reduces visual crossing
- Increased column spacing: `COL_WIDTH: 260`, `ROW_HEIGHT: 90`

**Auto-highlight Focus:**
- When query returns highlighted nodes, auto-pan/zoom to show them:
```javascript
fitView({ nodes: highlightedNodes.map(id => ({ id })), duration: 700, padding: 0.3 });
```

**Persistent Highlights:**
- Removed auto-clear timer (8 second timeout was causing confusion)
- Added manual `✕ Clear N highlights` button

**Minimap Fix:**
- Added `maskColor="rgba(10,13,18,0.75)"` to MiniMap component

---

## Phase 6 — Bug Fixes

### Bug 1: Disconnected Payment Nodes

**User Report:** "PAY 9400000289, PAY 9400172477, PAY 9400635981 have no edges"

**Investigation:**
- Payments join to customers via `customer` FK
- Customer nodes are loaded first (sample of 200)
- Payment's customer might NOT be in the 200-node sample
- Edge `customer_X → pay_Y` references non-existent node → silently dropped during edge filtering

**Fix in `graphService.js`:**
```javascript
// After loading payments, collect missing customer IDs
const missingCustomerIds = [...new Set(
  payments.rows.map(p => p.customer).filter(c => c && !nodeSet.has(`customer_${c}`))
)];

// Targeted query to load them
if (missingCustomerIds.length > 0) {
  const extra = await client.query(
    `SELECT customer, full_name, name FROM customers WHERE customer = ANY($1)`,
    [missingCustomerIds]
  );
  // Add to node set before building edges
}
```

Also added `JournalEntry → Payment` edges via `clearing_accounting_document` for richer connectivity.

---

### Bug 2: Inconsistent Node Highlighting

**User Report:** "Sometimes nodes highlight, sometimes they don't for the same question"

**Root Cause:** Node IDs in the graph include `_fiscal_year` suffix:
- Graph: `je_9100000001_2024`
- Extractor: `je_9100000001` ← ID mismatch!

**Fix in `llmService.js` `extractHighlightedNodes()`:**
```javascript
if (row.accounting_document && sqlUpper.includes('JOURNAL')) {
  const fy = row.fiscal_year;
  if (fy) highlighted.push(`je_${row.accounting_document}_${fy}`); // with FY
  highlighted.push(`je_${row.accounting_document}`);                // fallback
}
```

---

### Bug 3: Zoom Slider Not Working on Drag

**Root Cause:** `onChange` on range inputs fires on mouse-up in some browsers, not continuously during drag.

**Fix:** Added `onInput` handler alongside `onChange`:
```jsx
<input type="range"
  onInput={e => { const v = parseFloat(e.target.value); setZoom(v); setZoomDisplay(v); }}
  onChange={e => { const v = parseFloat(e.target.value); setZoom(v); setZoomDisplay(v); }}
/>
```

---

## Phase 7 — Bonus Features Implementation

### Feature 1: Streaming Responses (SSE)

**Implementation:**

Backend (`llmService.js`):
```javascript
async function processQueryStream(userQuery, conversationHistory, onChunk) {
  // Steps 1-2 normal (NL→SQL→Execute)
  // Step 3: STREAM the answer
  const streamResult = await model.generateContentStream({ ... });
  for await (const chunk of streamResult.stream) {
    const text = chunk.text();
    if (text) { fullAnswer += text; onChunk(text); }
  }
}
```

Backend route (`routes/query.js`):
```javascript
router.post('/stream', handleQueryStream);
// Uses SSE: res.setHeader('Content-Type', 'text/event-stream')
// Events: thinking → chunk (per token) → done (metadata)
```

Frontend (`useChat.js`):
```javascript
const reader = response.body.getReader();
// Parse SSE events and update message incrementally
// Shows blinking ▌ cursor while streaming
```

UI: Blinking `▌` cursor CSS animation while streaming.

---

### Feature 2: Conversation Memory

**Implementation:**
```javascript
// historyRef stores last 8 turns
const buildConversationContents = (userQuery, history) => {
  const contents = [];
  for (const msg of history.slice(-6)) {
    if (msg.role === 'user') contents.push({ role: 'user', parts: [{ text: msg.content }] });
    else contents.push({ role: 'model', parts: [{ text: msg.content.substring(0,300) }] });
  }
  contents.push({ role: 'user', parts: [{ text: userQuery }] });
  return contents;
};
```

**Example workflows enabled:**
- "List top 5 customers" → "Show me their deliveries" (remembers which customers)
- "What sales orders exist?" → "Which of those are blocked?" (filters previous result)

**UI:** Purple `💬 N turns remembered` badge in chat header, `🗑 Clear` button to reset.

---

### Feature 3: Click-to-Highlight Neighbor Nodes

**Implementation in `GraphView.jsx`:**
```javascript
const [focusedNodeId, setFocusedNodeId] = useState(null);

// When node clicked, compute connected neighbors
const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
  if (!focusedNodeId) return { connectedNodeIds: null, connectedEdgeIds: null };
  const nodeIds = new Set([focusedNodeId]);
  for (const e of baseEdges) {
    if (e.source === focusedNodeId || e.target === focusedNodeId) {
      nodeIds.add(e.source); nodeIds.add(e.target);
    }
  }
  return { connectedNodeIds: nodeIds, ... };
}, [focusedNodeId, baseEdges]);
```

**Visual effects:**
- Clicked node → white glow `box-shadow: 0 0 0 3px #fff`
- Neighbor nodes → type-color glow
- All other nodes → dimmed to 12% opacity
- Connected edges → animated + full brightness
- Click blank canvas → clears focus

---

## Phase 8 — Layout Iteration

### Attempt 1: Dagre Auto-Layout
Installed `@dagrejs/dagre` and ran automatic hierarchical layout.

**Result:** User feedback — "the previous one was far much good than this"

**Rollback decision:** Reverted to manual column-based layout. The column layout is more predictable and legible for the O2C flow (left-to-right: Customer → Order → Delivery → Billing → Journal → Payment).

### Final Layout: Column-Based
```javascript
const TYPE_ORDER = ['Customer','SalesOrder','Delivery','BillingDocument','JournalEntry','Payment','Product'];
const COL_WIDTH = 300;   // horizontal spacing (user increased from 200→270→300)
const ROW_HEIGHT = 100;  // vertical spacing
```

---

## Final Feature Checklist

| Requirement | Status |
|---|---|
| Graph construction (7 node types, 5 edge types) | ✅ |
| Graph visualization (React Flow) | ✅ |
| Node inspection (click modal) | ✅ |
| NL query interface | ✅ |
| NL → SQL translation | ✅ |
| SQL execution + NL answer | ✅ |
| Query guardrails (domain restriction) | ✅ |
| Example query a: Products with most billing docs | ✅ |
| Example query b: Trace full O2C flow | ✅ |
| Example query c: Broken/incomplete flows | ✅ |
| **Bonus:** NL → SQL (implemented as core feature) | ✅ |
| **Bonus:** Highlighting nodes in responses | ✅ |
| **Bonus:** Streaming responses (SSE) | ✅ |
| **Bonus:** Conversation memory | ✅ |
| **Bonus:** Click-to-highlight neighbors | ✅ |

---

## Tech Stack Summary

| Layer | Technology | Reason |
|---|---|---|
| Database | PostgreSQL | Relational data model, SQL for LLM |
| Backend | Node.js + Express | Lightweight, async, fast setup |
| Frontend | React + Vite | Fast dev server, hot reload |
| Graph UI | React Flow | Best React graph library, handles large graphs |
| LLM | Google Gemini 2.5 Flash | Free tier, fast, strong SQL generation |
| Streaming | SSE (text/event-stream) | Simple, no WebSocket complexity |
| CSS | Vanilla CSS | Full control, no dependency overhead |

---

## Prompting Strategy

**For NL → SQL:**
- Full schema context in system prompt (all 14 tables, all columns, all FK relationships)
- Strict JSON-only output format enforced
- Examples of valid/invalid queries in prompt
- "Never hallucinate column names" instruction

**For SQL → NL:**
- Separate system prompt focused only on answer formatting
- Actual SQL + actual results passed as context
- Markdown formatting instructions for readability

**For Guardrails:**
- Two-layer approach: fast keyword check (no API call) + LLM semantic check
- LLM rejection returns structured JSON, not free text (can't be tricked by creative rephrasing)

---

## Key Debugging Moments

1. **Black graph panel** → `nodeTypes` inside component caused React Flow to see new object every render → moved to module scope + removed StrictMode
2. **404 Gemini error** → `v1beta` doesn't have `gemini-2.5-flash` → added `v1alpha` override
3. **Disconnected payments** → customer sample didn't include payment customers → added targeted secondary query
4. **Inconsistent highlights** → fiscal year suffix in node ID not matched → now tries both formats
5. **Zoom slider not dragging** → `onChange` fires on release → added `onInput` for real-time drag
6. **CSS broke on line 880** → tool wrote literal `\n` escape sequences → fixed with Python script

---

## Phase 9 — Cloud Deployment & Database Network Architecture

### The Supabase `ETIMEDOUT` Challenge
**Initial Plan:** Hosted the PostgreSQL database on Supabase (Free Tier) and the Node.js backend on Render (Free Tier).

**The Problem:** Render's free tier does not support IPv6 routing. Since Supabase disabled IPv4 on direct connections (pgBouncer/Supavisor), the Node.js backend threw `ENETUNREACH` during deployment.
1. **Fix 1:** Switched to Supabase's IPv4 **Transaction Pooler** (`aws-1-ap-south-config`).
2. **Result 1:** The app worked *once*, but refreshing the page caused immediate `ETIMEDOUT` / 500 Internal Server Errors.
3. **Investigation:** The Node.js `pg` driver conflicts natively with **PgBouncer Transaction Poolers**. When `pg` tries to reuse an idle connection where the session state was wiped by PgBouncer, the connection hangs forever until TCP timeout.

### The Network Configuration Pivot
To bypass these strict architectural conflicts and guarantee 100% uptime for the assessment review:
1. **Pivot to Internal Networking:** We provisioned a native **Render PostgreSQL** database deployed in the exact same region (Oregon) as the Node.js web service.
2. **Result:** By using the `Internal Database URL`, we bypassed the public internet entirely. This instantly resolved all SSL certificate drop-outs (`DEPTH_ZERO_SELF_SIGNED_CERT`), eliminated firewall routing issues, and reduced query latency significantly.
3. **Data Migration:** Ingested the 14 tables of JSONL data remotely via Render's External Connection URL while the backend rebuilt.

**Architectural Takeaway:** Complex cloud networking between disparate free-tier providers (Render IPv4-only vs Supabase Supavisor) often introduces silent failures (connection pool starvation). Consolidating the database and compute within the same VPC (Render Internal Network) guarantees stability and zero-configuration SSL.

---
## Files Created/Modified

### New Files
```
erp-graph-system/
├── server/
│   ├── index.js
│   ├── .env
│   ├── db/pool.js
│   ├── db/schema.sql
│   ├── scripts/ingest.js
│   ├── services/graphService.js
│   ├── services/llmService.js
│   ├── controllers/graphController.js
│   ├── controllers/queryController.js
│   ├── routes/graph.js
│   ├── routes/query.js
│   └── utils/logger.js
├── client/src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── GraphView.jsx
│   │   ├── ChatPanel.jsx
│   │   └── NodeDetailModal.jsx
│   ├── hooks/
│   │   ├── useGraph.js
│   │   └── useChat.js
│   └── vite.config.js
├── package.json
└── README.md
```

### Key Iterations
- `GraphView.jsx` — 6+ rewrites (black screen fix → dagre experiment → revert → highlight addition)
- `llmService.js` — 4 rewrites (initial → model fix → highlight fix → streaming + memory)
- `graphService.js` — 3 rewrites (initial → payment fix → JE edge addition)
- `index.css` — continuous additions (500 → 936 lines)

---

*Session conducted on 24 March 2026 using Antigravity AI (Google DeepMind) in VS Code*
*Submission deadline: 26 March 2026, 11:59 PM IST*
