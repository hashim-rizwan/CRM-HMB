# Quick Start: Cloud Database Setup

## Fastest Way to Get Started (Supabase - 5 minutes)

### 1. Create Supabase Database (2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project**
3. Fill in:
   - Name: `haqeeq-marbles-crm`
   - Password: **Save this password!**
   - Region: Choose closest
4. Click **Create new project**

### 2. Get Connection String (1 minute)

1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Click **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

### 3. Set Up Locally (1 minute)

Create a `.env` file in the root directory:

```bash
# Windows
echo DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require" > .env

# Mac/Linux
echo 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require"' > .env
```

**Or manually create `.env` file:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

### 4. Run Migrations (1 minute)

```bash
npx prisma generate
npx prisma migrate dev --name init_cloud_database
```

### 5. Test It!

```bash
npm run dev
```

Login to your app and check Supabase dashboard → **Table Editor** to see your data!

---

## Set Up for Vercel Deployment

### 1. Add Environment Variable in Vercel

1. Go to [vercel.com](https://vercel.com) → Your Project
2. **Settings** → **Environment Variables**
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Supabase connection string
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### 2. Deploy

Push to GitHub and Vercel will automatically deploy with your cloud database!

---

## That's It! 🎉

Now:
- ✅ Your local dev server uses the cloud database
- ✅ Your Vercel deployment uses the same cloud database
- ✅ All data syncs automatically across all systems
- ✅ No manual sync needed!

---

## Need More Details?

See [CLOUD_DATABASE_SETUP.md](./CLOUD_DATABASE_SETUP.md) for:
- Other database providers (Neon, Railway, Vercel Postgres)
- Migrating existing data
- Troubleshooting
- Security best practices
