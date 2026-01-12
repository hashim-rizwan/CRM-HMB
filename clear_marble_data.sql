-- Clear existing Marble data before migration
-- Run this in your database before applying the Prisma migration

-- This will delete all existing Marble entries and related data
-- Only run this if you're okay with losing the existing data

TRUNCATE TABLE "Marble" CASCADE;
