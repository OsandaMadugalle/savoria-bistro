# Deployment Guide for Savoria Bistro

This guide covers deploying the Savoria Bistro application with:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

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

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `savoria-backend`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A strong random string (32+ characters) |
   | `CLIENT_URL` | Your Vercel URL (add after deploying frontend) |
   | `STRIPE_SECRET_KEY` | Your Stripe secret key |
   | `CLOUDINARY_CLOUD_NAME` | (Optional) Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | (Optional) Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | (Optional) Cloudinary API secret |
   | `EMAIL_HOST` | (Optional) SMTP host |
   | `EMAIL_PORT` | (Optional) SMTP port |
   | `EMAIL_USER` | (Optional) SMTP user |
   | `EMAIL_PASS` | (Optional) SMTP password |

6. Click **Create Web Service**
7. Wait for deployment and note your URL: `https://your-app.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-render-backend.onrender.com/api` |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
   | `VITE_GEMINI_API_KEY` | (Optional) Google Gemini API key for AI Chef |

6. Click **Deploy**
7. Note your URL: `https://your-app.vercel.app`

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

### Backend not responding
- Check Render logs for errors
- Verify MongoDB connection string is correct
- Ensure all required environment variables are set

### CORS errors
- Verify `CLIENT_URL` in Render matches your Vercel URL exactly
- Include the protocol (https://)

### Stripe payments not working
- Verify both Stripe keys are correct (secret on backend, publishable on frontend)
- Check Stripe dashboard for webhook errors

### Images not uploading
- Verify Cloudinary credentials are correct
- Check Cloudinary dashboard for usage limits

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
