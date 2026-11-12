# E-Commerce CRM — Centralized Management System
**Enterprise Customer Relationship Management Platform for E-Commerce**  
Built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

---

## 👥 Development Team & Ownership
- **Project Lead:** Mugilvannan P (EntryKode)
- **Frontend Lead:** Sanjay D (`/frontend` — React, Vite, Tailwind CSS, Redux Toolkit, TanStack Query, Recharts)
- **Backend Lead:** Ishwarya R (`/backend` — Node.js, Express.js, MongoDB, JWT, RBAC, Socket.IO)

---

## 📁 Repository Structure
```
d:\EntryKode\
├── frontend/             # Single-Page React Application (Sanjay's workspace)
├── backend/              # Modular Express REST API (Ishwarya's workspace)
├── docs/                 # Shared Architecture, API Contracts & DB Specs
│   ├── api-contracts/    # Canonical JSON request/response formats
│   └── database-schema/  # MongoDB collection designs
└── README.md
```

---

## 🚀 Quick Start (Frontend)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note on Mock Engine:**  
> By default, `VITE_USE_MOCK=true` in `.env.development`. The frontend runs with a high-fidelity local database in `localStorage` and simulated 300ms network latency.  
> When connecting to Ishwarya's live backend, change `VITE_USE_MOCK=false`.

---

## 🔑 Demo Access Profiles
| Role | Email | Password |
|---|---|---|
| **Super Admin** | `sanjay@entrykode.com` | `password123` |
| **Admin** | `ishwarya@entrykode.com` | `password123` |
| **Sales Manager** | `karthik@entrykode.com` | `password123` |
| **Support Manager** | `priya@entrykode.com` | `password123` |

