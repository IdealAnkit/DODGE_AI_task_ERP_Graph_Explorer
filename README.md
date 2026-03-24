<div align="center">

# ⚡ ERP Graph Explorer

### _AI-Powered SAP Order-to-Cash Graph Visualization & Natural Language Query System_

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express.js-4+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

<br/>

### 🌐 **Live Demo:** [https://dodge-ai-task-erp-graph-explorer.vercel.app](https://dodge-ai-task-erp-graph-explorer.vercel.app)
*Backend deployed on Render with Render Internal PostgreSQL for robust network reliability.*

<br/>

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Graph Nodes](https://img.shields.io/badge/Graph_Nodes-580+-blue?style=flat-square)](#-graph-architecture)
[![Node Types](https://img.shields.io/badge/Node_Types-7-purple?style=flat-square)](#-graph-architecture)
[![Edge Types](https://img.shields.io/badge/Edge_Types-5-orange?style=flat-square)](#-graph-architecture)
[![LLM Streaming](https://img.shields.io/badge/LLM-SSE_Streaming-red?style=flat-square)](#-ai-query-engine)
[![Lines of Code](https://img.shields.io/badge/Lines_of_Code-3000+-yellow?style=flat-square)](#)
[![Maintained](https://img.shields.io/badge/Maintained-Yes-success?style=flat-square)](#)

<br/>

> **_Turning fragmented SAP ERP data into an interactive, queryable knowledge graph — powered by Gemini AI_**

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-table-of-contents">Contents</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#️-graph-architecture">Graph</a> •
  <a href="#-ai-query-engine">AI Engine</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-faq">FAQ</a>
</p>

---

</div>

## 📑 Table of Contents

- [🌟 Overview](#-overview)
  - [💡 The Problem We Solve](#-the-problem-we-solve)
- [✨ Features](#-features)
- [📂 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
  - [📦 Prerequisites](#-prerequisites)
  - [⚡ Installation](#-installation-5-steps)
- [🕸️ Graph Architecture](#️-graph-architecture)
  - [Node Types](#node-types)
  - [O2C Flow Diagram](#o2c-flow-diagram)
  - [Database Schema](#database-schema-14-tables)
- [🤖 AI Query Engine](#-ai-query-engine)
  - [Two-Stage LLM Pipeline](#two-stage-llm-pipeline)
  - [Guardrails](#️-guardrails-3-layers)
  - [Conversation Memory](#conversation-memory)
- [📡 API Reference](#-api-reference)
- [🎯 Example Queries](#-example-queries)
- [⚙️ Tech Stack](#️-tech-stack)
- [🔧 Troubleshooting](#-troubleshooting)
- [🗺️ System Architecture](#️-system-architecture-overview)
- [📋 Feature Completion](#-feature-completion)
- [🚀 Future Roadmap](#-future-roadmap)
- [❓ FAQ](#-faq)
- [🤝 Contributing](#-contributing)
- [🙏 Acknowledgements](#-acknowledgements)
- [📜 License](#-license)

---

## ⚙️ Tech Stack

<div align="center">

<table>
<tr>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="60"/><br>
<b>Node.js</b><br>
<sub>Backend Runtime</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="60"/><br>
<b>React 18</b><br>
<sub>Frontend UI</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="60"/><br>
<b>PostgreSQL</b><br>
<sub>Primary Database</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="60"/><br>
<b>Gemini AI</b><br>
<sub>LLM Engine</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="60"/><br>
<b>Vite 5</b><br>
<sub>Build Tool</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="60"/><br>
<b>Express.js</b><br>
<sub>REST API</sub>
</td>
</tr>
</table>

</div>

---

## 🌟 Overview

In real-world enterprise systems, data is scattered across dozens of tables — orders, deliveries, invoices, and payments — with no clear way to see how they connect. **ERP Graph Explorer** unifies a fragmented SAP Order-to-Cash (O2C) dataset into a **living graph** and lets you explore it with **plain-English queries**.

<table>
<tr>
<td width="50%">

### 🎯 **What Makes This Special?**

- 🔗 **580+ interconnected nodes** from real SAP O2C data
- 🧠 **Gemini 2.5 Flash** translates English → SQL → English
- 📡 **Real-time streaming** — watch answers appear token by token
- 💬 **Conversation memory** — ask follow-up questions naturally
- 🔍 **Click any node** → highlights all connected neighbors
- 🛡️ **3-layer guardrails** — rejects off-topic prompts automatically

</td>
<td width="50%">

### 📊 **Dataset Stats**

| Property | Value |
|---|---|
| Source | SAP Order-to-Cash JSONL |
| Subfolders | 19 entity categories |
| DB Tables | 14 normalized tables |
| Graph Nodes | 580+ |
| Graph Edges | 655+ |
| Node Types | 7 entity types |

</td>
</tr>
</table>

### 💡 The Problem We Solve

| ❌ Without This System | ✅ With ERP Graph Explorer |
|---|---|
| 📁 Data scattered across 19 JSONL files | 🗺️ Unified visual graph in one view |
| 🔍 Need SQL expertise to query | 💬 Ask questions in plain English |
| 🔗 No way to see entity relationships | 🕸️ Click any node to explore connections |
| ⏳ Manual data tracing | 🚀 One-click O2C flow trace |
| ❓ Broken flows hidden in data | ⚠️ Auto-detected incomplete flows |

---

## ✨ Features

### 🏢 Core Requirements Completed
| Feature | Description |
| :-----: | :---------- |
| 🗺️ | **Interactive Graph** — React Flow canvas with 7 node types and 5 edge types representing the O2C flow |
| 💬 | **Natural Language Queries** — Ask questions in plain English without knowing SQL |
| 🛡️ | **Query Guardrails** — Strict domain filtering rejects any non-ERP queries |
| 🔎 | **SQL Transparency** — Every response displays the generated PostgreSQL query |

### 🌟 Extra / Bonus Implementations (Beyond Assessment Scope)
| Feature | Description |
| :-----: | :---------- |
| 🎨 | **Rich Node Representation** — Nodes are not just simple dots. They have specific names, tags (e.g., `isBlocked`, `clearingDate`), custom colors, and distinct icons for all 7 entity types |
| 🎮 | **Advanced Graph Controls** — Built-in custom zoom slider, D-pad panning navigation, and a minimap for exploring large datasets easily |
| 🧠 | **Conversational Memory** — The chat is not single-prompt dependent! Context is retained across multiple turns, allowing for natural follow-up questions |
| 🔄 | **Full NL Pipeline** — The response is not just a raw SQL table. The pipeline goes: `NL → SQL → Database Execution → LLM Context → Natural Language Answer` |
| ✨ | **Click-to-Highlight** — Clicking any node instantly dims the rest of the graph and highlights all its directly connected neighbors |
| 📡 | **Streaming Responses** — Token-by-token SSE streaming provides a ChatGPT-like real-time typing experience |

</div>

---

## 📂 Project Structure

```
erp-graph-system/
│
├── 📂 server/                        # Node.js + Express Backend
│   ├── 📄 index.js                   # Express entry point + middleware
│   ├── 📂 db/
│   │   ├── 📄 pool.js                # PostgreSQL connection pool
│   │   └── 📄 schema.sql             # 14 tables, FK constraints, indexes
│   ├── 📂 scripts/
│   │   └── 📄 ingest.js              # JSONL → PostgreSQL bulk ingestion (19 folders)
│   ├── 📂 services/
│   │   ├── 📄 graphService.js        # Node/edge builder, trace, broken flow detection
│   │   └── 📄 llmService.js          # Gemini 2-stage pipeline + memory + streaming
│   ├── 📂 controllers/
│   │   ├── 📄 graphController.js     # Graph, node detail, trace, broken endpoints
│   │   └── 📄 queryController.js     # Standard JSON + SSE streaming query dispatch
│   ├── 📂 routes/
│   │   ├── 📄 graph.js               # GET /graph, /node/:type/:id, /trace, /broken
│   │   └── 📄 query.js               # POST /query  +  POST /query/stream (SSE)
│   ├── 📂 utils/
│   │   └── 📄 logger.js              # Winston logger (console + file)
│   └── 📄 .env                       # DB + Gemini config
│
├── 📂 client/src/                    # React + Vite Frontend
│   ├── 📄 main.jsx                   # App entry point
│   ├── 📄 App.jsx                    # Root layout + global state management
│   ├── 📄 index.css                  # Dark theme design system (936 lines)
│   ├── 📂 components/
│   │   ├── 📄 GraphView.jsx          # React Flow canvas, zoom, arrow-pad, highlights
│   │   ├── 📄 ChatPanel.jsx          # Chat UI, markdown, SQL blocks, stream cursor
│   │   └── 📄 NodeDetailModal.jsx    # Click-to-inspect detail overlay
│   └── 📂 hooks/
│       ├── 📄 useGraph.js            # Graph fetch + node details hook
│       └── 📄 useChat.js             # SSE stream reader + conversation history
│
├── 📂 sessions/                      # AI coding session logs (for submission)
│   └── 📄 antigravity-ai-session-log.md
│
├── 📄 package.json                   # Root: concurrently runs both servers
└── 📄 README.md                      # You are here 📍
```

---

## 🚀 Quick Start

### 📦 Prerequisites

<div align="center">

| Requirement | Version | Notes |
|---|---|---|
| 🟢 **Node.js** | 18+ | ![Required](https://img.shields.io/badge/Required-red) |
| 🐘 **PostgreSQL** | 14+ | ![Required](https://img.shields.io/badge/Required-red) |
| 🔑 **Gemini API Key** | Free | [Get one here](https://ai.google.dev) ![Required](https://img.shields.io/badge/Required-red) |
| 📦 **SAP O2C Dataset** | JSONL | 19 subfolder structure ![Required](https://img.shields.io/badge/Required-red) |

</div>

### ⚡ Installation (5 Steps)

**Step 1 — Clone & Install Dependencies**
```bash
git clone <repository-url>
cd erp-graph-system

npm install                    # root (installs concurrently)
cd server && npm install       # backend
cd ../client && npm install    # frontend
```

**Step 2 — Configure Environment**
```bash
# Edit server/.env:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/erp_graph
GEMINI_API_KEY=your_free_key_from_https://ai.google.dev
PORT=3001
DATA_PATH=../../path/to/sap-o2c-data
```

**Step 3 — Create Database**
```bash
psql -U postgres -c "CREATE DATABASE erp_graph;"
```

**Step 4 — Ingest Dataset**
```bash
cd server
npm run ingest
# ✅ Ingestion complete! { customers: 8, sales_orders: 106, deliveries: 200, ... }
```

**Step 5 — Launch App**
```bash
cd ..           # back to root
npm run dev     # starts both servers concurrently on :3001 + :5173
```

🎉 Open **http://localhost:5173**

---

## 🕸️ Graph Architecture

### Node Types

<div align="center">

| Node | Type | Color | Icon | Source Table |
|:----:|------|:-----:|:----:|---|
| ![#1f6feb](https://img.shields.io/badge/-%201f6feb-1f6feb) | **Sales Order** | `#1f6feb` | 📋 | `sales_orders` |
| ![#238636](https://img.shields.io/badge/-%20238636-238636) | **Delivery** | `#238636` | 🚚 | `deliveries` |
| ![#9e6a03](https://img.shields.io/badge/-%209e6a03-9e6a03) | **Billing Document** | `#9e6a03` | 🧾 | `billing_documents` |
| ![#6e40c9](https://img.shields.io/badge/-%206e40c9-6e40c9) | **Journal Entry** | `#6e40c9` | 📒 | `journal_entries` |
| ![#bf4b8a](https://img.shields.io/badge/-%20bf4b8a-bf4b8a) | **Payment** | `#bf4b8a` | 💳 | `payments` |
| ![#0e9aa7](https://img.shields.io/badge/-%200e9aa7-0e9aa7) | **Customer** | `#0e9aa7` | 👤 | `customers` |
| ![#5a6a82](https://img.shields.io/badge/-%205a6a82-5a6a82) | **Product** | `#5a6a82` | 📦 | `products` |

</div>

### O2C Flow Diagram

```mermaid
graph LR
    C[👤 Customer] -->|places| SO[📋 Sales Order]
    SO -->|fulfills via| DEL[🚚 Delivery]
    DEL -->|generates| BILL[🧾 Billing Document]
    BILL -->|creates AR entry| JE[📒 Journal Entry]
    JE -->|cleared by| PAY[💳 Payment]
    C -->|settles with| PAY
    SO -->|contains| PROD[📦 Product]
    DEL -->|ships| PROD

    style C fill:#0e9aa7,color:#fff
    style SO fill:#1f6feb,color:#fff
    style DEL fill:#238636,color:#fff
    style BILL fill:#9e6a03,color:#fff
    style JE fill:#6e40c9,color:#fff
    style PAY fill:#bf4b8a,color:#fff
    style PROD fill:#5a6a82,color:#fff
```

### Database Schema (14 Tables)

<details>
<summary><b>📐 Click to expand full ERD</b></summary>

```mermaid
erDiagram
    customers ||--o{ sales_orders : "sold_to_party"
    customers ||--o{ customer_addresses : "business_partner"
    customers ||--o{ payments : "customer"
    customers ||--o{ journal_entries : "customer"
    sales_orders ||--o{ sales_order_items : "sales_order"
    sales_orders ||--o{ sales_order_schedule_lines : "sales_order"
    sales_order_items }o--|| products : "material"
    sales_order_schedule_lines }o--|| deliveries : "delivery_document"
    deliveries ||--o{ delivery_items : "delivery_document"
    delivery_items }o--|| products : "material"
    delivery_items }o--|| plants : "plant"
    billing_documents }o--|| customers : "sold_to_party"
    billing_documents ||--o{ billing_items : "billing_document"
    billing_items }o--|| products : "material"
    billing_items }o--|| deliveries : "reference_delivery_doc"
    journal_entries }o--|| billing_documents : "reference_document"
    products ||--o{ product_descriptions : "product"
```

</details>

---

## 🤖 AI Query Engine

### Two-Stage LLM Pipeline

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant G as 🛡️ Guardrails
    participant L as 🧠 Gemini 2.5 Flash
    participant DB as 🐘 PostgreSQL
    participant S as 📡 SSE Stream

    U->>G: "Which customers have the most billing docs?"
    G->>G: Keyword domain check (Layer 1)
    G->>L: NL + Full Schema + Conversation History
    L->>G: {"type":"sql","sql":"SELECT sold_to_party..."}
    G->>G: SQL sanitization (Layer 3)
    G->>DB: Execute validated SELECT
    DB->>G: [{customer:"X", count:42}, ...]
    G->>L: Results + original question
    L-->>S: Token stream ▌
    S-->>U: "The top customer is **X** with 42 billing documents..."
```

### Prompting Strategy

<table>
<tr>
<td width="50%">

**Stage 1 — NL → SQL**
```
System:
  • Full 14-table schema context
  • All FK relationships listed
  • JSON-only output enforced
  • "Never hallucinate column names"
  • Example valid/invalid queries

Input:  [Last 8 turns of history]
        + current user question

Output: {
  "type": "sql",
  "sql": "SELECT...",
  "intent": "aggregation",
  "explanation": "..."
}
```

</td>
<td width="50%">

**Stage 2 — SQL Results → NL**
```
System:
  • ERP answer formatter role
  • Markdown formatting rules
  • "Use exact numbers from data"
  • Max 250 words
  • Highlight key entities in **bold**

Input:  User question
        + executed SQL
        + result rows (up to 50)

Output: Streamed markdown answer ▌
```

</td>
</tr>
</table>

### 🛡️ Guardrails (3 Layers)

```mermaid
graph TD
    Q[User Query] --> K{Layer 1\nKeyword Check}
    K -->|No ERP keywords found| R1[❌ Rejected instantly\nNo API call made]
    K -->|ERP keywords found| LLM{Layer 2\nLLM Domain Check}
    LLM -->|type: rejected| R2[❌ LLM rejects\nwith reason message]
    LLM -->|type: sql| SQL{Layer 3\nSQL Sanitization}
    SQL -->|DROP/DELETE/INSERT etc.| R3[❌ Blocked\nUnsafe SQL operation]
    SQL -->|Valid SELECT only| EXEC[✅ Query executed\nAnswer streamed]

    style R1 fill:#f85149,color:#fff
    style R2 fill:#f85149,color:#fff
    style R3 fill:#f85149,color:#fff
    style EXEC fill:#3fb950,color:#fff
```

**Domain keywords checked (40+):**
```
sales order, billing, delivery, payment, customer, product, material,
journal, accounting, plant, revenue, quantity, stock, fiscal, clearing,
invoice, cancelled, billed, shipped, outstanding, document, open items...
```

### Conversation Memory

The last **8 turns** of conversation are sent to Gemini with every query as multi-turn `contents[]`, enabling natural follow-up questions:

```javascript
// In useChat.js — historyRef persists across renders
historyRef.current = [
  { role: 'user',      content: 'List top 5 customers by revenue' },
  { role: 'assistant', content: 'The top customer is Global Corp...' },
  { role: 'user',      content: 'Show their deliveries' }, // ← Gemini knows context!
  ...
].slice(-8); // Keep last 8 turns
```

**Follow-up workflow example:**
1. `"List top 5 customers by billing amount"` → Gemini lists them
2. `"Which of those had the most deliveries?"` → Gemini filters within context
3. `"Show me the journal entries for the top one"` → Gemini identifies the customer

---

## 📡 API Reference

<details>
<summary><b>GET /graph — Load the full entity graph</b></summary>

```http
GET /graph?limit=200

Response 200:
{
  "nodes": [
    {
      "id": "so_750000001",
      "type": "SalesOrder",
      "label": "SO 750000001",
      "data": { "sales_order": "750000001", "sold_to_party": "320000083", ... }
    }
  ],
  "edges": [
    {
      "id": "so_cust_1",
      "source": "customer_320000083",
      "target": "so_750000001",
      "type": "so_customer",
      "label": "Customer → Order"
    }
  ]
}
```

</details>

<details>
<summary><b>POST /query — Natural language query (standard JSON)</b></summary>

```http
POST /query
Content-Type: application/json

{
  "query": "Which customers have the most billing documents?",
  "history": [
    { "role": "user",      "content": "previous question" },
    { "role": "assistant", "content": "previous answer" }
  ]
}

Response 200:
{
  "type": "success",
  "intent": "aggregation",
  "answer": "The top customer is **Global Corp** with 42 billing documents...",
  "sql": "SELECT sold_to_party, COUNT(*) AS cnt FROM billing_documents GROUP BY...",
  "data": [{"sold_to_party":"320000083","cnt":42}],
  "rowCount": 8,
  "highlightedNodes": ["customer_320000083", "bill_90511234"]
}
```

</details>

<details>
<summary><b>POST /query/stream — Streaming SSE response (real-time tokens)</b></summary>

```http
POST /query/stream
Content-Type: application/json

{ "query": "...", "history": [...] }

# Server-Sent Events stream:
event: thinking
data: {"message":"Processing your query..."}

event: chunk
data: {"text":"The "}

event: chunk
data: {"text":"top customer "}

event: chunk
data: {"text":"is **Global Corp**..."}

event: done
data: {
  "type": "success",
  "sql": "SELECT...",
  "data": [...],
  "rowCount": 8,
  "highlightedNodes": ["customer_320000083"]
}
```

</details>

<details>
<summary><b>GET /graph/node/:type/:id — Get node details</b></summary>

```http
GET /graph/node/Customer/320000083

Response 200:
{
  "type": "Customer",
  "id": "320000083",
  "data": {
    "full_name": "Global Corp GmbH",
    "customer_classification": "A",
    "addresses": [...],
    "salesOrders": [...],
    "payments": [...]
  }
}
```

</details>

<details>
<summary><b>GET /graph/trace/:billingId — Trace full O2C chain</b></summary>

```http
GET /graph/trace/90504248

Response 200:
{
  "billingDocument": { "billing_document": "90504248", "net_value": "12500.00", ... },
  "salesOrders": [...],
  "deliveries": [...],
  "journalEntries": [...],
  "payments": [...]
}
```

</details>

<details>
<summary><b>GET /graph/broken — Find incomplete O2C flows</b></summary>

```http
GET /graph/broken

Response 200:
{
  "deliveredNotBilled": [...],   # Deliveries with no billing document
  "billedNoJournal": [...],      # Billing docs with no journal entry
  "ordersNoDelivery": [...]      # Sales orders with no delivery
}
```

</details>

---

## 🎯 Example Queries

<div align="center">

```
✅ "How many sales orders exist in total?"
✅ "Which customers have the most billing documents?"
✅ "What is the total revenue from billing documents?"
✅ "Find sales orders that were delivered but not billed"
✅ "List the top 5 products by billing quantity"
✅ "Show me all payments above 10000"
✅ "Which deliveries have no billing document?"
✅ "What is the average billing amount per customer?"

❌ "What is the capital of France?"
   → "I can only answer questions about the ERP dataset."
❌ "Write me a poem"
   → "This system is designed for ERP data queries only."
```

</div>

---

## ⚙️ Tech Stack

<div align="center">

<table>
<tr>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="60"/><br>
<b>Node.js</b><br>
<sub>Backend Runtime</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="60"/><br>
<b>React 18</b><br>
<sub>Frontend UI</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="60"/><br>
<b>PostgreSQL</b><br>
<sub>Primary Database</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="60"/><br>
<b>Gemini AI</b><br>
<sub>LLM Engine</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="60"/><br>
<b>Vite 5</b><br>
<sub>Build Tool</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="60"/><br>
<b>Express.js</b><br>
<sub>REST API</sub>
</td>
</tr>
</table>

</div>

### 🏆 Why These Technologies?

<div align="center">

| Technology | Reason | Version |
|---|---|---|
| **Node.js + Express** | Async I/O, non-blocking streaming, fast setup | 18+ / 4+ |
| **PostgreSQL** | Relational data model native to SAP, SQL = LLM-native | 15+ |
| **React Flow** | Best-in-class graph canvas, handles 500+ nodes | 11+ |
| **Gemini 2.5 Flash** | Free tier, fast inference, strong SQL generation | v1alpha |
| **SSE > WebSocket** | HTTP-native streaming, no handshake overhead | Native |
| **Vanilla CSS** | Full control over dark theme, no Tailwind overhead | Native |
| **Winston** | Structured logging with file + console transport | 3+ |

</div>

---

## 🔧 Troubleshooting

<details>
<summary><b>🐍 "models/gemini-1.5-flash not found" API Error</b></summary>

**Cause:** Old model name or wrong API version in the SDK.

**Fix:** Use `gemini-2.5-flash` with the `v1alpha` API override:
```javascript
// server/services/llmService.js
const model = genAI.getGenerativeModel(
  { model: 'gemini-2.5-flash' },
  { apiVersion: 'v1alpha' }  // ← MUST be 2nd argument
);
```

</details>

<details>
<summary><b>⬛ Graph panel appears completely black</b></summary>

**Cause:** `nodeTypes` object defined inside React component → recreated on every render → React Flow internal error.

**Fix:**
```javascript
// ✅ CORRECT — at module/file scope, outside any component
const nodeTypes = { erpNode: ERPNode };

export default function MyGraph() {
  return <ReactFlow nodeTypes={nodeTypes} ... />;
}

// ❌ WRONG — inside component causes the black screen
export default function MyGraph() {
  const nodeTypes = { erpNode: ERPNode }; // breaks React Flow!
}
```

</details>

<details>
<summary><b>💳 Payment nodes showing with no edges</b></summary>

**Cause:** A payment's linked customer was not in the initial 200-node random sample → edge source `customer_X` doesn't exist → React Flow silently drops the edge.

**Fix in `graphService.js`:** After loading payments, identify and fetch missing customer nodes:
```javascript
const missingIds = payments.rows
  .map(p => p.customer)
  .filter(c => c && !nodeSet.has(`customer_${c}`));

if (missingIds.length > 0) {
  const extra = await client.query(
    'SELECT customer, full_name FROM customers WHERE customer = ANY($1)',
    [missingIds]
  );
  // Add to nodeSet before building edges
}
```

</details>

<details>
<summary><b>⚡ Zoom slider not responding during drag</b></summary>

**Cause:** `onChange` fires only on `mouseup`, not continuously during drag in some browsers.

**Fix:** Add `onInput` alongside `onChange`:
```jsx
<input type="range"
  onInput={e => setZoom(parseFloat(e.target.value))}
  onChange={e => setZoom(parseFloat(e.target.value))}
/>
```

</details>

<details>
<summary><b>❓ Node highlights are inconsistent for the same query</b></summary>

**Cause:** Journal Entry node IDs include fiscal year suffix (`je_9100000001_2024`) but the extractor was generating `je_9100000001` (no year) → ID mismatch.

**Fix in `llmService.js`:**
```javascript
// Try with fiscal year first, then fall back to without
if (row.fiscal_year) {
  highlighted.push(`je_${row.accounting_document}_${row.fiscal_year}`);
}
highlighted.push(`je_${row.accounting_document}`); // fallback
```

</details>

---

## 🗺️ System Architecture Overview

```mermaid
graph TB
    subgraph FE["🎨 Frontend — React + Vite (port 5173)"]
        GV["GraphView.jsx\nReact Flow Canvas"]
        CP["ChatPanel.jsx\nStreaming Chat"]
        NDM["NodeDetailModal.jsx\nClick-to-Inspect"]
        UC["useChat.js\nSSE Reader + historyRef"]
        UG["useGraph.js\nData Fetching"]
    end

    subgraph BE["⚙️ Backend — Express (port 3001)"]
        GR["GET /graph\nBuilder"]
        QS["POST /query/stream\nSSE Endpoint"]
        GS["graphService.js\nNode + Edge Builder"]
        LS["llmService.js\nGemini Pipeline"]
    end

    subgraph DB["🐘 PostgreSQL Database"]
        TB["14 Tables\n580+ nodes data\n655+ edge relationships"]
    end

    subgraph AI["🤖 Google AI"]
        G25["Gemini 2.5 Flash\nv1alpha API\nNL→SQL + Streaming"]
    end

    UC -->|POST /query/stream| QS
    UG -->|GET /graph| GR
    GR --> GS --> TB
    QS --> LS
    LS -->|Stage 1: NL→SQL| G25
    LS -->|Execute SQL| TB
    TB -->|Results| LS
    LS -->|Stage 2: SQL→NL| G25
    G25 -->|SSE chunks| UC
    UC --> CP
    GS --> GV
    GV --> NDM
```

---

## 📋 Feature Completion

<div align="center">

| Requirement | Status | Notes |
|---|:---:|---|
| Graph construction (7 node types) | ✅ | Customer, SO, Delivery, Billing, Journal, Payment, Product |
| Graph visualization | ✅ | React Flow with custom nodes, minimap, zoom controls, arrow-pad |
| Node inspection modal | ✅ | Click modal with type-specific detail renderers |
| Conversational NL query interface | ✅ | Full NL → SQL → NL pipeline |
| Guardrails (domain restriction) | ✅ | 3-layer protection system |
| Example Query a (products + billings) | ✅ | SQL GROUP BY aggregation |
| Example Query b (trace O2C flow) | ✅ | `/graph/trace/:id` endpoint |
| Example Query c (broken flows) | ✅ | `/graph/broken` — 3 categories |
| **Bonus:** NL → SQL translation | ✅ | Core pipeline mechanism |
| **Bonus:** Node highlighting in responses | ✅ | Auto-pan + gold pulse glow |
| **Bonus:** Streaming LLM responses | ✅ | SSE token-by-token stream |
| **Bonus:** Conversation memory | ✅ | Last 8 turns as Gemini context |
| **Extra:** Click-to-highlight neighbors | ✅ | Dims unconnected nodes to 12% opacity |
| **Extra:** SQL transparency | ✅ | Collapsible query block in every answer |
| **Extra:** Data tables in chat | ✅ | Scrollable raw result rows |

</div>

---

## 🚀 Future Roadmap

<table>
<tr>
<td width="50%">

### 🎯 **Short-Term** (Deployment)

- [ ] 🌐 **Cloud Deployment**
  - Supabase (PostgreSQL hosting)
  - Render (Backend API)
  - Vercel (Frontend)
- [ ] 🔐 **Auth Layer**
  - Supabase Auth for API protection
  - JWT-secured query endpoints
- [ ] 📦 **Dataset Expansion**
  - Remove 200-node per type limit
  - Load full dataset with pagination

</td>
<td width="50%">

### 🔮 **Long-Term** (Enhancements)

- [ ] 🕸️ **Graph Algorithm Layer**
  - Shortest path between any two nodes
  - Centrality analysis (most connected nodes)
  - Community detection
- [ ] 🤖 **Multi-Model Support**
  - OpenAI GPT-4o fallback
  - Anthropic Claude integration
- [ ] 📊 **Analytics Dashboard**
  - O2C velocity metrics
  - Revenue trend charts
  - Bottleneck detection

</td>
</tr>
</table>

---

## ❓ FAQ

<details>
<summary><b>Q: Why PostgreSQL instead of a native graph database like Neo4j?</b></summary>

**A:** Three reasons:
1. **Free tier** — PostgreSQL has free hosting (Supabase, Railway, Neon). Neo4j free tier is limited.
2. **LLM-native** — Gemini was trained on SQL, not Cypher. SQL generation is more reliable.
3. **Data is relational** — SAP O2C data has FK references everywhere. A relational schema is the natural fit; graph is the visualization layer on top.

</details>

<details>
<summary><b>Q: Why SSE instead of WebSocket for streaming?</b></summary>

**A:** SSE is simpler for unidirectional streaming (server → client only). It works over standard HTTP without connection upgrades, doesn't require `ws://` protocol handling, and works natively with the Fetch API's `ReadableStream`. For LLM token streaming where flow is always server → client, SSE is the right tool.

</details>

<details>
<summary><b>Q: The graph is slow to render with 580+ nodes. How can I speed it up?</b></summary>

**A:** Reduce the limit in the URL: `GET /graph?limit=100` loads only 100 nodes per type. For production, implement viewport-based culling using React Flow's `useNodesInViewport` hook — only render nodes visible in the current viewport.

</details>

<details>
<summary><b>Q: Why does the column layout sometimes look uneven?</b></summary>

**A:** The column layout places nodes by entity type. If one type (e.g., Delivery) has far more nodes than another (e.g., Customer), that column will be much taller. A force-directed layout would distribute more evenly but would lose the left-to-right O2C flow readability.

</details>

<details>
<summary><b>Q: Can I add more entity types to the graph?</b></summary>

**A:** Yes. In `graphService.js`:
1. Add a new query to load the entity
2. Add a node builder (similar to existing ones)
3. Add a new case in the `TYPE_ORDER` array in `GraphView.jsx`
4. Add the new color/icon to the ERPNode component

</details>

<details>
<summary><b>Q: How does conversation memory affect API costs?</b></summary>

**A:** Each query sends up to 8 previous turns as extra tokens. Since Gemini 2.5 Flash is on the free tier with very generous limits, this has no direct cost. If you upgrade to paid, trimming history to 4 turns is a good balance between context and token usage.

</details>

---

## 🤝 Contributing

<div align="center">

**Contributions are welcome!** 🎉

</div>

<table>
<tr>
<td>1️⃣</td>
<td><b>Fork the repository</b></td>
<td>Create your own copy on GitHub</td>
</tr>
<tr>
<td>2️⃣</td>
<td><b>Create a feature branch</b></td>
<td><code>git checkout -b feature/AmazingFeature</code></td>
</tr>
<tr>
<td>3️⃣</td>
<td><b>Make your changes</b></td>
<td>Follow the existing code style</td>
</tr>
<tr>
<td>4️⃣</td>
<td><b>Commit your changes</b></td>
<td><code>git commit -m 'Add some AmazingFeature'</code></td>
</tr>
<tr>
<td>5️⃣</td>
<td><b>Push to your branch</b></td>
<td><code>git push origin feature/AmazingFeature</code></td>
</tr>
<tr>
<td>6️⃣</td>
<td><b>Open a Pull Request</b></td>
<td>Describe what you changed and why</td>
</tr>
</table>

### 💡 Contribution Ideas

- 📊 Add graph analytics (centrality, shortest path)
- 🌙 Add additional LLM provider support (GPT-4o, Claude)
- 📱 Make the layout responsive for mobile views
- 🧪 Add unit tests for the LLM pipeline
- 🔍 Add full-text search across node labels
- 📝 Improve SQL generation with few-shot examples

---

## 🙏 Acknowledgements

<div align="center">

<table>
<tr align="center">
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="60"/><br>
<b>🤖 Google AI</b><br>
<sub>Gemini 2.5 Flash API</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="60"/><br>
<b>⚛️ React Team</b><br>
<sub>React & Hooks</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="60"/><br>
<b>🐘 PostgreSQL</b><br>
<sub>Reliable & Powerful DB</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="60"/><br>
<b>🟢 Node.js</b><br>
<sub>Non-blocking Runtime</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="https://avatars.githubusercontent.com/u/155890684?v=4" width="60" style="border-radius:50%"/><br>
<b>👨‍💻 Development</b><br>
<sub><a href="https://github.com/IdealAnkit">IdealAnkit</a></sub><br>
<sub>Lead Developer</sub>
</td>
<td align="center">
<img src="https://img.icons8.com/fluency/96/workstation.png" width="60"/><br>
<b>🕸️ React Flow</b><br>
<sub>Graph Visualization</sub>
</td>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="60"/><br>
<b>⚡ Vite</b><br>
<sub>Blazing Fast Build</sub>
</td>
<td align="center">
<img src="https://img.icons8.com/color/96/console.png" width="60"/><br>
<b>📋 Winston</b><br>
<sub>Structured Logging</sub>
</td>
</tr>
</table>

### 🌟 Special Thanks

- **[React Flow](https://reactflow.dev/)** — outstanding graph visualization library that made 580+ node rendering possible
- **[@google/generative-ai](https://github.com/google-gemini/generative-ai-js)** — the SDK powering the multi-turn streaming pipeline
- **[Winston](https://github.com/winstonjs/winston)** — clean structured logging
- **[Vite](https://vitejs.dev/)** — blazing fast dev server with HMR

</div>

---

---

<div align="center">

### 📊 Project Stats

![Lines of Code](https://img.shields.io/badge/Lines_of_Code-3000+-blue)
![DB Tables](https://img.shields.io/badge/DB_Tables-14-purple)
![Graph Nodes](https://img.shields.io/badge/Graph_Nodes-580+-green)
![Documentation](https://img.shields.io/badge/Documentation-Excellent-brightgreen)
![Maintained](https://img.shields.io/badge/Maintained-Yes-success)

---

### 📞 Contact & Support

<table>
<tr>
<td align="center">
<b>🐛 Found a Bug?</b><br>
<a href="https://github.com/IdealAnkit/erp-graph-system/issues">Report Issue</a>
</td>
<td align="center">
<b>💡 Have an Idea?</b><br>
<a href="https://github.com/IdealAnkit/erp-graph-system/issues">Request Feature</a>
</td>
<td align="center">
<b>📧 Contact</b><br>
<a href="mailto:mrankitkumar1530@gmail.com">mrankitkumar1530@gmail.com</a>
</td>
</tr>
</table>

---

### ⭐ If you found this project helpful, please consider giving it a star!

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Built with Love](https://img.shields.io/badge/Built%20with-Love-red?style=for-the-badge&logo=heart&logoColor=white)](https://github.com/IdealAnkit)

**© 2026 ERP Graph Explorer — Dodge AI FDE Assessment**

*Built for the Forward Deployed Engineer role at Dodge AI*
*Submission Deadline: 26 March 2026, 11:59 PM IST*

---

<p><a href="#-erp-graph-explorer">Back to Top ↑</a></p>

</div>
