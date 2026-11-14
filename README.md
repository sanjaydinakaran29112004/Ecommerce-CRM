# EntryKode E-Commerce CRM Suite — Centralized Management System
**Enterprise Customer Relationship Management Platform for E-Commerce**  
Built with the modern **MERN Stack** (MongoDB 9.0, Express.js, React 18, Vite 5.4, Node.js v22).

[![Live Documentation](https://img.shields.io/badge/Live%20Hosted%20Docs-GitHub%20Pages-blueviolet?style=for-the-badge)](https://sanjaydinakaran29112004.github.io/Ecommerce-CRM/)
[![Download Word Report](https://img.shields.io/badge/Download-Word%20Report%20(.docx)-2b579a?style=for-the-badge&logo=microsoftword&logoColor=white)](./EntryKode_CRM_Master_Project_Report.docx)
[![Project Report](https://img.shields.io/badge/Documentation-Master%20Project%20Report-blue?style=for-the-badge)](./PROJECT_REPORT.md)
[![Build Status](https://img.shields.io/badge/Production%20Build-Passing%20(0%20errors)-brightgreen?style=for-the-badge)](./PROJECT_REPORT.md)
[![MERN Stack](https://img.shields.io/badge/Stack-MongoDB%20|%20Express%20|%20React%2018%20|%20Node%20v22-green?style=for-the-badge)](./PROJECT_REPORT.md)

---

## 🌐 Live Hosted Documentation Portal (GitHub Pages)
> 🚀 **Interactive Hosted Documentation Web Portal:**  
> Access the live online documentation with Mermaid diagrams, interactive module explorer, and printable PDF reports:  
> 👉 **[https://sanjaydinakaran29112004.github.io/Ecommerce-CRM/](https://sanjaydinakaran29112004.github.io/Ecommerce-CRM/)**  
> *(Source code located under [`docs/index.html`](./docs/index.html))*

---

## 📑 Master Technical Blueprint & Project Report (For TL & Reviewers)
> 📄 **Complete Technical & Architectural Project Report:**  
> - **Markdown Master Document:** **[PROJECT_REPORT.md](./PROJECT_REPORT.md)** *(also in [`docs/PROJECT_REPORT.md`](./docs/PROJECT_REPORT.md))*  
> - **Downloadable Microsoft Word (.docx):** **[EntryKode_CRM_Master_Project_Report.docx](./EntryKode_CRM_Master_Project_Report.docx)** *(ready to submit or print)*  
> Includes complete architectural schematics, all 15 module breakdowns, all 13 database model specifications, REST API contracts, security design, and QA resolution logs.

---

## 👥 Development Team & Ownership
- **Super Admin & Full Stack Lead:** Sanjay D (`sanjay@entrykode.com` / `sanjay@gmail.com`)
- **Frontend Architecture:** React 18, Vite, Tailwind CSS, TanStack Query v5, Recharts, Lucide Icons
- **Backend Architecture:** Node.js v22, Express.js, MongoDB (`ecommerce_crm`), Mongoose ODM, JWT & RBAC
- **Organization:** EntryKode Technologies

---

## 📁 Repository Structure
```
d:\EntryKode\
├── frontend/             # Single-Page React Application (React 18 + Vite + Tailwind)
├── backend/              # Modular Express REST API (Node.js + MongoDB + Mongoose)
├── docs/                 # Live GitHub Pages Portal & Shared Specs
│   ├── index.html        # Hosted Web Documentation Portal (GitHub Pages)
│   ├── PROJECT_REPORT.md # Technical documentation copy
│   ├── api-contracts/    # Canonical JSON request/response formats
│   └── database-schema/  # MongoDB collection designs
├── PROJECT_REPORT.md     # Master Project Report & Technical Blueprint for TL
└── README.md             # Repository entry point
```

---

## 🌟 Complete Functional Modules (15 Modules & 13 Database Models)

1. **Executive Dashboard & Real-Time Analytics:** Live KPI summary cards, revenue trend charts, real-time stock alert notifications with dismiss/mark-all-read reactivity, and global fuzzy search.
2. **Customer 360 & Automated Dormancy Rule:** Complete customer lifecycle management with automatic dormancy detection (>1 year inactive transitioned to `INACTIVE`).
3. **Leads & Sales Pipeline Kanban:** Interactive drag-and-drop lead stage progression from New to Won/Lost with conversion metrics.
4. **Product Catalog & Stock Management:** Complete SKU, pricing, category, and real-time stock thresholds with automatic low-stock notifications.
5. **Warehouse Inventory & Stock Ledger:** Multi-warehouse inventory stock tracking and immutable `StockMovement` audit ledger.
6. **Orders & Fulfillment Pipeline:** Multi-stage order tracking (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`). Delivered orders are permanently locked against modifications. Includes official **Razorpay Gateway Settlement Receipts**.
7. **Payment Gateway Integration:** Cryptographic Razorpay payment settlements with unique UTR reference tracking and idempotency guards.
8. **Returns & Refunds (Reverse Logistics & RMA):** Formal RMA inspection workflow, hardware verification history, instant Razorpay gateway refunds, and clean rejection purge.
9. **Customer Support Tickets & Grievance Threads:** Multi-agent support thread workspace with chronological customer interaction logs and direct RMA initiation.
10. **Targeted Marketing Campaigns:** Cohort marketing with one-click 4-stage lifecycle status controls (`SCHEDULED` ↔ `ACTIVE` ↔ `PAUSED` ↔ `COMPLETED`).
11. **Team Tasks & Deliverables:** Sub-second 0ms reactive checkbox task completion toggles with live status filtering.
12. **Business Intelligence & Financial Reports:** Sales velocity analysis, AOV calculations, and 1-click CSV export engine for audits.
13. **Staff, Employees & Roles (RBAC):** Strict 4-tier RBAC (`SUPER_ADMIN`, `ADMIN`, `SALES_MANAGER`, `SUPPORT_MANAGER`) with role provisioning.
14. **System Settings & Security Compliance:** Enterprise field-level requirement tooltips (`FieldRequirementsBox`) for security compliance across all forms.
15. **Immutable Audit Logging:** Tamper-evident governance tracking recording every critical business event with actor metadata and IP addresses.

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Run
```bash
cd backend
npm install
npm run dev
```
*API runs on `http://localhost:5000` connected to MongoDB `ecommerce_crm`.*

### 2. Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```
*Dashboard opens on `http://localhost:5173`.*

---

## 🔑 Enterprise Access Credentials
| Role | Email | Password |
|---|---|---|
| **Super Admin (Project Lead)** | `sanjay@entrykode.com` | `password123` |
| **Admin** | `ishwarya@entrykode.com` | `password123` |
| **Sales Manager** | `karthik@entrykode.com` | `password123` |
| **Support Manager** | `priya@entrykode.com` | `password123` |
