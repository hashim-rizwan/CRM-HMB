-- Migration script to migrate existing Marble data to new structure
-- Run this BEFORE applying the Prisma migration

-- Step 1: Create a backup of existing data
CREATE TABLE IF NOT EXISTS "Marble_backup" AS SELECT * FROM "Marble";

-- Step 2: Migrate existing data to new structure
-- This assumes you have existing data that needs to be migrated
-- If you want to start fresh, you can skip this and just clear the table

-- For each unique marbleType, create a new entry with shade information
-- Note: This is a simplified migration - you may need to adjust based on your data

-- Example migration (adjust based on your actual data):
-- If you have entries like: marbleType='Travertine', color='AA', costPrice=100, salePrice=150
-- This will create: marbleType='Travertine', shadeAA=true, costPriceAA=100, salePriceAA=150

-- Clear existing data if you want a fresh start (UNCOMMENT IF NEEDED):
-- TRUNCATE TABLE "Marble" CASCADE;

-- If you want to preserve and migrate data, you would need to:
-- 1. Group by marbleType
-- 2. For each shade (color), set the corresponding shade flag and prices
-- 3. This is complex and depends on your current data structure

-- For now, if you want to start fresh, just clear the table:
-- TRUNCATE TABLE "Marble" CASCADE;
