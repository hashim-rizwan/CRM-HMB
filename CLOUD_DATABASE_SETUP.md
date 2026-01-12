# Cloud Database Setup Guide

This guide will help you set up a cloud PostgreSQL database so your data syncs across all devices and deployments.

## Why Cloud Database?

- ✅ **Data Sync**: All devices and servers share the same data
- ✅ **Backup**: Automatic backups and point-in-time recovery
- ✅ **Scalability**: Easy to scale as your business grows
- ✅ **Accessibility**: Access from anywhere with internet
- ✅ **Reliability**: 99.9%+ uptime SLA

## Option 1: Supabase (Recommended - Free Tier Available)

### Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Fill in:
   - **Project Name**: `haqeeq-marbles-crm` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project" and wait 1-2 minutes

### Step 2: Get Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

**Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Step 3: Set Up Locally

1. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

2. Edit `.env` and add your connection string:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

**Important**: For Supabase, you can also use connection pooling:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
```

### Step 4: Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init_cloud_database
```

This will create all your tables in the cloud database.

### Step 5: Seed Initial Data (Optional)

```bash
npx prisma db seed
```

### Step 6: Verify Connection

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

You should see your tables in the cloud database!

---

## Option 2: Neon (Serverless PostgreSQL - Free Tier)

### Step 1: Create Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Click "Create a project"
4. Choose a project name and region
5. Click "Create project"

### Step 2: Get Connection String

1. In your Neon dashboard, click on your project
2. Go to **Connection Details**
3. Copy the **Connection string** (starts with `postgresql://`)

### Step 3: Set Up

1. Add to `.env`:
```env
DATABASE_URL="postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require"
```

2. Run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init_cloud_database
```

---

## Option 3: Vercel Postgres (If Deploying on Vercel)

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose a name and region
6. Click **Create**

### Step 2: Get Connection String

1. In your Vercel project, go to **Storage** → Your Postgres database
2. Click **.env.local** tab
3. Copy the `POSTGRES_URL` value

### Step 3: Add to Vercel Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Postgres connection string
   - **Environment**: Production, Preview, Development (select all)
3. Click **Save**

### Step 4: Run Migrations

Vercel will automatically run `prisma generate` during build, but you need to run migrations:

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Prisma Migrate Deploy**
```bash
# Set DATABASE_URL in your terminal
export DATABASE_URL="your-vercel-postgres-url"

# Run migrations
npx prisma migrate deploy
```

---

## Option 4: Railway (Simple & Fast)

### Step 1: Create Railway Account

1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **New Project** → **Provision PostgreSQL**
4. Wait for database to be created

### Step 2: Get Connection String

1. Click on your PostgreSQL service
2. Go to **Variables** tab
3. Copy the `DATABASE_URL` value

### Step 3: Set Up

1. Add to `.env`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"
```

2. Run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init_cloud_database
```

---

## Setting Up for Vercel Deployment

### Step 1: Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your cloud database connection string
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Step 2: Update Vercel Build Settings

Vercel should automatically detect Prisma, but verify:

1. Go to **Settings** → **Build & Development Settings**
2. Ensure **Build Command** is: `npm run build` (or `next build`)
3. Ensure **Install Command** is: `npm install`
4. The `postinstall` script in `package.json` will run `prisma generate` automatically

### Step 3: Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Check deployment logs to ensure migrations run successfully

---

## Migrating Existing Data

If you have existing data in a local database:

### Method 1: Using Backup/Restore Feature

1. **Export from local database:**
   - Use the backup feature in your app's Settings
   - Or use Prisma Studio: `npx prisma studio`

2. **Import to cloud database:**
   - After setting up cloud database
   - Use the restore feature in Settings
   - Or manually import via Prisma Studio

### Method 2: Using Prisma Migrate

If you have a local PostgreSQL database:

```bash
# Export data
pg_dump -h localhost -U postgres -d your_database > backup.sql

# Import to cloud (replace with your cloud connection string)
psql "your-cloud-connection-string" < backup.sql
```

### Method 3: Manual Migration via Prisma Studio

1. Open local database:
```bash
npx prisma studio
```

2. Open cloud database in another terminal:
```bash
DATABASE_URL="your-cloud-url" npx prisma studio --port 5556
```

3. Manually copy data between the two Prisma Studio windows

---

## Testing the Connection

### Test Locally

1. Start your dev server:
```bash
npm run dev
```

2. Try logging in or adding stock
3. Check your cloud database dashboard to see the data appear

### Test on Vercel

1. Deploy to Vercel
2. Visit your deployed app
3. Try logging in or adding stock
4. Verify data appears in your cloud database

---

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** - Generate random passwords for your database
3. **Enable SSL** - Always use `?sslmode=require` in connection strings
4. **Use connection pooling** - For production (Supabase provides this)
5. **Rotate passwords regularly** - Update passwords every 3-6 months
6. **Limit IP access** - Some providers allow IP whitelisting

---

## Free Tier Limits Comparison

| Provider | Database Size | Bandwidth | Projects | Best For |
|----------|--------------|-----------|----------|----------|
| **Supabase** | 500 MB | 2 GB/month | Unlimited | Best overall, great docs |
| **Neon** | 3 GB | Unlimited | Unlimited | Serverless, auto-scaling |
| **Vercel Postgres** | 256 MB | 60 GB/month | Per project | If already on Vercel |
| **Railway** | 1 GB | $5 credit/month | Unlimited | Simple setup |

For most small to medium businesses, any of these free tiers are sufficient.

---

## Troubleshooting

### Connection Issues

**Error: Connection timeout**
- Check your internet connection
- Verify the connection string is correct
- Check if your IP needs to be whitelisted (some providers)

**Error: SSL required**
- Add `?sslmode=require` to your connection string
- Example: `postgresql://...?sslmode=require`

**Error: Authentication failed**
- Verify your password is correct
- Check for special characters that need URL encoding
- Try resetting your database password

### Migration Issues

**Error: Migration failed**
- Check Prisma error messages
- Verify your connection string
- Ensure your cloud database is fully set up
- Try running: `npx prisma migrate reset` (⚠️ This deletes all data!)

**Error: Table already exists**
- Your tables might already exist
- Try: `npx prisma migrate resolve --applied [migration-name]`
- Or reset and start fresh: `npx prisma migrate reset`

### Vercel Deployment Issues

**Error: DATABASE_URL not found**
- Verify environment variable is set in Vercel
- Check that it's enabled for the correct environment (Production/Preview)
- Redeploy after adding the variable

**Error: Prisma Client not generated**
- Check build logs in Vercel
- Verify `postinstall` script runs `prisma generate`
- Try adding explicit build command: `prisma generate && next build`

---

## Next Steps

After setup:

1. ✅ All devices will sync automatically when connected to internet
2. ✅ Changes on one device appear on all other devices instantly
3. ✅ Your Vercel deployment uses the same database
4. ✅ No manual sync needed!

## Support

If you encounter issues:
1. Check the provider's documentation
2. Review Prisma migration logs
3. Check Vercel deployment logs
4. Verify your connection string format

---

**Recommended**: Start with **Supabase** - it has the best free tier, excellent documentation, and is easy to set up!
