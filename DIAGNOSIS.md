# 🔍 Diagnosis: Why is localhost:5000 Still Being Used?

## Quick Diagnosis Checklist

Run these checks to find exactly what's missing:

---

## ✅ Check 1: Have You Set Environment Variables in Vercel?

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your **frontend project**
3. Go to **Settings** tab
4. Click **Environment Variables** (left sidebar)
5. Do you see `VITE_API_URL` listed?
   - ✅ YES → Go to Check 2
   - ❌ NO → **STOP - You need to add it first!** See "Quick Fix" section below

---

## ✅ Check 2: Have You Redeployed After Adding Variables?

1. Go to **Deployments** tab in Vercel
2. Look at your deployments list
3. Are there 2+ recent deployments (meaning you redeployed)?
   - ✅ YES → Go to Check 3
   - ❌ NO → **STOP - You need to redeploy!** See "Quick Fix" section below

---

## ✅ Check 3: Check Current Deployment Status

1. Click your **latest deployment** (top one)
2. Does it say **"Ready"** or still **"Building"**?
   - ✅ "Ready" → Go to Check 4
   - ❌ "Building" or failed → **Wait for it to finish or check logs**

---

## ✅ Check 4: Verify Environment Variables Were Passed to Build

1. In Vercel, go to **Deployments** → Latest deployment
2. Scroll down to **Environment** section
3. Do you see your variables listed (like `VITE_API_URL`)?
   - ✅ YES → Go to Check 5
   - ❌ NO → Variables not passed to build, something's wrong

---

## ✅ Check 5: Clear Browser Cache and Test

1. Hard refresh your Vercel site: **Ctrl+Shift+R** (or Cmd+Shift+R on Mac)
2. Open DevTools: **F12**
3. Go to **Network** tab
4. Refresh again
5. Look for requests to:
   - ✅ Should see: `https://your-render-backend.onrender.com/api/menu`
   - ❌ Still seeing: `localhost:5000/api/menu`

If still seeing localhost, your build is old.

---

## 🚀 Quick Fix (Follow Steps Based on Your Checks)

### If Check 1 FAILED (No VITE_API_URL in Vercel)

**Add it RIGHT NOW:**

1. Vercel Dashboard → Your project → **Settings**
2. **Environment Variables**
3. Click **Add New**
   - **Name**: `VITE_API_URL`
   - **Value**: Get this from Render (see below)
   - **Environment**: Select "Production", "Preview", "Development"
4. Click **Save**

**How to get your Render Backend URL:**
- Go to [Render Dashboard](https://dashboard.render.com)
- Click your **backend service** (savoria-backend or similar)
- Copy the URL at the top (looks like: `https://savoria-backend-xyz.onrender.com`)
- Add `/api` at the end
- **Result**: `https://savoria-backend-xyz.onrender.com/api`

### If Check 2 FAILED (Haven't Redeployed Yet)

**Redeploy RIGHT NOW:**

1. Vercel Dashboard → **Deployments** tab
2. Find your latest deployment (top of list)
3. Click the **three dots (⋯)** menu on the right
4. Click **Redeploy**
5. A dialog appears → Click **Redeploy** again
6. **WAIT 2-3 MINUTES** for build to complete

**Status will show "Building..." then "Ready"**

### If Check 3 FAILED (Still Building or Failed)

- **Still Building?** → Wait 5-10 more minutes
- **Build Failed?** → Click deployment → Click **Logs** tab → See error details

---

## 🎯 If All Checks Pass But Still Using localhost

This is unusual. Try these nuclear options:

### Option 1: Purge Vercel Cache
1. Vercel Dashboard → Your project
2. **Settings** → **General**
3. Scroll down → **Danger Zone**
4. Click **Clear Build Cache**
5. Wait 1 minute
6. Go to **Deployments** → **Redeploy** latest

### Option 2: Redeploy from GitHub
1. Vercel Dashboard → **Deployments**
2. Click **three dots (⋯)** → **Redeploy** (not just "Redeploy")
3. Check the **"Redeploy with Git commit"** option if available
4. Wait for new build

### Option 3: Force Update Vercel Config
Push a new commit with a tiny change:
```bash
cd e:\VSProjects\savoria-bistro
# Make a tiny change (add a comment)
echo "# Force redeploy" >> DEPLOYMENT.md
git add DEPLOYMENT.md
git commit -m "Force Vercel redeploy"
git push origin main
```

Then Vercel will auto-redeploy from GitHub.

---

## 📊 Expected Timeline

1. **Add env vars to Vercel** → 30 seconds
2. **Click Redeploy** → 30 seconds  
3. **Wait for build** → 2-3 minutes
4. **Hard refresh browser** → Instant
5. **Data should load** → Verify in Network tab

**Total time: 5 minutes max**

---

## 🐛 Debugging: How to Confirm Environment Variable Was Applied

Open browser console and run:
```javascript
// In any modern app, Vite stores env vars in import.meta.env
// Try to see if the variable exists:
console.log(import.meta.env)
```

You should see `VITE_API_URL` in the output. If not, the build didn't include it.

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Browser Network tab shows requests to `https://your-render-backend.onrender.com/api/...`
2. ✅ No more `localhost:5000` requests
3. ✅ Menu data appears on page
4. ✅ Console shows no "Failed to fetch" errors for API calls

---

## 🆘 Still Stuck?

Check these files for next steps:
- **FIX_LOCALHOST_ERROR.md** - Detailed step-by-step guide
- **RENDER_ENV_SETUP.md** - Environment variables reference
- **DEPLOYMENT.md** - Full deployment guide

**Key point:** The issue is 100% that either:
1. ❌ Variables not added to Vercel, OR
2. ❌ Not redeployed after adding variables, OR  
3. ❌ Redeploy is still in progress (just wait)

Go back through checks 1-3 carefully and make sure you did each step.
