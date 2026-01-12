# API Documentation

This project includes comprehensive OpenAPI 3.0.3 documentation for all API endpoints.

## Accessing the Documentation

### Interactive Swagger UI
- **URL**: `/api-docs` (or click "API Documentation" in the sidebar - Admin only)
- **Features**:
  - Browse all API endpoints
  - View request/response schemas
  - Test API calls directly from the browser
  - Filter endpoints by tags
  - Download OpenAPI spec

### OpenAPI Specification File
- **Location**: `/public/openapi.yaml`
- **URL**: `/openapi.yaml`
- **Format**: OpenAPI 3.0.3 (YAML)

## API Categories

The API is organized into the following categories:

### 🔐 Auth
- `POST /api/auth/login` - User authentication

### 📦 Stock Management
- `POST /api/stock/add` - Add stock
- `POST /api/stock/remove` - Remove stock
- `POST /api/stock/reserve` - Reserve stock for clients
- `GET /api/stock/reserved` - Get reserved stock list
- `POST /api/stock/reserved/{id}/release` - Release reservation
- `POST /api/stock/reserved/{id}/checkout` - Checkout/deliver reservation
- `POST /api/stock/in` - Add stock via barcode (legacy)
- `POST /api/stock/out` - Remove stock via barcode (legacy)

### 📊 Inventory
- `GET /api/inventory` - Get inventory list
- `GET /api/inventory/grouped` - Get grouped inventory (by type → shade → entries)
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/inventory/marble-types` - Get marble types with shades
- `GET /api/inventory/details` - Get detailed stock entries
- `GET /api/inventory/barcode` - Lookup marble by barcode

### 🏷️ Barcode
- `GET /api/barcodes` - Get all barcodes

### 🪨 Marbles
- `POST /api/marbles/create` - Create new marble type

### 📝 Transactions
- `GET /api/transactions` - Get transaction history with filters

### 👥 Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `PATCH /api/users/{id}` - Update user status
- `GET /api/users/profile` - Get current user profile
- `POST /api/users/change-password` - Change password

### 🔔 Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications` - Update notification(s)

### 📈 Reports
- `GET /api/reports/monthly` - Get monthly usage report

### 💾 Backup
- `GET /api/backup/export` - Export backup
- `POST /api/backup/restore` - Restore backup

## Using the API

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

### Authentication
Currently, the API uses session-based authentication. Include credentials in requests as needed.

### Request Format
All POST/PUT/PATCH requests should use `Content-Type: application/json`.

### Response Format
All responses are JSON with the following structure:
```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:
```json
{
  "error": "Error message here"
}
```

## Example Requests

### Add Stock
```bash
POST /api/stock/add
Content-Type: application/json

{
  "marbleType": "Travertine",
  "color": "AA",
  "quantity": 125.5,
  "slabSizeLength": 4,
  "slabSizeWidth": 4,
  "numberOfSlabs": 6,
  "notes": "New shipment"
}
```

### Get Inventory
```bash
GET /api/inventory?search=Travertine&sortBy=updatedAt&sortOrder=desc
```

### Get Transactions
```bash
GET /api/transactions?type=IN&marbleType=Travertine&page=1&limit=20
```

## Updating the Documentation

To update the OpenAPI spec:

1. Edit `/public/openapi.yaml`
2. Follow OpenAPI 3.0.3 specification
3. Ensure all endpoints are documented
4. Include request/response schemas
5. Add examples where helpful

The Swagger UI will automatically reflect changes after refreshing the page.

## Integration with External Tools

The OpenAPI spec can be imported into:
- Postman
- Insomnia
- API clients (generated from spec)
- API testing tools
- Documentation generators

## Notes

- All endpoints return JSON
- Pagination is available on list endpoints (page, limit parameters)
- Search/filtering is supported on most list endpoints
- Error responses include descriptive messages
- Admin-only endpoints are marked in the spec
