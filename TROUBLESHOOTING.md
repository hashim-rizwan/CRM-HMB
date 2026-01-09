# Troubleshooting "Failed to fetch" Error

## Issue
You're seeing a "Failed to fetch" error when trying to use the API endpoints.

## Solution Steps

### 1. Restart the Development Server

The Prisma Client was regenerated after the migration, so you need to restart your Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it:
npm run dev
```

### 2. Verify the Server is Running

Make sure the dev server is running on `http://localhost:3000`. You should see:
- Next.js startup messages in the terminal
- The application accessible in your browser

### 3. Check Browser Console

Open your browser's developer console (F12) and check:
- Network tab: See if API requests are being made
- Console tab: Look for any JavaScript errors

### 4. Verify API Routes

Test if the API is accessible by visiting:
- `http://localhost:3000/api/inventory` (should return JSON)
- `http://localhost:3000/api/inventory/stats` (should return JSON)

### 5. TypeScript Errors (Non-blocking)

The TypeScript errors you see are due to cached types. They won't prevent the app from running. To fix:

1. **Restart TypeScript Server in VS Code:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "TypeScript: Restart TS Server"
   - Press Enter

2. **Or restart your IDE completely**

### 6. Clear Next.js Cache (if needed)

If issues persist, try clearing the Next.js cache:

```bash
# Delete .next folder
rm -rf .next
# Or on Windows:
rmdir /s .next

# Then restart dev server
npm run dev
```

## Common Causes

1. **Dev server not running** - Most common cause
2. **Port conflict** - Another app using port 3000
3. **Cached Prisma Client** - Server needs restart after migration
4. **Database locked** - SQLite database might be locked by another process

## Testing the API

Once the server is running, you can test the API directly:

```bash
# Test inventory endpoint
curl http://localhost:3000/api/inventory

# Test stats endpoint  
curl http://localhost:3000/api/inventory/stats
```

Or use your browser to visit these URLs directly.

