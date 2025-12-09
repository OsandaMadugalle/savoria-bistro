# 🔴 CRITICAL: Fix "Cannot Get Data from Database" Error

## The Problem
Your deployed frontend is trying to connect to `http://localhost:5000` instead of your production backend. **Environment variables are not being passed to Vercel**.

## ⚡ The Solution (5 minutes)

### Step 1: Push Updated Configuration
```bash
git add client/vercel.json
git commit -m "Fix: Add environment variables to vercel.json"
git push
```

### Step 2: Add Environment Variables to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your **frontend project**
3. Go to **Settings** tab
4. Click **Environment Variables** (left sidebar)
5. Add these 3 variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://your-render-backend.onrender.com/api` | All (Production, Preview, Development) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (`pk_test_...` or `pk_live_...`) | All |
| `VITE_GEMINI_API_KEY` | Your Gemini API key (or leave blank) | All |

**For each variable:**
- Type the **Name** exactly
- Paste the **Value**
- Select **All** for Environment
- Click **Save**

### Step 3: CRITICAL - Redeploy the Frontend
1. Still in Vercel Dashboard, go to **Deployments** tab
2. Find the latest deployment at the top
3. Click the **3-dot menu** → **Redeploy**
4. Click **Redeploy** again to confirm
5. **DO NOT JUST SAVE** - you MUST redeploy after adding env variables

**Wait 2-3 minutes for deployment to complete**

### Step 4: Verify the Fix
1. Visit your frontend: `https://your-app.vercel.app`
2. Open browser Developer Tools (F12)
3. Go to **Network** tab
4. Refresh the page
5. Look for requests to your backend (should be `https://your-render-backend.onrender.com/api/menu`)
6. Should NOT see `localhost:5000` anymore
7. Data should load! ✅

---

## 📋 Complete Environment Variables for Both Services

### Backend (Render)
Go to [Render Dashboard](https://dashboard.render.com) → Your service → **Settings** → **Environment**

```
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/savoria?retryWrites=true&w=majority
NODE_ENV = production
JWT_SECRET = your-32-character-random-secret
CLIENT_URL = https://your-app.vercel.app
STRIPE_SECRET_KEY = sk_test_... or sk_live_...
STRIPE_PUBLIC_KEY = pk_test_... or pk_live_...
CLOUDINARY_CLOUD_NAME = your_cloud_name (if using images)
CLOUDINARY_API_KEY = your_api_key (if using images)
CLOUDINARY_API_SECRET = your_api_secret (if using images)
GOOGLE_GEMINI_API_KEY = your_gemini_key (optional, for AI Chef)
```

### Frontend (Vercel)
Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your project → **Settings** → **Environment Variables**

```
VITE_API_URL = https://your-render-backend.onrender.com/api
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_... or pk_live_...
VITE_GEMINI_API_KEY = your_gemini_key (optional)
```

**⚠️ AFTER ADDING VERCEL VARIABLES: Go to Deployments → Redeploy the latest deployment**

---

## 🐛 If Data Still Not Loading

### Check 1: Verify Backend Health
Visit: `https://your-render-backend.onrender.com/health`
- Should return: `{"status":"ok"}`
- If 502 error: Backend crashed, check Render logs

### Check 2: Check Browser Console
- F12 → Console tab
- Look for error messages
- Should show requests to `https://your-render-backend.onrender.com/api/...`
- If still showing `localhost:5000`: Redeploy Vercel again (Step 3)

### Check 3: Verify API URL
In browser console, run:
```javascript
console.log((import.meta as any).env.VITE_API_URL)
```
- Should print your Render backend URL
- If blank or undefined: Environment variables not loaded, redeploy Vercel

### Check 4: Check Render Backend Logs
1. Render Dashboard → Your backend service
2. Click **Logs** tab
3. Look for: `✅ Connected to MongoDB`
4. If not there: MONGO_URI not set (see Backend variables above)

---

## 🎯 Where to Get Your URLs

### Your Render Backend URL
- Render Dashboard → Your service → URL field at top of page
- Looks like: `https://savoria-backend-abc123.onrender.com`
- API endpoint: Add `/api` → `https://savoria-backend-abc123.onrender.com/api`

### Your Vercel Frontend URL
- Vercel Dashboard → Your project → Domains section
- Looks like: `https://your-app.vercel.app`

---

## ✅ Final Checklist

- [ ] `vercel.json` updated with buildCommand and outputDirectory
- [ ] `VITE_API_URL` added to Vercel (with your Render URL)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` added to Vercel
- [ ] All variables set to **All** environments in Vercel
- [ ] **Redeployed** frontend in Vercel (Deployments → Redeploy)
- [ ] Waited 2-3 minutes for new deployment
- [ ] Verified browser shows requests to production backend (not localhost)
- [ ] Data now loading on deployed app ✅

---

## 💡 Pro Tips

1. **Each time you update Vercel env variables, you MUST redeploy** - just saving is not enough
2. **Check the Deployments tab** - if you see a new deployment building, wait for it to finish
3. **Use browser DevTools Network tab** - best way to debug which URLs are being called
4. **Read Render logs** - if backend not responding, error will be in the logs

Need more help? See **DEPLOYMENT.md** for full guide.
