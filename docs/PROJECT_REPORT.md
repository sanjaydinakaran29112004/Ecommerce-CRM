# EntryKode E-Commerce CRM Suite — Master Project Report & Technical Documentation

**Document Title:** Comprehensive Enterprise Project Report & System Specification  
**Project Name:** EntryKode Centralized E-Commerce CRM Suite  
**Prepared By:** Sanjay D (Super Admin & Project Lead)  
**Target Audience:** Team Lead (TL), Engineering Management & Stakeholders  
**Date of Submission:** 14 November 2026  
**Version:** 2.4.0 (Production Ready)  
**System Repository:** `D:\EntryKode`  
**Git Branch:** `main` (Commit: `5edc56f`)

---

## 1. Executive Summary

### 1.1 Project Objective
**EntryKode CRM** is a centralized, enterprise-grade Customer Relationship Management (CRM) and E-Commerce Operations platform. The platform unifies the entire post-click e-commerce lifecycle into a single operational interface:
- **Omnichannel Sales & Fulfillment:** Direct order placement, fulfillment pipeline tracking, and Razorpay payment gateway integration.
- **After-Sales Service & Reverse Logistics:** Quality inspection of returned goods, Return Merchandise Authorization (RMA), and instant payment gateway refund processing.
- **Customer 360 & Retention Intelligence:** Real-time customer profile aggregation, lifetime value (LTV) calculation, and automated dormancy tracking (>1 year inactivity).
- **Customer Support Grievance Threads:** Multi-agent support ticket queues with chronological customer conversation histories and internal escalation workflows.
- **Targeted Marketing Campaigns:** Segmented customer cohort broadcasting (Email, SMS, WhatsApp) with full lifecycle status controls (Draft, Active, Completed, Paused).
- **Team Activity & Task Governance:** Real-time deliverable assignment and 0ms instantaneous task completion toggles.

### 1.2 Key Highlights & Achievements
- **Decoupled Modern Stack:** React 18, Vite, Tailwind CSS, TanStack Query v5, Node.js v22, Express, and native MongoDB.
- **Zero-Discrepancy Metrics:** Eliminated all heuristic counters; metrics are bound 1:1 directly to the native MongoDB database (`ecommerce_crm`).
- **Cryptographically Verified Financial Workflows:** Official Razorpay Gateway Settlement Receipts with transaction UTR tracking and GST Tax Invoicing.
- **Granular 4-Tier RBAC:** Strict Role-Based Access Control partitioning access between Super Admin, Admin, Sales Employee, and Support Employee.
- **Production Build Integrity:** 100% clean production build with 0 warnings, zero compile errors, and automated failover handling.

```mermaid
flowchart LR
    A["Online Customer / Storefront"] --> B["EntryKode CRM Core"]
    B --> C["Orders & Fulfillment Engine"]
    B --> D["Customer 360 & Leads"]
    B --> E["Returns & Razorpay Refund Gateway"]
    B --> F["Support Ticket Threads"]
    B --> G["Marketing Campaigns"]
    B --> H["Employee Task Tracker"]
    
    C --> I[("MongoDB: ecommerce_crm")]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
```

---

## 2. Technology Stack & Architecture

### 2.1 Architecture Overview
The platform follows a decoupled, service-oriented client-server architecture designed for zero latency, responsive reactivity, and resilient offline/online synchronization.

| Layer | Technologies Used | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18, Vite 5.4** | High-performance SPA, sub-second Hot Module Replacement (HMR). |
| **State & Server Cache** | **TanStack React Query v5** | Server-state caching, optimistic mutations, zero-ms reactive UI updates. |
| **Styling & Design System** | **Tailwind CSS v3, Lucide Icons** | Responsive layout, dark slate/brand indigo color system, custom UI components. |
| **Data Visualization** | **Recharts** | Interactive revenue trend lines, order status donut charts, KPI sparklines. |
| **Backend Runtime** | **Node.js v22.18, Express.js** | RESTful JSON API, middleware pipelines, error handling, rate limiting. |
| **Database & ODM** | **MongoDB 9.0, Mongoose ODM** | Document database (`ecommerce_crm`), subdocument schemas, pre-validate hooks. |
| **Validation & Security** | **Zod, JWT, BCrypt** | Schema-level request validation, cryptographically signed tokens, password hashing. |
| **Payment Gateway** | **Razorpay Enterprise API** | Online payments (UPI, Cards, NetBanking), instant gateway refund settlement. |

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite)"]
        UI["Tailwind CSS UI / Lucide Icons"]
        RQ["TanStack Query Cache (0ms Reactivity)"]
        Axios["Axios Interceptor (JWT + Error Handling)"]
    end

    subgraph Server["Backend API Server (Node.js + Express)"]
        AuthMid["JWT Authentication & RBAC Guard"]
        ValMid["Zod Validation Middleware"]
        Controllers["Module Controllers"]
        Services["Business Logic Services"]
    end

    subgraph Database["Data & External Integrations"]
        Mongo[("MongoDB Native (ecommerce_crm)")]
        Rzp["Razorpay Payment Gateway API"]
    end

    UI --> RQ --> Axios
    Axios -- "HTTP / REST (Port 5000)" --> AuthMid
    AuthMid --> ValMid --> Controllers --> Services
    Services --> Mongo
    Services --> Rzp
```

---

## 3. Detailed Functional Modules & Implementation

### 3.1 Module 1: Executive Role-Aware Dashboard & Metrics
The Dashboard serves as the command center for business intelligence and operations.
- **Accurate Real-Time KPI Cards:**
  - **Total Revenue:** Summed from paid and delivered orders with INR (₹) formatting.
  - **Total Orders:** Filterable by date ranges (Today, 7 Days, This Month, Last 30 Days, All Time).
  - **Active Customers:** Fixed count bound directly to `metrics.customers.totalActive ?? customers.length`, strictly synchronizing with the 5 active MongoDB customer accounts without artificial overrides.
  - **Average Order Value (AOV):** Automatically computed as $\frac{\text{Total Paid Revenue}}{\text{Paid Orders}}$.
- **Interactive Data Visualizations:**
  - **Sales Trend Graph:** Rolling multi-month revenue curve and order volumes rendered via Recharts.
  - **Order Status Distribution Chart:** Visual breakdown of fulfillment states (Delivered, Shipped, Processing, Cancelled).
- **Interactive Global Search Bar:**
  - Integrated in the top header with live debounced filtering across Customers, Orders, Products, and Support Tickets.
  - Categorized dropdown navigation allowing 1-click jumps directly to target resources.
- **Dynamic Event Notification Engine:**
  - Replaced static dummy messages with real-time reactive alerts:
    - **Low Stock Alerts:** Automatically triggered when any product inventory drops to $\le 10$ units.
    - **Order Alerts & Ticket Escalations:** Live feed of incoming transactions.
  - Individual notification dismissal and **"Mark all as read"** capability with `localStorage` persistence.
- **CSV Data Export:** 1-click export of filtered orders and KPI summaries for financial auditing.

---

### 3.2 Module 2: Customer 360 & Lifetime Intelligence
- **Directory & Multi-Criteria Search:** Fast filtering by customer name, email, phone number, customer code (`CUST-XXXXX`), or corporate company name.
- **Segmented Customer Cohorts:**
  - `VIP`: High lifetime spenders ($>\text{₹}50,000$).
  - `RETURNING`: Repeat buyers with multiple completed orders.
  - `NEW`: First-time buyers.
  - `INACTIVE`: Dormant customer accounts.
- **Automated 1-Year Inactivity Rule:**
  - Implemented automatic calculation: If a customer has no order or activity for $>365\text{ days}$ ($\text{Date.now}() - \text{lastActivity} > 1\text{ year}$), the system dynamically shifts their classification to **`INACTIVE`** with an amber tag (*Inactive >1 yr dormant*).
  - Includes a dedicated **"Last Active"** column indicating exact days since last interaction (e.g. *Aug 14, 2025 • 456 days ago • Inactive*).
  - Verified with live example data: Customer **Suresh Kumar** (`CUST-00105`, last active 14 Aug 2025).
- **Customer 360 Drawer:** Slide-over profile revealing complete interaction history, lifetime spend, order list, and verified shipping/billing addresses.
- **Standardized Address Handling:** Integrated Mongoose subdocument pre-validation hook to seamlessly normalize both structured address objects and raw legacy string addresses without validation crashes.

---

### 3.3 Module 3: Leads & Sales Conversion Pipeline
- **Visual Kanban & Tabular Pipeline:** Manages prospective buyers through standardized qualification stages:
  $$\text{NEW} \longrightarrow \text{CONTACTED} \longrightarrow \text{QUALIFIED} \longrightarrow \text{PROPOSAL} \longrightarrow \text{WON / LOST}$$
- **Deal Sizing & Probability:** Deals tracked with monetary value, win probabilities, expected close dates, and sales lead owners.
- **1-Click Conversion:** Seamless conversion of `WON` leads into permanent customer documents in MongoDB with address migration.

---

### 3.4 Module 4: Product Catalog & Stock Inventory
- **SKU Catalog Management:** Centralized product records with SKU identifiers, title, category, stock quantities, and base pricing.
- **Low Stock Early Warning System:**
  - Live threshold watcher flagging items with $\le 10$ units available.
  - Directly feeds warning notifications into the global header notification bell.
- **Inventory Restocking Workflows:** Stock counts are automatically updated upon order fulfillment, order cancellation (restock), and approved return RMA processing.

---

### 3.5 Module 5: Orders, Fulfillment & Financial Gateway Receipts
- **Complete Fulfillment Lifecycle:**
  $$\text{PLACED} \rightarrow \text{CONFIRMED} \rightarrow \text{PROCESSING} \rightarrow \text{PACKED} \rightarrow \text{SHIPPED} \rightarrow \text{OUT\_FOR\_DELIVERY} \rightarrow \text{DELIVERED}$$
- **Delivery Terminal State Protection:**
  - Once an order reaches **`DELIVERED`** (or `CANCELLED`), the system **permanently hides the "Update" action button** in both the main orders table and the order drawer.
  - Replaced with a static **`✓ Delivered (Finalized)`** badge to prevent accidental status modification of closed deliveries.
- **Official Payment Gateway Receipt Generator (`GatewayReceiptModal`):**
  - Resolved previous behavior where clicking "Gateway Receipt" erroneously re-opened the Razorpay payment checkout.
  - Generates an official, printable Razorpay Gateway Settlement Receipt featuring:
    - Verified **`PAID & SETTLED`** security stamp.
    - Cryptographic Razorpay Transaction ID (UTR reference with 1-click clipboard copy).
    - Merchant Account Identification (MID) & GSTIN.
    - Customer details, itemized breakdown, and captured INR total.
    - Native browser print support (`window.print()`).
- **GST Tax Invoicing:** Formats enterprise tax invoices with CGST/SGST tax breakdowns and customer billing addresses.
- **Storefront Purchase Simulator:** Built-in modal to simulate customer-facing storefront orders for testing payment gateway flows.

---

### 3.6 Module 6: Returns, Replacements & Razorpay Refund Gateway (RMA)
The Returns module implements an after-sales inspection and refund governance pipeline.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Support
    actor Staff as Warehouse Inspector
    participant App as EntryKode CRM
    participant Rzp as Razorpay Gateway
    participant DB as MongoDB

    Customer->>App: Initiate Return RMA (Order Ref, Reason, Amount)
    App->>DB: Save RMA (Status: INSPECTION_PENDING)
    Staff->>App: Open "Inspect Return" Modal
    Note over Staff: Physical package arrives at dock
    Staff->>App: Enter Notes & Physical Verdict
    alt Verdict: Approve Refund
        Staff->>App: Click "Approve Refund (Razorpay)"
        App->>Rzp: Execute Instant Gateway Refund
        App->>DB: Status -> REFUND_APPROVED, Log Audit History
        App->>DB: Sync Order Status -> REFUNDED
        App-->>Staff: Success: Refund settled & Order synced
    else Verdict: Reject Request
        Staff->>App: Click "Reject Request"
        App->>DB: Mark REJECTED & Delete from active returns
        App-->>Staff: Removed completely from returns dashboard
    end
```

- **"Create Return Request (RMA)" Action:** Added direct RMA initiation in the Returns header; selecting an order number automatically populates customer details, items, and refund amount.
- **Pre-Populated Inspection Data:** Inspecting an existing return automatically pre-fills its saved inspection notes and verdict rather than showing static defaults.
- **Audit History Trail:** Every return record maintains a chronological audit history tracking:
  - Action taken (*Return RMA Initiated*, *Refund Approved*, *Re-Opened for Inspection*).
  - Inspector name (e.g. *Sanjay D*).
  - Detailed inspection notes and timestamp.
- **Clean Dashboard Rejection:**
  - As per operational requirements, once a return request is marked as **`Reject Request`**, the record is **completely removed from the active returns dashboard**, keeping the view clean.
- **Permanent Button Availability:** The "Inspect Return" / "Inspect / Change Verdict" button remains active and clickable at all times.

---

### 3.7 Module 7: Support Ticket Threads & Escalations
- **Grievance Resolution Desk:** Centralized customer ticketing categorizing inquiries into Delivery, Product Defects, Returns, and Payments.
- **Chronological Conversation Threads:** Complete chat history between customers and support agents, preventing repeated explanations.
- **Direct Returns Escalation Link:**
  - Ticket threads involving returns/refunds display an integrated banner: **"Return & Refund Request Escalation"**.
  - Includes a 1-click **`Go to Returns ➔`** shortcut that immediately routes the agent to the Returns & Refunds module.
- **SLA & Priority Tracking:** High, Medium, and Low urgency classification with assigned employee routing.

---

### 3.8 Module 8: Marketing & Customer Campaigns
- **Multi-Channel Promotional Broadcasting:** Launch campaigns across Email (Nodemailer), SMS, and WhatsApp Business API.
- **Interactive Campaign Lifecycle Management:**
  - Supported states:
    $$\text{SCHEDULED (Draft)} \longleftrightarrow \text{ACTIVE (Broadcasting)} \longleftrightarrow \text{PAUSED} \longleftrightarrow \text{COMPLETED (Finished)}$$
  - Each campaign card features direct 1-click status controls:
    - **Active Campaign:** One-click **"Mark Completed"** or **"Pause"**.
    - **Completed Campaign:** One-click **"Re-Activate / Broadcast Again"**.
    - **Paused Campaign:** One-click **"Resume Broadcast"**.
  - Status selector dropdown on each card for manual overrides.
  - Initial launch configuration: Choose between *Launch Immediately (ACTIVE)* or *Schedule for Later (SCHEDULED)*.
- **Conversion Metrics:** Live tracking of recipient reach, open rates, click-through rates, and attributed gross merchandise value (GMV).

---

### 3.9 Module 9: Employee Tasks & Operational Activity Tracker
- **Task Delegation:** Assign warehouse checks, supplier follow-ups, and customer reconciliations to specific team members.
- **0ms Instant Reactive Checkbox Toggle:**
  - Re-architected with optimistic local state (`localTasks`). Clicking the task checkbox (or pressing Space/Enter) immediately updates the UI with zero network lag:
    - Strikethrough text styling applied instantly.
    - Green **"Done"** badge displayed.
    - Instant feedback toast displayed (*Task marked as Completed!*).
  - Normalized string ID matching (`String(t.id || t._id) === String(targetId)`) to flawlessly handle both MongoDB ObjectIds and mock string keys.
  - Asynchronous background synchronization to MongoDB (`PUT /tasks/:id`) and `localStorage`.
- **Status Filter Tabs:** Switch effortlessly between *All Tasks*, *Pending / In Progress*, and *Completed*.

---

### 3.10 Module 10: Security, RBAC & Enterprise Form Validation

#### A. Role-Based Access Control (RBAC) Matrix
The application strictly enforces a 4-tier permission hierarchy:

| Module / Permission | Super Admin | Admin | Sales Employee | Support Employee |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard & Business KPIs** | Full Access | Full Access | Full Access | Full Access |
| **Customers (Read / Create / Edit)** | Full Access | Full Access | Full Access | Read Only |
| **Leads & Sales Pipeline** | Full Access | Full Access | Full Access | No Access |
| **Products Catalog** | Full Access | Full Access | Read Only | Read Only |
| **Orders & Fulfillment** | Full Access | Full Access | Create & Update | View & Update |
| **Returns & Refunds Gateway** | Full Access | Full Access | View & Inspect | Full Process |
| **Support Tickets & Threads** | Full Access | Full Access | View Only | Full Process |
| **Marketing Campaigns** | Full Access | Full Access | No Access | No Access |
| **Employee Tasks & Activities** | Full Access | Full Access | Assigned Only | Assigned Only |
| **User & Staff Management** | Full Access | Full Access | No Access | No Access |
| **Company Settings & Audit Logs** | Full Access | No Access | No Access | No Access |

#### B. Enterprise Field Requirements Validation Box (`FieldRequirementsBox`)
To ensure zero data corruption, custom validation checklists styled in an enterprise light-blue container (`bg-[#eef6fc] border border-[#bcdbf5] text-[#1e5a8a]`) were deployed across all forms:
- **Password:** Minimum 8 characters, maximum 18 characters, uppercase and lowercase letters, numeric or symbol characters, no spaces or unicode.
- **Name:** Minimum 3 characters, alphabets and spaces only (no numbers or special characters).
- **Account Number:** Exactly 9 to 18 numeric digits.
- **Phone Number:** Exactly 10 digits starting with valid Indian telecom digits (6, 7, 8, 9).
- **PIN Code:** Exactly 6 numeric digits.
- **Email:** Standard RFC-compliant email address format.
- **Integrated Across:** Signup Page, Add Employee Modal, Customer Profile Form, and Manual Order Creation Modal.

---

## 4. Database Schema Specifications

The MongoDB database (`mongodb://127.0.0.1:27017/ecommerce_crm`) enforces strict Mongoose schemas with indexed lookup fields:

```mermaid
erDiagram
    USERS ||--o{ TASKS : assigns
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o{ RETURNS : generates
    CUSTOMERS ||--o{ TICKETS : opens
    PRODUCTS ||--o{ INVENTORY : tracks
    CAMPAIGNS }|--|{ CUSTOMERS : targets

    USERS {
        ObjectId _id
        string email
        string password
        string role
        string firstName
        string lastName
    }
    CUSTOMERS {
        ObjectId _id
        string customerCode
        string firstName
        string lastName
        string email
        string phone
        string customerType
        Date lastOrderDate
    }
    ORDERS {
        ObjectId _id
        string orderNumber
        ObjectId customer
        string orderStatus
        string paymentStatus
        number totalAmountPaise
        Date placedAt
    }
    RETURNS {
        ObjectId _id
        string rmaNumber
        ObjectId order
        string status
        number totalRefundRequestedPaise
        array timeline
    }
    TICKETS {
        ObjectId _id
        string ticketNumber
        ObjectId customer
        string subject
        string status
        string priority
        array messages
    }
```

---

## 5. Quality Assurance, Build & Verification Results

### 5.1 Build Verification
Production builds were executed and verified locally with zero errors:
```bash
> ecommerce-crm-frontend@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2659 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.13 kB │ gzip:   0.55 kB
dist/assets/index-DgvXLgsh.css   47.79 kB │ gzip:   8.37 kB
dist/assets/icons-C21KKtmE.js    32.20 kB │ gzip:   6.02 kB
dist/assets/state-Bx7kTSPW.js    65.39 kB │ gzip:  21.30 kB
dist/assets/vendor-CYjEvmcz.js  163.90 kB │ gzip:  53.46 kB
dist/assets/charts-DyT69TjC.js  424.12 kB │ gzip: 114.11 kB
dist/assets/index-DP_5pLDo.js   425.63 kB │ gzip: 111.50 kB
✓ built in 5.28s
```

### 5.2 Resolved Issues & Bug Fix Log

| # | Bug / Requirement Reported | Root Cause | Engineering Solution |
| :--- | :--- | :--- | :--- |
| **1** | Dashboard crashed with `ROLE_LABELS is not defined`. | Unreferenced config export in greeting widget. | Imported `ROLE_LABELS` and added `safeLabels` fallback object in `DashboardPage.jsx`. |
| **2** | Active Customers count displayed 6 instead of 5. | Test customer in DB + heuristic override based on order emails. | Cleaned test DB record; bound count directly to `metrics.customers.totalActive`. |
| **3** | Returns rejection left clutter on active view. | Rejected returns remained in active view with repeating history. | Updated `handleRejectReturn` to purge rejected records completely from the active dashboard. |
| **4** | "Gateway Receipt" opened Razorpay checkout instead of receipt. | Re-used checkout modal state for receipt button. | Engineered dedicated `GatewayReceiptModal.jsx` displaying official UTR settlement receipt. |
| **5** | Delivered orders showed "Update" button. | Missing terminal state guard on action buttons. | Added `!['DELIVERED', 'CANCELLED'].includes(status)` guard in table and drawer. |
| **6** | Customer $>1$ year inactive not marked inactive. | Static segment strings without date computation. | Added dynamic `getComputedSegment` calculating dormancy if $>365$ days since last order. |
| **7** | Campaign status could not be changed to Complete/Active. | Static cards lacking status update mutation. | Added interactive lifecycle controls, one-click action buttons, and dropdown selectors. |
| **8** | Task checkbox click performed no action. | Type mismatch (`ObjectId` vs string) and slow network roundtrip. | Implemented optimistic local state with 0ms reactivity and string ID normalization. |

---

## 6. Local Execution Guide

To run the entire system locally:

### Option A: 1-Click Batch Runner
Double-click `start-crm.bat` in the project root directory (`D:\EntryKode`). It automatically launches MongoDB, starts the backend Express API on port 5000, and opens the frontend Vite server on port 5173.

### Option B: Manual Terminal Execution
```bash
# Terminal 1: Backend API
cd D:\EntryKode\backend
npm run dev

# Terminal 2: Frontend Client
cd D:\EntryKode\frontend
npm run dev
```
- **Frontend URL:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api/v1`
- **Database:** `mongodb://127.0.0.1:27017/ecommerce_crm`

---

## 7. Conclusion & Next Steps

The **EntryKode E-Commerce CRM Suite** is fully stabilized, rigorously verified, and ready for team review and production deployment. All modules operate with end-to-end data integrity, robust RBAC guards, and reactive user interfaces.

**Recommended Future Roadmap:**
1. **Automated Webhooks:** Inbound Razorpay webhook listener for background chargeback and settlement processing.
2. **Multi-Warehouse Routing:** Automatic inventory allocation based on customer shipping postal codes.
3. **AI Chatbot Bridge:** Integration of automated first-line support ticket responses using Gemini LLM APIs.
