# Shared API Contracts (Frontend <-> Backend)
**Version:** v1  
**Base URL:** `/api/v1`  
**Envelope Format:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 140,
    "totalPages": 14
  }
}
```

### Authentication Contract:
- `POST /api/v1/auth/login`
  - Request: `{ "email": "user@entrykode.com", "password": "password123" }`
  - Response: `{ "user": { "id", "name", "email", "role", "permissions" }, "accessToken": "jwt_..." }`

### Customer Contract:
- `GET /api/v1/customers`
  - Query Params: `?search=...&type=VIP&page=1&limit=10`
- `POST /api/v1/customers`
  - Request: `{ "firstName", "lastName", "email", "phone", "customerType", "addresses" }`

### Order Contract:
- `GET /api/v1/orders`
  - Query Params: `?status=PROCESSING&page=1&limit=10`
- `PATCH /api/v1/orders/:id/status`
  - Request: `{ "status": "SHIPPED" }`

