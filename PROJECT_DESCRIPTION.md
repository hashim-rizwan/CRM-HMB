# HMB CRM - Marble Inventory Management System

## Project Overview

**HMB CRM** (Haqeeq Marbles CRM) is a comprehensive cross-platform inventory management system designed specifically for a marble factory. The system manages marble stock, tracks transactions, handles reservations, generates reports, and provides barcode management capabilities. It's built as both a web application and a desktop application using Electron.

## Technology Stack

### Frontend
- **Next.js 14** (React 18) - Web framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Data visualization for reports
- **jsbarcode** - Barcode generation
- **jspdf & html2canvas** - PDF generation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database access layer
- **PostgreSQL** - Primary database (supports cloud databases like Supabase, Neon, Railway, Vercel Postgres)
- **SQLite** - Alternative local database option

### Desktop Application
- **Electron 30** - Desktop app wrapper
- **electron-builder** - Packaging and distribution

### Development Tools
- **Prisma Migrate** - Database migrations
- **Swagger UI** - API documentation interface
- **OpenAPI 3.0.3** - API specification format

## Architecture

### Application Structure

```
CRM-HMB/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Authentication
│   │   ├── stock/                # Stock management
│   │   ├── inventory/            # Inventory queries
│   │   ├── transactions/        # Transaction history
│   │   ├── users/                # User management
│   │   ├── notifications/        # Notifications
│   │   ├── reports/               # Reports
│   │   ├── backup/               # Backup/restore
│   │   ├── barcodes/             # Barcode management
│   │   └── marbles/              # Marble type management
│   ├── components/               # React components
│   │   ├── InventoryDashboard.tsx
│   │   ├── ManageStock.tsx
│   │   ├── ReservedStock.tsx
│   │   ├── TransactionHistory.tsx
│   │   ├── MonthlyReport.tsx
│   │   ├── BarcodeManagement.tsx
│   │   ├── UserManagement.tsx
│   │   ├── Notifications.tsx
│   │   ├── Settings.tsx
│   │   ├── Login.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── add-stock/                # Add stock page
│   ├── remove-stock/             # Remove stock page
│   ├── api-docs/                 # API documentation page
│   ├── page.tsx                  # Main application entry
│   └── layout.tsx                # Root layout
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Prisma client instance
│   ├── api.ts                    # API client functions
│   └── slabMatching.ts           # Slab allocation algorithm
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Database seeding
├── electron/                     # Electron configuration
│   ├── main.js                   # Electron main process
│   └── preload.js                # Preload script
└── public/                       # Static assets
    └── openapi.yaml              # OpenAPI specification
```

## Core Features

### 1. Inventory Management
- **Marble Types**: Manage different marble types (e.g., Travertine, Granite, etc.)
- **Shades**: Each marble type supports 4 shades: AA, A, B, B-
- **Stock Entries**: Track individual stock entries with:
  - Quantity (square feet)
  - Slab dimensions (length × width)
  - Number of slabs
  - Notes
- **Real-time Status**: Automatic status updates (In Stock, Low Stock, Out of Stock)

### 2. Stock Operations
- **Add Stock**: Create new stock entries with slab details
- **Remove Stock**: Intelligent slab allocation algorithm that:
  - Finds exact matches first
  - Cuts larger slabs to fulfill smaller requests
  - Minimizes waste
  - Tracks remnants
- **Reserve Stock**: Reserve stock for clients with:
  - Client information (name, phone, email)
  - Reservation details
  - Status tracking (Reserved, Released, Cancelled)
  - Checkout/delivery functionality

### 3. Intelligent Slab Allocation Algorithm

The system includes a sophisticated slab matching algorithm (`lib/slabMatching.ts`) that:

- **Prioritizes Exact Matches**: Uses slabs that match requested dimensions exactly
- **Calculates Optimal Cuts**: Determines how many requested pieces can be cut from larger slabs
- **Minimizes Waste**: Chooses allocations that generate less waste
- **Handles Multiple Orientations**: Considers both lengthwise and widthwise cutting
- **FIFO Processing**: Uses First-In-First-Out order for stock entries
- **Remnant Management**: Creates new stock entries for usable remnants

**Example**: Requesting 3 slabs of 2ft × 2ft from available 4ft × 4ft slabs:
- Can cut 4 pieces (2×2) from each 4×4 slab
- Uses 1 slab, leaving 1 unused piece as remnant
- Tracks waste and remaining inventory

### 4. Transaction History
- Tracks all stock movements (IN/OUT)
- Filters by:
  - Transaction type
  - Marble type
  - Date range
  - User
- Pagination support
- Detailed notes and reasons

### 5. User Management
- **Roles**: Admin and Staff
- **Admin Features**: Full access including user management
- **Staff Features**: Limited access (cannot manage users)
- **User Profiles**: Name, email, phone, department, join date
- **Status Management**: Active/Disabled users
- **Password Management**: Change password functionality

### 6. Barcode Management
- Generate barcodes for each marble shade
- Unique barcodes per shade
- Barcode lookup functionality
- Integration with stock operations

### 7. Notifications System
- Low stock alerts
- Stock added/removed notifications
- General info notifications
- Read/unread status
- Real-time updates

### 8. Reporting
- **Monthly Usage Reports**: Track usage by marble type and shade
- **Inventory Statistics**: Total quantities, stock levels
- **Visual Charts**: Using Recharts library
- **Export Capabilities**: PDF generation

### 9. Backup & Restore
- Export entire database to JSON
- Restore from backup file
- Data migration support

### 10. API Documentation
- Interactive Swagger UI at `/api-docs`
- OpenAPI 3.0.3 specification
- Test API endpoints directly from browser
- Admin-only access

## Database Schema

### Models

#### Marble
- One entry per marble type (e.g., "Travertine")
- Contains shade activation flags (shadeAA, shadeA, shadeB, shadeBMinus)
- Cost prices and sale prices for each shade
- Barcodes for each shade
- Status and notes
- Relations: StockEntry[], StockTransaction[], ReservedStock[]

#### StockEntry
- Individual stock entries created when stock is added
- Links to Marble via marbleId
- Stores: shade, quantity (sq ft), slab dimensions, number of slabs, notes
- Timestamps: createdAt, updatedAt

#### StockTransaction
- Records all stock movements (IN/OUT)
- Links to Marble
- Stores: type, quantity, reason, requestedBy, notes, createdAt

#### ReservedStock
- Client reservations
- Links to Marble
- Stores: client info, quantity, slab dimensions, status, timestamps
- Status: Reserved, Released, Cancelled

#### User
- Authentication and authorization
- Stores: username, password (hashed), fullName, email, phone, role, status, department
- Timestamps: joinedDate, lastActive, createdAt

#### Notification
- System notifications
- Stores: type, message, read status, createdAt

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Stock Management
- `POST /api/stock/add` - Add stock
- `POST /api/stock/remove` - Remove stock
- `POST /api/stock/reserve` - Reserve stock
- `GET /api/stock/reserved` - Get reserved stock list
- `POST /api/stock/reserved/{id}/release` - Release reservation
- `POST /api/stock/reserved/{id}/checkout` - Checkout reservation

### Inventory
- `GET /api/inventory` - Get inventory list
- `GET /api/inventory/grouped` - Get grouped inventory (by type → shade → entries)
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/inventory/marble-types` - Get marble types with shades
- `GET /api/inventory/details` - Get detailed stock entries
- `GET /api/inventory/barcode` - Lookup marble by barcode

### Transactions
- `GET /api/transactions` - Get transaction history with filters

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `PATCH /api/users/{id}` - Update user status
- `GET /api/users/profile` - Get current user profile
- `POST /api/users/change-password` - Change password

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications` - Update notification(s)

### Reports
- `GET /api/reports/monthly` - Get monthly usage report

### Backup
- `GET /api/backup/export` - Export backup
- `POST /api/backup/restore` - Restore backup

### Barcodes
- `GET /api/barcodes` - Get all barcodes

### Marbles
- `POST /api/marbles/create` - Create new marble type

## Key Business Logic

### Slab Allocation Flow

1. **Request Validation**: Validates marble type, shade, dimensions, quantity
2. **Find Marble**: Locates marble record and verifies shade is active
3. **Fetch Stock Entries**: Gets all StockEntry records for the marble/shade
4. **Convert to AvailableSlab Format**: Prepares data for allocation algorithm
5. **Run Allocation Algorithm**: Uses `allocateSlabs()` from `lib/slabMatching.ts`
6. **Update Stock Entries**: Updates or deletes StockEntry records based on allocation
7. **Create Transaction**: Records the transaction in StockTransaction
8. **Update Marble Status**: Updates overall marble status
9. **Create Notifications**: Generates low stock alerts if needed

### Stock Entry Management

- When stock is added: Creates new StockEntry records
- When stock is removed: Updates StockEntry quantities or deletes entries
- When stock is reserved: Same as removal, but creates ReservedStock record
- Remnants: Creates new StockEntry records for usable remnants (>1 sq ft)

## Deployment Options

### Cloud Database Setup
The system supports multiple cloud database providers:
- **Supabase** (Recommended) - Free tier: 500 MB, 2 GB/month bandwidth
- **Neon** - Free tier: 3 GB, unlimited bandwidth
- **Vercel Postgres** - Free tier: 256 MB, 60 GB/month bandwidth
- **Railway** - Free tier: 1 GB, $5 credit/month

### Web Deployment
- **Vercel** (Recommended for Next.js)
- Any Node.js hosting platform

### Desktop Application
- **Windows**: NSIS installer
- **macOS**: DMG package
- Built using electron-builder

## Development Workflow

### Setup
1. Install dependencies: `npm install`
2. Set up database (cloud or local)
3. Run migrations: `npx prisma migrate dev`
4. Seed database (optional): `npx prisma db seed`

### Development
- Web: `npm run dev` (runs on http://localhost:3000)
- Desktop: `npm run electron:dev` (runs Next.js + Electron)

### Build
- Web: `npm run build`
- Desktop: `npm run electron:build`

## Authentication & Authorization

- **Session-based authentication** (stored in localStorage for client-side)
- **Role-based access control**:
  - Admin: Full access to all features
  - Staff: Limited access (no user management, no API docs)
- **Password hashing**: Passwords are hashed before storage
- **Session management**: Username and user data stored in localStorage

## UI/UX Features

- **Dark Mode**: Toggle dark/light theme
- **Responsive Design**: Works on desktop and tablet
- **Search Functionality**: Search inventory by marble type
- **Real-time Updates**: Inventory updates reflect immediately
- **Notifications Badge**: Shows unread notification count
- **Sidebar Navigation**: Easy navigation between features
- **User Profile**: Access user profile and settings

## Key Files Reference

- `app/page.tsx` - Main application component with routing
- `lib/slabMatching.ts` - Core slab allocation algorithm
- `lib/prisma.ts` - Prisma client singleton
- `lib/api.ts` - API client functions
- `prisma/schema.prisma` - Database schema definition
- `app/components/InventoryDashboard.tsx` - Main inventory view
- `app/components/ManageStock.tsx` - Stock add/remove interface
- `app/components/ReservedStock.tsx` - Reservation management
- `electron/main.js` - Electron main process
- `public/openapi.yaml` - API specification

## Documentation Files

- `README.md` - Basic setup instructions
- `API_DOCUMENTATION.md` - API usage guide
- `CLOUD_DATABASE_SETUP.md` - Cloud database setup guide
- `SLAB_ALLOCATION_LOGIC.md` - Detailed slab allocation explanation
- `MIGRATION_GUIDE.md` - Database migration instructions
- `TROUBLESHOOTING.md` - Common issues and solutions
- `PRE_DEPLOYMENT_CHECKLIST.md` - Deployment checklist

## Current State

- ✅ Full inventory management system
- ✅ Intelligent slab allocation
- ✅ User management with roles
- ✅ Transaction tracking
- ✅ Reservation system
- ✅ Barcode management
- ✅ Reporting and analytics
- ✅ Backup/restore functionality
- ✅ API documentation
- ✅ Desktop application support
- ✅ Cloud database support
- ✅ Dark mode UI

## Technology Decisions

1. **Next.js App Router**: Modern React framework with built-in API routes
2. **Prisma ORM**: Type-safe database access with migrations
3. **PostgreSQL**: Robust relational database with cloud support
4. **Electron**: Cross-platform desktop application
5. **Tailwind CSS**: Rapid UI development
6. **TypeScript**: Type safety and better developer experience

## Future Enhancements (Potential)

- Advanced cutting pattern visualization
- Remnant optimization algorithms
- Multi-orientation cutting support
- Visual cutting plans
- Enhanced waste minimization
- Mobile app support
- Advanced analytics and forecasting
- Integration with accounting systems
- Multi-language support

---

This system is designed for a marble factory to manage inventory, track stock movements, handle client reservations, and generate reports. The intelligent slab allocation algorithm is a key differentiator, allowing the system to efficiently manage stock by cutting larger slabs to fulfill smaller requests while minimizing waste.
