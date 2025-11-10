# 🚀 Quick Start Guide

Get the POS system running in 5 minutes!

## Prerequisites
- Node.js (v16+)
- MongoDB installed and running
- npm or yarn

## Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 2: Configure Environment

### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos-system
JWT_SECRET=my_super_secret_key_12345
NODE_ENV=development

# Your Shopify credentials (optional for testing)
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token_here
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2024-01
```

### Frontend (.env.local)
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Step 3: Seed Database

```bash
cd backend
npm run seed
```

This creates demo stores, users, and products.

## Step 4: Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:5000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:3000

## Step 5: Login

Open http://localhost:3000 in your browser.

**Admin Login:**
- Email: `admin@pos.com`
- Password: `admin123`

**Cashier Login:**
- Email: `john@pos.com`
- Password: `cashier123`

## 🎉 You're Ready!

### As Admin:
- Go to `/admin` to manage stores, users, and view sales
- Sync products from Shopify

### As Cashier:
- Go to `/pos` to make sales
- Search products, add to cart, apply discounts
- Complete checkout and generate invoices

---

## Common Issues

### MongoDB Not Running?
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port Already in Use?
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Need Help?
Check the main README.md for detailed documentation.

---

**Happy Selling! 🛍️**

