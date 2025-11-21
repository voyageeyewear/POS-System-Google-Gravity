# 🎨 Frontend Deployment Guide

Your backend is working! Now you need to deploy the frontend (Next.js app) so users can access the POS system.

## 🎯 Quick Option: Deploy Frontend on Railway (Easiest)

### Step 1: Add Frontend as a New Service in Railway

1. Go to your Railway project: **perpetual-youth / production**
2. Click **"+ New"** button (top right)
3. Select **"GitHub Repo"**
4. Select the same repository: `voyageeyewear/POS-System-Google-Gravity`
5. Railway will detect it as a new service

### Step 2: Configure the Frontend Service

1. **Set Root Directory:**
   - Go to Settings → Source
   - Set **Root Directory** to: `frontend`

2. **Configure Build Settings:**
   - Go to Settings → Build
   - Railway should auto-detect Next.js
   - Build Command: `npm install && npm run build`
   - Output Directory: `.next` (Next.js default)

3. **Configure Start Command:**
   - Go to Settings → Deploy
   - Start Command: `npm start`

4. **Add Environment Variable:**
   - Go to **Variables** tab
   - Click **"+ New Variable"**
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://pos-system-google-gravity-production.up.railway.app/api`
   - **Important:** This connects frontend to your backend

5. **Set Port (if needed):**
   - Go to Settings → Networking
   - Railway will auto-assign a port (usually 3000)
   - Next.js will use Railway's PORT env var automatically

### Step 3: Deploy

Railway will automatically build and deploy. Wait for it to complete.

### Step 4: Access Your POS System

Once deployed, Railway will give you a URL like:
- `https://pos-system-google-gravity-frontend-production.up.railway.app`

Visit this URL to access your POS system!

---

## 🚀 Alternative: Deploy on Vercel (Recommended for Next.js)

Vercel is optimized for Next.js and provides better performance.

### Step 1: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import repository: `voyageeyewear/POS-System-Google-Gravity`
5. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

### Step 2: Add Environment Variable

1. In Vercel project settings, go to **Environment Variables**
2. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://pos-system-google-gravity-production.up.railway.app/api`
3. Save and redeploy

### Step 3: Deploy

Click **Deploy** and wait for it to complete.

### Step 4: Access Your POS System

Vercel will give you a URL like:
- `https://pos-system-google-gravity.vercel.app`

---

## ✅ After Deployment

### Test Your Application

1. Visit your frontend URL
2. You should see the login page
3. Login with:
   - **Email:** `admin@pos.com`
   - **Password:** `admin123`

### If Login Doesn't Work

1. Check browser console (F12) for errors
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Make sure backend is accessible at the URL you configured
4. Check CORS settings (should be fine, backend has CORS enabled)

---

## 🔧 Troubleshooting

### Frontend Shows "Cannot connect to API"

- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify backend URL is correct: `https://pos-system-google-gravity-production.up.railway.app/api`
- Test backend directly: Visit `https://pos-system-google-gravity-production.up.railway.app/api/health`

### Build Fails

- Check Railway/Vercel build logs
- Ensure all dependencies are in `package.json`
- Try running `npm install` and `npm run build` locally first

### CORS Errors

- Backend already has CORS enabled
- If still seeing errors, check backend logs
- Verify frontend URL is allowed in backend CORS config

---

## 📝 Summary

**Backend:** ✅ Deployed and working at `https://pos-system-google-gravity-production.up.railway.app`

**Frontend:** ⏳ Needs deployment (follow steps above)

Once frontend is deployed, your complete POS system will be accessible!

