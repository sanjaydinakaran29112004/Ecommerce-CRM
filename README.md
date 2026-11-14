# EntryKode E-Commerce CRM Suite — Centralized Management System
**Enterprise Customer Relationship Management Platform for E-Commerce**  
Built with the modern **MERN Stack** (MongoDB, Express.js, React 18, Vite, Node.js).

[![Project Report](https://img.shields.io/badge/Documentation-Master%20Project%20Report-blue?style=for-the-badge)](./PROJECT_REPORT.md)
[![Build Status](https://img.shields.io/badge/Production%20Build-Passing%20(0%20errors)-brightgreen?style=for-the-badge)](./PROJECT_REPORT.md)
[![MERN Stack](https://img.shields.io/badge/Stack-MongoDB%20|%20Express%20|%20React%2018%20|%20Node%20v22-green?style=for-the-badge)](./PROJECT_REPORT.md)

---

## 📑 Comprehensive Project Report (For TL & Reviewers)
> 📄 **Complete Technical & Architectural Project Report:**  
> Please see the master document: **[PROJECT_REPORT.md](./PROJECT_REPORT.md)**  
> *(Also available under [`docs/PROJECT_REPORT.md`](./docs/PROJECT_REPORT.md))*  
> Includes complete architectural schematics, module workflows, security design, database ER schemas, test coverage, and deployment guides.

---

## 👥 Development Team & Ownership
- **Super Admin & Project Lead:** Sanjay D (`sanjay@entrykode.com` / `sanjay@gmail.com`)
- **Frontend Architecture:** React 18, Vite, Tailwind CSS, TanStack Query v5, Recharts, Lucide Icons
- **Backend Architecture:** Node.js v22, Express.js, MongoDB (`ecommerce_crm`), Mongoose ODM, JWT & RBAC
- **Organization:** EntryKode Technologies

---

## 📁 Repository Structure
```
d:\EntryKode\
├── frontend/             # Single-Page React Application (React 18 + Vite + Tailwind)
├── backend/              # Modular Express REST API (Node.js + MongoDB + Mongoose)
├── docs/                 # Shared Architecture, API Contracts & DB Specs
│   ├── api-contracts/    # Canonical JSON request/response formats
│   ├── database-schema/  # MongoDB collection designs
│   └── PROJECT_REPORT.md # Technical documentation copy
├── PROJECT_REPORT.md     # Master Project Report & Technical Blueprint for TL
└── README.md             # Repository entry point
```

---

## 🌟 Key Functional Modules (10/10 Complete)

1. **Executive Dashboard & Real-Time Analytics:** Live KPI summary cards, revenue trend charts, real-time stock alert notifications with dismiss/mark-all-read reactivity, and global fuzzy search.
2. **Customer 360 & Automated Dormancy Rule:** Complete customer lifecycle management with automatic dormancy detection (>1 year inactive transitioned to `INACTIVE`).
3. **Leads & Sales Pipeline Kanban:** Interactive drag-and-drop lead stage progression from New to Won/Lost with conversion metrics.
4. **Product Catalog & Stock Management:** Complete SKU, pricing, category, and real-time stock thresholds with automatic low-stock notifications.
5. **Orders & Fulfillment Pipeline:** Multi-stage order tracking (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`). Delivered orders are permanently locked against modifications. Includes official **Razorpay Gateway Settlement Receipts**.
6. **Returns & Refunds (Reverse Logistics & RMA):** Formal RMA inspection workflow, hardware verification history, instant Razorpay gateway refunds, and clean rejection purge.
7. **Customer Support Tickets & Grievance Threads:** Multi-agent support thread workspace with chronological customer interaction logs and direct RMA initiation.
8. **Targeted Marketing Campaigns:** Cohort marketing with one-click lifecycle status controls (`SCHEDULED` ↔ `ACTIVE` ↔ `PAUSED` ↔ `COMPLETED`).
9. **Team Tasks & Deliverables:** Sub-second reactive checkbox task completion toggles with live status filtering.
10. **Role-Based Access Control (RBAC) & Audit:** Strict 4-tier RBAC (`SUPER_ADMIN`, `ADMIN`, `SALES_MANAGER`, `SUPPORT_MANAGER`) with field-level requirement tooltips for security compliance.

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
