# Database Migration Guide

## Step 1: Update Prisma Schema

The Prisma schema has been updated to match the UI requirements. You need to create and run a migration.

## Step 2: Run Database Migration

```bash
# Create a new migration
npx prisma migrate dev --name update_schema

# This will:
# 1. Create a new migration file
# 2. Apply the migration to your database
# 3. Regenerate the Prisma Client
```

## Step 3: Verify Migration

After migration, verify that the database has been updated correctly:

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

## Step 4: Seed Initial Data (Optional)

You may want to create a seed file to populate initial data. Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a default admin user
  await prisma.user.create({
    data: {
      username: 'admin',
      password: 'admin123', // In production, hash this!
      fullName: 'Admin User',
      email: 'admin@marblefactory.com',
      role: 'Admin',
      status: 'Active',
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Then add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

## Important Notes

1. **Password Hashing**: The current implementation stores passwords in plain text. In production, you MUST hash passwords using bcrypt or similar.

2. **Database Location**: The database file is located at `prisma/inventory.db` (SQLite).

3. **Backup**: Before running migrations, backup your existing database if you have important data.

## API Endpoints Created

- `POST /api/stock/add` - Add stock
- `POST /api/stock/remove` - Remove stock
- `GET /api/inventory` - Get all inventory (with optional search query)
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/[id]` - Update user
- `PATCH /api/users/[id]` - Update user status
- `GET /api/notifications` - Get all notifications
- `PATCH /api/notifications` - Update notification read status

