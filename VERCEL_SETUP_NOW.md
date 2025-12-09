# ✅ YOUR PRODUCTION URLs - Setup Vercel NOW

## 🎯 Your Production URLs

- **Frontend (Vercel):** `https://savoria-bistro.vercel.app`
- **Backend API (Render):** `https://savoria-bistro-backend.onrender.com/api`
- **Backend Health Check:** `https://savoria-bistro-backend.onrender.com/health`

---

## ⚡ Complete Vercel Setup (3 Steps - 5 Minutes)

### **STEP 1: Add Environment Variables to Vercel**

1. Open: https://vercel.com/dashboard
2. Click your **savoria-bistro** project
3. Go to **Settings** tab (top)
4. Click **Environment Variables** (left sidebar)
5. **Add Variable #1:**
   - Name: `VITE_API_URL`
   - Value: `https://savoria-bistro-backend.onrender.com/api`
   - Environments: ☑ Production ☑ Preview ☑ Development
   - Click **Save**

6. **Add Variable #2:**
   - Name: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: `YOUR_STRIPE_PUBLISHABLE_KEY` (starts with `pk_`)
   - Environments: ☑ Production ☑ Preview ☑ Development
   - Click **Save**

7. **Add Variable #3 (Optional):**
   - Name: `VITE_GEMINI_API_KEY`
   - Value: Your Gemini API key
   - Environments: ☑ Production ☑ Preview ☑ Development
   - Click **Save**

---

### **STEP 2: Redeploy Frontend (CRITICAL!)**

1. Still in Vercel, go to **Deployments** tab
2. Find the **latest deployment** (top of list)
3. Click the **⋯ (three dots)** menu on the right side
4. Click **Redeploy**
5. Click **Redeploy** button in the dialog to confirm
6. **WAIT 2-3 MINUTES** ⏳

Status will show:
- 🟡 "Building..." (wait here)
- ✅ "Ready" (done!)

---

### **STEP 3: Verify It Works**

1. Visit: https://savoria-bistro.vercel.app
2. Press **F12** to open DevTools
3. Go to **Network** tab
4. Press **Ctrl+Shift+R** to hard refresh
5. Look for API requests:
   - ✅ Should see: `https://savoria-bistro-backend.onrender.com/api/menu`
   - ❌ Should NOT see: `localhost:5000`
6. Menu should load on the page ✅

---

## 📋 Quick Checklist

- [ ] Opened Vercel dashboard
- [ ] Went to savoria-bistro project Settings
- [ ] Added `VITE_API_URL` with value: `https://savoria-bistro-backend.onrender.com/api`
- [ ] All 3 environment checkboxes selected
- [ ] Clicked Save
- [ ] Added Stripe key (if you have it)
- [ ] Went to Deployments tab
- [ ] Clicked Redeploy on latest deployment
- [ ] Waited 2-3 minutes for build
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Network tab shows backend requests (not localhost)
- [ ] Menu data loads ✅

---

## 🧪 Test Backend Health

Before fully testing, verify backend is running:
- Visit: `https://savoria-bistro-backend.onrender.com/health`
- Should return: `{"status":"ok"}`
- If error: Backend needs attention

---

## 🆘 If Still Using localhost

After redeploying, if you still see `localhost:5000` in Network tab:

1. **Clear browser cache completely:**
   - Press Ctrl+Shift+Delete
   - Clear "All time"
   - Close and reopen browser

2. **Try incognito/private mode:**
   - Ctrl+Shift+N (new incognito window)
   - Visit your Vercel URL
   - Check Network tab

3. **Check Vercel deployment logs:**
   - Vercel → Your project → Deployments
   - Click latest deployment
   - Scroll to **"Function Logs"** or **"Build Logs"**
   - Look for environment variables being loaded

---

## 🎯 Success = You See This

In browser Network tab:
```
✅ GET https://savoria-bistro-backend.onrender.com/api/menu → 200 OK
✅ Menu data loads on page
✅ No errors in console about localhost:5000
```

---

**Do this NOW and let me know when Vercel shows "Ready" status!** 🚀
