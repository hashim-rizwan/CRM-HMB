# Database Migration Guide

## Important: Breaking Schema Change

The database schema has been restructured. The `Marble` table now stores one entry per marble type with all shades in a single row, instead of one entry per shade.

## Current Situation

You have **1 existing row** in the `Marble` table that needs to be handled before applying the migration.

## Options

### Option 1: Start Fresh (Recommended if you have test data)

If you're okay with losing the existing data:

1. **Clear the existing data:**
   ```sql
   TRUNCATE TABLE "Marble" CASCADE;
   ```

2. **Then run the migration:**
   ```bash
   npx prisma migrate dev --name restructure_marble_model
   ```

### Option 2: Migrate Existing Data

If you need to preserve the existing data, you'll need to manually migrate it:

1. **First, check what data you have:**
   ```sql
   SELECT * FROM "Marble";
   ```

2. **Create a migration script** that:
   - Groups entries by `marbleType`
   - For each shade (stored in `color` field), sets the corresponding shade flag
   - Moves `costPrice`/`salePrice` to the appropriate shade columns
   - Moves `barcode` to the appropriate shade barcode column

3. **Then run the Prisma migration**

### Option 3: Export and Re-import

1. **Export existing data:**
   ```bash
   npx prisma db execute --stdin < export_data.sql
   ```

2. **Clear and migrate:**
   ```bash
   npx prisma migrate dev --name restructure_marble_model
   ```

3. **Re-import data in new format**

## Recommended Approach

Since you only have **1 row** of data, I recommend **Option 1** (start fresh) unless that data is critical.

## After Migration

Once the migration is complete, you'll need to:
1. Update all API endpoints that query the `Marble` table
2. Update the inventory dashboard to work with the new structure
3. Update the "Add Stock" functionality to create `StockEntry` records instead of updating `Marble.quantity`

## Next Steps

1. Decide which option to use
2. If Option 1: Run `TRUNCATE TABLE "Marble" CASCADE;` in your database
3. Then run: `npx prisma migrate dev --name restructure_marble_model`
4. Answer 'y' when prompted
