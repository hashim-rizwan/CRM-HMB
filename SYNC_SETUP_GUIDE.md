# Database Sync Setup Guide - Cloud Database (Option 1)

## Overview
This guide will help you migrate from local SQLite to a cloud PostgreSQL database (Supabase) so your data syncs across all devices.

## Step 1: Create Supabase Account (Free)

1. Go to https://supabase.com
2. Sign up for a free account
3. Create a new project
4. Wait for the project to be set up (takes 1-2 minutes)

## Step 2: Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your database password (set during project creation)

## Step 3: Update Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add your database connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Important**: 
- Replace `[YOUR-PASSWORD]` with your actual database password
- Replace `[PROJECT-REF]` with your Supabase project reference
- The `?pgbouncer=true&connection_limit=1` part is important for Supabase

## Step 4: Update Prisma Schema

The schema has been updated to use PostgreSQL. Run:

```bash
npx prisma migrate dev --name migrate_to_postgresql
```

This will:
- Create the tables in your cloud database
- Migrate your existing data (if you have any)

## Step 5: Migrate Existing Data (If You Have Any)

If you have existing data in your local SQLite database:

1. Export your data using the backup feature in Settings
2. After migration, restore it using the restore feature

OR use Prisma Studio to manually copy data:

```bash
# Open local database
npx prisma studio --schema=./prisma/schema.sqlite.prisma

# Open cloud database
npx prisma studio
```

## Step 6: Test the Connection

1. Start your application: `npm run dev`
2. Try logging in or adding stock
3. Check your Supabase dashboard → **Table Editor** to see your data

## Step 7: Deploy to All Devices

Once set up, all devices using the same `.env` file (or environment variables) will connect to the same cloud database, automatically syncing data.

## Alternative: Using Environment Variables in Production

For production/Electron apps, you can:
1. Store the connection string securely
2. Or use Supabase's connection pooling for better performance

## Troubleshooting

### Connection Issues
- Make sure your IP is allowed in Supabase (Settings → Database → Connection Pooling)
- Check that your password doesn't contain special characters that need URL encoding
- Verify the connection string format

### Migration Issues
- If migration fails, check the Prisma error messages
- Make sure your Supabase project is fully set up
- Verify your connection string is correct

## Free Tier Limits (Supabase)

- **Database Size**: 500 MB
- **Bandwidth**: 2 GB/month
- **API Requests**: Unlimited
- **File Storage**: 1 GB
- **Projects**: Unlimited

For most small to medium businesses, this is sufficient. You can upgrade later if needed.

## Security Notes

1. **Never commit your `.env` file** to version control
2. Keep your database password secure
3. Use Supabase's Row Level Security (RLS) for additional security if needed
4. Consider using connection pooling for production

## Next Steps

After setup:
- All devices will automatically sync when connected to the internet
- Changes on one device appear on all other devices
- No manual sync needed!



