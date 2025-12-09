# 🚀 IMMEDIATE FIX: "Cannot get data from database" Error

Your deployed app is showing this error:
```
GET http://localhost:5000/api/menu net::ERR_CONNECTION_REFUSED
Failed to load menu TypeError: Failed to fetch
```

**This means your frontend is not getting the production API URL.**

---

## ✅ 5-Minute Fix Steps

### Step 1: Commit & Push Updated Configuration ✅
```bash
cd e:\VSProjects\savoria-bistro
git add client/vercel.json DEPLOYMENT.md RENDER_ENV_SETUP.md MONGODB_ATLAS_SETUP.md
git commit -m "Fix: Configure Vercel to pass environment variables to Vite build"
git push origin main
```

### Step 2: Add Environment Variables to Vercel
1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Click your **frontend project** (savoria or similar)
3. Go to **Settings** tab (top navigation)
4. Click **Environment Variables** (left sidebar under "Project")
5. Add these variables (one at a time):

#### Variable 1: API URL
- **Name:** `VITE_API_URL`
- **Value:** `https://your-render-backend.onrender.com/api`
  - Replace `your-render-backend` with your actual Render service name
  - Find it on your Render dashboard URL
- **Environment:** Select all three checkboxes (Production, Preview, Development)
- Click **Save**

#### Variable 2: Stripe Key (if using payments)
- **Name:** `VITE_STRIPE_PUBLISHABLE_KEY`
- **Value:** Your Stripe publishable key (starts with `pk_`)
- **Environment:** Select all three
- Click **Save**

#### Variable 3: Gemini API (optional)
- **Name:** `VITE_GEMINI_API_KEY`
- **Value:** Your Gemini API key
- **Environment:** Select all three
- Click **Save**

### Step 3: CRITICAL - Redeploy Frontend
⚠️ **This is the most important step - many people skip this and it doesn't work!**

1. Go to **Deployments** tab (next to Settings)
2. Find your latest deployment (top of list)
3. Click the **three dots (...)** menu on the right
4. Click **Redeploy**
5. Click **Redeploy** button in the dialog
6. **Wait 2-3 minutes** for deployment to complete

**The page will show building status, wait until it says "Ready"**

### Step 4: Verify the Fix
1. Visit your Vercel deployment: `https://your-app.vercel.app`
2. Open browser Developer Tools: Press **F12**
3. Go to **Network** tab
4. Refresh the page
5. Look for requests - should see:
   - `https://your-render-backend.onrender.com/api/menu` ✅
   - NOT `localhost:5000` ❌
6. Menu should load! 🎉

---

## 🔍 If It Still Doesn't Work

### Check 1: Did you redeploy?
- Go to Vercel Deployments
- Click your latest deployment
- Scroll down to see "Functions" section
- Look for env variables being used
- If old deployment, go back and redeploy again

### Check 2: Check backend is running
- Visit: `https://your-render-backend.onrender.com/health`
- Should return: `{"status":"ok"}`
- If error: Check Render logs for MongoDB connection issues

### Check 3: Verify API URL format
- Should be: `https://your-render-backend.onrender.com/api`
- Check you included `/api` at the end
- No trailing slash

### Check 4: Browser console
- F12 → Console tab
- Look for any error messages
- Try manually: `fetch('https://your-render-backend.onrender.com/api/menu')`

---

## 📋 Where to Find Your URLs

### Render Backend URL
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your backend service
3. At the top, you'll see a URL like: `https://savoria-backend-abc123.onrender.com`
4. Add `/api` at the end for the API URL

### Vercel Frontend URL
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. See "Domains" section: `https://your-app.vercel.app`

---

## ⚡ What Was Wrong (Technical Details)

### Before (Broken)
- `vercel.json` didn't specify build settings
- Environment variables were set in Vercel UI
- But Vite couldn't access them during build time
- So hardcoded fallback `http://localhost:5000` was used
- Result: All requests went to localhost (which doesn't exist in production)

### After (Fixed)
- `vercel.json` now specifies: `buildCommand`, `outputDirectory`, `installCommand`
- Vercel passes environment variables to the build process
- Vite can now access `process.env.VITE_API_URL` at build time
- Frontend uses production API URL
- Result: Requests go to your real backend ✅

---

## ✅ Final Verification Checklist

- [ ] `client/vercel.json` has `buildCommand`, `outputDirectory`, `installCommand`
- [ ] Pushed changes to GitHub
- [ ] Added `VITE_API_URL` to Vercel with your Render backend URL
- [ ] Added other env variables (Stripe, Gemini) if needed
- [ ] All variables set to "All" environments in Vercel
- [ ] Clicked **Redeploy** from Deployments tab (this is critical!)
- [ ] Waited for deployment to show "Ready"
- [ ] Verified browser shows requests to production backend (not localhost)
- [ ] Data now loading successfully ✅

---

## 💡 Key Takeaway

**In Vercel: Always redeploy after changing environment variables!**
- Just clicking Save is not enough
- Environment variables must be present during the build
- Redeploy forces Vite to rebuild with new variables

---

Need help? Check these files:
- **RENDER_ENV_SETUP.md** - All environment variables explained
- **MONGODB_ATLAS_SETUP.md** - Database setup
- **DEPLOYMENT.md** - Full deployment guide
