# MongoDB Atlas Setup for Render

## 🎯 Quick Summary
This guide helps you connect MongoDB Atlas to your Render backend. This is **the most critical step** - without it, your app won't fetch any data.

---

## Step 1: Create MongoDB Atlas Account & Cluster

### 1.1: Sign Up
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Sign Up** (or **Sign In** if existing user)
3. Choose **Shared** cluster (free tier - 512MB storage)

### 1.2: Create Organization (if first time)
1. Create a new organization (or use default)
2. Create a project named `savoria-bistro` (optional but recommended)

### 1.3: Create a Cluster
1. Click **Create Deployment**
2. Choose **Shared** (Free)
3. Select region closest to you (or closest to Render)
4. **Cluster Name**: `savoria` (or any name)
5. Click **Create Deployment**
6. Wait 2-3 minutes for cluster to be created

---

## Step 2: Create Database User

### 2.1: Add User
1. In MongoDB Atlas dashboard, click **Database Access** (left sidebar)
2. Click **Add New Database User**
3. **Authentication Method**: Username and Password
4. **Username**: `savoria_admin` (or any username)
5. **Password**: Generate auto-generated (copy this password, you'll need it!)
6. **Database User Privileges**: Select `readWriteAnyDatabase` role
7. Click **Add User**

### 2.2: Copy Your Password
⚠️ **IMPORTANT:** Copy the password NOW - you won't see it again!
Save it somewhere safe for the next steps.

---

## Step 3: Allow Network Access

### 3.1: Whitelist IPs for Render
1. Click **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere**
4. Enter `0.0.0.0/0` (allows all IPs)
5. Click **Confirm**

⚠️ **Note:** This allows any IP to connect. For production, you can restrict to Render's IP ranges later.

---

## Step 4: Get Connection String

### 4.1: Copy Connection String
1. In MongoDB Atlas, click **Database** (left sidebar)
2. Click **Cluster** → **Connect**
3. Choose **Drivers** (not MongoDB Compass)
4. Select **Node.js** and version **4.x or later**
5. Copy the connection string (looks like):
```
mongodb+srv://username:password@cluster.mongodb.net/savoria?retryWrites=true&w=majority
```

### 4.2: Replace Placeholder Values
Your connection string looks like:
```
mongodb+srv://<username>:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

**Replace:**
- `<username>` → Your database username (e.g., `savoria_admin`)
- `<password>` → Your database password (from Step 2.2)

**Result should look like:**
```
mongodb+srv://savoria_admin:MyPassword123!@cluster0.abc123.mongodb.net/savoria?retryWrites=true&w=majority
```

⚠️ **Special characters in password:**
- If your password has special characters like `!@#$%`, they might need URL encoding:
  - `@` → `%40`
  - `!` → `%21`
  - `:` → `%3A`
  - **Best practice:** Generate password without special characters or use online URL encoder

---

## Step 5: Add Connection String to Render

### 5.1: Set MONGO_URI in Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your **backend service**
3. Go to **Settings** tab
4. Scroll to **Environment**
5. Click **Add Environment Variable**
6. **Key**: `MONGO_URI`
7. **Value**: Paste your connection string from Step 4.2
8. Click **Save**

### 5.2: Wait for Redeploy
- Render will automatically redeploy (takes 2-3 minutes)
- Click **Logs** tab to watch deployment progress

### 5.3: Verify Connection
Look for these lines in logs:
```
✅ Connected to MongoDB
🚀 Server running on port 10000
```

---

## Step 6: Seed Sample Data (Optional)

If you want sample data to test with:

### 6.1: Connect with MongoDB Compass (GUI)
1. Download [MongoDB Compass](https://www.mongodb.com/products/tools/compass)
2. Open Compass
3. Click **New Connection**
4. Paste your connection string
5. Click **Connect**
6. Create database: Click **+** → Database name: `savoria`
7. Manually insert sample documents

### 6.2: Or Use MongoDB Shell
```bash
mongosh "mongodb+srv://username:password@cluster.mongodb.net/savoria"
```

Then run:
```javascript
use savoria
db.menus.insertMany([
  { name: "Pasta Carbonara", price: 12.99, category: "Pasta" },
  { name: "Caesar Salad", price: 8.99, category: "Salad" },
  { name: "Tiramisu", price: 6.99, category: "Dessert" }
])
```

---

## 🔍 Troubleshooting

### Issue: "MongoDB connection failed"
**Possible Causes:**
1. ❌ MONGO_URI not set in Render → Set it in Environment variables
2. ❌ Wrong username/password → Verify in MongoDB Atlas
3. ❌ IP not whitelisted → Allow `0.0.0.0/0` in Network Access
4. ❌ Database doesn't exist → Atlas auto-creates on first write

**Solution:**
1. Double-check connection string
2. Verify Network Access includes `0.0.0.0/0`
3. Check Render logs for exact error message

### Issue: "Connection string is invalid"
**Possible Causes:**
1. ❌ Special characters not URL encoded
2. ❌ Missing database name (`/savoria` at end)
3. ❌ Wrong username or password

**Solution:**
1. Use MongoDB Atlas to copy exact connection string
2. Only replace username and password
3. Don't modify the rest of the string

### Issue: "timeout after 30000ms"
**Possible Causes:**
1. ❌ Network Access doesn't include Render IPs
2. ❌ MongoDB Atlas cluster is in different region
3. ❌ Firewall blocking connection

**Solution:**
1. Verify Network Access set to `0.0.0.0/0`
2. Check cluster region (should be close to Render region)
3. Wait 5 minutes after changing Network Access (takes time to propagate)

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created (username + password)
- [ ] Network Access includes `0.0.0.0/0`
- [ ] Connection string copied correctly
- [ ] Special characters in password handled (URL encoded or avoided)
- [ ] MONGO_URI added to Render environment
- [ ] Render redeployed (check logs)
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] /api/menu endpoint returns data

---

## 🎯 Next Steps

Once MongoDB is connected:
1. ✅ Add other environment variables (Stripe, Cloudinary, etc.)
2. ✅ Test API endpoints
3. ✅ Deploy frontend to Vercel
4. ✅ Link frontend to backend in Vercel environment

See **RENDER_ENV_SETUP.md** for complete environment variables setup.
