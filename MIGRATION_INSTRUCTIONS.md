# Quick Migration Instructions

## You have 1 existing row in the Marble table

### Option 1: Clear Data and Migrate (Easiest)

1. **Connect to your database** and run:
   ```sql
   TRUNCATE TABLE "Marble" CASCADE;
   ```

2. **Then run the Prisma migration:**
   ```bash
   npx prisma migrate dev --name restructure_marble_model
   ```

3. **Answer 'y' when prompted**

### Option 2: Keep Data (More Complex)

If you need to preserve the existing data, you'll need to:

1. **Export the existing data first:**
   ```sql
   SELECT * FROM "Marble";
   ```

2. **Manually migrate it** to the new structure (one entry per marbleType with shade flags)

3. **Then run the migration**

## Recommended: Option 1

Since you only have 1 row, I recommend clearing it and starting fresh. The new structure is significantly different, so manual migration would be complex.

## After Migration

The migration will:
- ✅ Create the new `Marble` table structure
- ✅ Create the new `StockEntry` table
- ✅ Update all relations

You can then use "Add New Item" to create marble types in the new format.
