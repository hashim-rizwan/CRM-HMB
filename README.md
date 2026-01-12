# Marble Inventory System

Cross-platform desktop inventory management system for a marble factory.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up database:

**Option A: Cloud Database (Recommended - Syncs across all devices)**
- See [QUICK_START_CLOUD_DB.md](./QUICK_START_CLOUD_DB.md) for 5-minute setup
- Or see [CLOUD_DATABASE_SETUP.md](./CLOUD_DATABASE_SETUP.md) for detailed guide

**Option B: Local Database**
```bash
npx prisma migrate dev --name init
```

## Development

Run Next.js dev server:
```bash
npm run dev
```

Run with Electron:
```bash
npm run electron:dev
```

## Build

Build Next.js:
```bash
npm run build
```

Build desktop app:
```bash
npm run electron:build
```

