# Marble Inventory System

Cross-platform desktop inventory management system for a marble factory.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize database:
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

