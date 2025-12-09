# Deployment Guide for Savoria Bistro

This guide covers deploying the Savoria Bistro application with:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

---

## 🔴 CRITICAL: If "Cannot get data from database" error

**Fix in 5 minutes:**
1. Verify `vercel.json` is updated (it is now ✅)
2. Add `VITE_API_URL` to Vercel environment variables
3. **REDEPLOY** frontend in Vercel (not just save)

👉 **See [RENDER_ENV_SETUP.md](./RENDER_ENV_SETUP.md)** for step-by-step fix

---

## 📚 Detailed Setup Guides

For step-by-step help with specific tasks, see:
- **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)** - Complete MongoDB Atlas setup (database connection)
- **[RENDER_ENV_SETUP.md](./RENDER_ENV_SETUP.md)** - All environment variables for Render backend
- **This guide** - Overall deployment flow and troubleshooting

---

## Prerequisites

1. GitHub account with code pushed to a repository
2. MongoDB Atlas account (free tier available)
3. Vercel account (free tier available)
4. Render account (free tier available)
5. Stripe account for payments
6. (Optional) Cloudinary account for image uploads
7. (Optional) Gmail/SMTP for email notifications

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user with password
4. Whitelist all IPs (0.0.0.0/0) for Render access
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/savoria?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render

### 2.1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Select **Deploy existing GitHub repository** (or **Build from Git** if first time)
4. Choose your repository

### 2.2: Configure Web Service

**Basic Settings:**
- **Name**: `savoria-backend`
- **Root Directory**: `server`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or upgrade to Starter $7/month to avoid cold starts)

### 2.3: Add Environment Variables (CRITICAL)

Click **Advanced** and add these environment variables:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `PORT` | (Leave blank - Render sets this) | |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/savoria?retryWrites=true&w=majority` |
| `JWT_SECRET` | Random 32+ character string | `your-super-secret-key-min-32-chars` |
| `CLIENT_URL` | Your Vercel frontend URL | `https://your-app.vercel.app` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | `sk_live_...` |
| `STRIPE_PUBLIC_KEY` | Your Stripe public key | `pk_live_...` |
| `CLOUDINARY_CLOUD_NAME` | (Optional) | |
| `CLOUDINARY_API_KEY` | (Optional) | |
| `CLOUDINARY_API_SECRET` | (Optional) | |
| `EMAIL_HOST` | (Optional) SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | (Optional) SMTP port | `587` |
| `EMAIL_USER` | (Optional) Email address | `your-email@gmail.com` |
| `EMAIL_PASS` | (Optional) App password | |
| `EMAIL_FROM` | (Optional) From address | `Savoria Bistro <your-email@gmail.com>` |

### 2.4: Deploy

1. Click **Create Web Service**
2. Wait for deployment (2-3 minutes)
3. View logs to confirm it's working
4. Note your URL: `https://your-app.onrender.com`

---

## Troubleshooting: No Data from Database

### Issue: "Cannot connect to MongoDB" or no data loads

**Step 1: Check MongoDB Atlas Security**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Network Access** → **IP Whitelist**
3. **Add IP Address** → Allow `0.0.0.0/0` (all IPs)
4. Click **Confirm**

**Step 2: Verify Connection String**
1. In MongoDB Atlas, click **Databases** → **Connect**
2. Select **Drivers** → **Node.js**
3. Copy the connection string
4. Replace `<username>` and `<password>` with actual values
5. Make sure it says `mongodb+srv://` (not `mongodb://`)

**Step 3: Check Render Logs**
1. Go to your Render service dashboard
2. Click **Logs** tab
3. Look for MongoDB connection messages
4. Should see: `✅ Connected to MongoDB`

**If seeing connection errors:**
```
MongoNetworkError: connect ECONNREFUSED
```
→ MongoDB URI is wrong, check credentials

**If seeing timeout errors:**
```
MongoServerSelectionError: connection timed out
```
→ IP whitelist not set, add `0.0.0.0/0` in MongoDB Atlas

**Step 4: Test with Postman/cURL**
```bash
curl https://your-app.onrender.com/api/menu
```

Should return JSON data. If getting error, check logs.

**Step 5: Check CORS Settings**
- Verify `CLIENT_URL` in Render matches your Vercel URL exactly
- Include `https://` prefix
- No trailing slash

### Issue: Data loads locally but not on Render

**Common causes:**
1. ❌ `MONGO_URI` not set in Render
2. ❌ MongoDB Atlas IP whitelist not configured
3. ❌ Connection string has wrong password
4. ❌ Service cold-started and failed silently (check logs)

---

## Step 3: Deploy Frontend to Vercel

### 3.1: Create New Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Select your repository

### 3.2: Configure Project

**Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3: Add Environment Variables

**IMPORTANT: Add AFTER you deploy Render backend**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-render-backend.onrender.com/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (`pk_live_...` or `pk_test_...`) |
| `VITE_GEMINI_API_KEY` | (Optional) Google Gemini API key for AI Chef |

### 3.4: Deploy

1. Click **Deploy**
2. Wait for deployment (1-2 minutes)
3. View logs if there are errors
4. Note your URL: `https://your-app.vercel.app`

---

## Step 4: Update CORS Settings

1. Go back to Render
2. Update the `CLIENT_URL` environment variable with your Vercel URL
3. Redeploy the backend

---

## Step 5: Create Admin Account

After deployment, create your first admin account:

1. Register a regular account through the frontend
2. Connect to MongoDB Atlas using MongoDB Compass or the web interface
3. Find your user in the `users` collection
4. Update the `role` field to `masterAdmin`:
   ```json
   { "role": "masterAdmin" }
   ```

---

## Environment Variables Summary

### Backend (Render)
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLIENT_URL=https://your-app.vercel.app
STRIPE_SECRET_KEY=sk_live_...
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-app.onrender.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GEMINI_API_KEY=your_key (optional)
```

---

## Troubleshooting

### ❌ "Cannot get data from database" / "No data showing"

**Step 1: Check Backend Logs in Render**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your backend service
3. Click **Logs** tab
4. Look for error messages (may need to scroll down)

**Step 2: Verify MongoDB Connection**
1. Check that `MONGO_URI` environment variable is set in Render
   - Go to **Settings** → **Environment** 
   - Verify `MONGO_URI` contains your MongoDB Atlas connection string
2. Connection string should look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/savoria?retryWrites=true&w=majority
   ```

**Step 3: Check MongoDB Atlas IP Whitelist**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Network Access**
3. Should show `0.0.0.0/0` (or check "IP Access List" has entries)
4. If not, click **Add IP Address** → **Allow Access from Anywhere** → **Confirm**

**Step 4: Test Backend Health Endpoint**
- Visit: `https://your-render-service.onrender.com/health`
- Should return: `{"status":"ok"}`
- If 404 or timeout, backend is not running properly

**Step 5: Check Render Deployment Logs**
1. In Render Dashboard, click your service
2. Click **Logs** at bottom of page
3. Should show:
   ```
   ✅ Connected to MongoDB
   🚀 Server running on port 10000
   ```
4. If you see connection errors, check your MONGO_URI

### ❌ Backend not responding / 502 Bad Gateway

**Solution:**
1. Verify backend is deployed on Render (not just GitHub)
2. Check that `render.yaml` is correct in the `server/` directory
3. Wait 2-3 minutes after deploying - Render may still be building
4. Click **Manual Deploy** button in Render dashboard

### ❌ CORS errors (frontend can't reach backend)

**Solution:**
1. Verify `CLIENT_URL` in Render environment variables matches your Vercel URL exactly
   - Should be: `https://your-app.vercel.app` (no trailing slash)
   - Protocol must be `https://` not `http://`
2. Verify `VITE_API_URL` in Vercel environment variables matches your Render backend URL
   - Should be: `https://your-app.onrender.com/api` (with `/api` at end)
3. After changing, redeploy both frontend and backend

### ❌ Stripe payments not working

**Solution:**
1. Verify `STRIPE_SECRET_KEY` is set correctly in Render
   - Should start with `sk_live_` (production) or `sk_test_` (testing)
2. Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set in Vercel
   - Should start with `pk_live_` or `pk_test_` (must match secret key type)
3. Keys must be from same environment (both live or both test)
4. Check Stripe Dashboard for webhook errors

### ❌ Images not uploading / Gallery not showing

**Solution:**
1. Verify Cloudinary credentials in Render:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Get values from [Cloudinary Dashboard](https://cloudinary.com/console)
3. Check usage limits: Cloudinary → **Dashboard** → **Media Library**

---

## Free Tier Limitations

### Render (Free)
- Spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month

### Vercel (Free/Hobby)
- Unlimited deployments
- 100GB bandwidth/month

### MongoDB Atlas (Free)
- 512MB storage
- Shared cluster

---

## Production Recommendations

1. **Use Render paid tier** ($7/month) to avoid cold starts
2. **Enable Stripe webhooks** for reliable payment status updates
3. **Set up monitoring** using Render's built-in metrics
4. **Configure custom domain** for both frontend and backend
5. **Enable rate limiting** (already configured in the code)
