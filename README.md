# 🛍️ POS System with Shopify Integration

A complete, mobile-first **Point of Sale (POS) system** built with **React (Next.js)**, **Node.js/Express**, and **MongoDB**, featuring full **Shopify API integration** for multi-store inventory management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Demo Credentials](#-demo-credentials)
- [Shopify Integration](#-shopify-integration)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## ✨ Features

### Core Features
- ✅ **Role-Based Access Control** (Admin & Cashier)
- ✅ **Multi-Store Management**
- ✅ **Real-Time Inventory Tracking**
- ✅ **Shopify API Integration** (Product sync, inventory updates)
- ✅ **Mobile-First POS Interface**
- ✅ **Item-Level Discounts**
- ✅ **Automatic Tax Calculation** (Frame: 5% IGST, Sunglass: 18% IGST)
- ✅ **Customer Management**
- ✅ **Invoice Generation (PDF)**
- ✅ **Sales Analytics & Reports**
- ✅ **Multiple Payment Methods** (Cash, UPI, Card, Other)

### Admin Features
- 📊 Dashboard with sales analytics
- 🏪 Store management (add, edit, delete stores)
- 👥 User management (add, edit, assign users to stores)
- 📈 Sales reports with filters
- 📥 Download invoices
- 🔄 Sync products from Shopify

### Cashier Features
- 🛒 Quick product search and filtering
- 📦 Real-time inventory visibility
- 💰 Cart management with discounts
- 👤 Customer information collection
- 🧾 Instant invoice generation
- 📱 Mobile-optimized interface

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **PDFKit** - Invoice generation
- **Axios** - Shopify API integration

### Frontend
- **Next.js 14** - React framework
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Axios** - API client

---

## 📁 Project Structure

```
new-location-pos/
├── backend/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── productController.js  # Product management
│   │   ├── saleController.js     # Sales logic
│   │   └── storeController.js    # Store management
│   ├── middleware/
│   │   └── auth.js               # JWT & role-based auth
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Store.js              # Store schema
│   │   ├── Product.js            # Product schema
│   │   ├── Customer.js           # Customer schema
│   │   └── Sale.js               # Sale schema
│   ├── routes/
│   │   ├── auth.js               # Auth routes
│   │   ├── products.js           # Product routes
│   │   ├── sales.js              # Sales routes
│   │   └── stores.js             # Store routes
│   ├── scripts/
│   │   └── seedData.js           # Database seeding
│   ├── utils/
│   │   ├── invoice.js            # PDF invoice generator
│   │   └── shopify.js            # Shopify API service
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   └── server.js                 # Entry point
│
├── frontend/
│   ├── components/
│   │   ├── CartItem.js           # Cart item component
│   │   ├── CustomerModal.js      # Customer info modal
│   │   ├── Layout.js             # Page layout wrapper
│   │   └── ProductCard.js        # Product card component
│   ├── contexts/
│   │   └── AuthContext.js        # Authentication context
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── index.js          # Admin dashboard
│   │   │   ├── stores.js         # Store management
│   │   │   ├── users.js          # User management
│   │   │   └── sales.js          # Sales reports
│   │   ├── _app.js               # App wrapper
│   │   ├── index.js              # Landing page
│   │   ├── login.js              # Login page
│   │   └── pos.js                # POS interface
│   ├── styles/
│   │   └── globals.css           # Global styles
│   ├── utils/
│   │   └── api.js                # API client
│   ├── .env.local.example        # Frontend env template
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**
- **Shopify Store** (with API credentials)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd new-location-pos
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

2. Edit `.env` with your credentials:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos-system
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development

# Shopify API Credentials
SHOPIFY_ACCESS_TOKEN=shpat_your_access_token
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2024-01
```

### Frontend Configuration

1. Create environment file:

```bash
cd frontend
cp .env.local.example .env.local
```

2. Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### 1. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
```

### 2. Seed the Database (Optional but Recommended)

```bash
cd backend
npm run seed
```

This creates:
- 3 demo stores
- 1 admin user
- 3 cashier users
- 10 sample products with inventory

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

Server will run on: **http://localhost:5000**

### 4. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## 🔑 Demo Credentials

After running the seed script, use these credentials:

### Admin Account
- **Email:** `admin@pos.com`
- **Password:** `admin123`
- **Access:** Full system access

### Cashier Accounts
- **Email:** `john@pos.com` (Downtown Store)
- **Email:** `sarah@pos.com` (Mall Store)
- **Email:** `mike@pos.com` (Airport Store)
- **Password:** `cashier123`
- **Access:** Store-specific access only

---

## 📚 API Documentation

Base URL: `http://localhost:5000/api`

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@pos.com",
  "password": "admin123"
}

Response: {
  "token": "jwt_token",
  "user": { ... }
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer {token}
```

#### Register User (Admin Only)
```http
POST /auth/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "cashier",
  "assignedStore": "store_id"
}
```

### Store Endpoints

#### Get All Stores
```http
GET /stores
Authorization: Bearer {token}
```

#### Create Store (Admin Only)
```http
POST /stores
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Store",
  "location": "Downtown",
  "phone": "+1234567890",
  "email": "store@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

#### Get Store Inventory
```http
GET /stores/{storeId}/inventory
Authorization: Bearer {token}
```

### Product Endpoints

#### Get All Products
```http
GET /products?category=frame&search=classic
Authorization: Bearer {token}
```

#### Sync from Shopify (Admin Only)
```http
POST /products/sync/shopify
Authorization: Bearer {token}
```

### Sale Endpoints

#### Create Sale
```http
POST /sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeId": "store_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "discount": 100
    }
  ],
  "customerInfo": {
    "name": "Customer Name",
    "phone": "+1234567890",
    "email": "customer@example.com",
    "gstNumber": "22AAAAA0000A1Z5"
  },
  "paymentMethod": "cash"
}
```

#### Get Sales
```http
GET /sales?storeId=store_id&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

#### Download Invoice
```http
GET /sales/{saleId}/invoice
Authorization: Bearer {token}
```

#### Get Sales Statistics
```http
GET /sales/stats?storeId=store_id
Authorization: Bearer {token}
```

---

## 👥 User Roles

### Admin
- ✅ View all stores and their inventories
- ✅ Add, edit, and delete stores
- ✅ Add, edit, and delete users
- ✅ Assign users to specific stores
- ✅ View all sales from all stores
- ✅ Download any invoice
- ✅ Sync products from Shopify
- ✅ View analytics and reports

### Cashier
- ✅ View only assigned store's inventory
- ✅ Create sales for assigned store
- ✅ Apply item-level discounts
- ✅ Collect customer information
- ✅ Generate invoices
- ❌ Cannot access other stores
- ❌ Cannot manage users
- ❌ Cannot modify store settings

---

## 🔗 Shopify Integration

### Setup Instructions

1. **Create a Shopify App:**
   - Go to your Shopify Admin → Apps → Develop apps
   - Create a new app
   - Enable Admin API access

2. **Configure API Permissions:**
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
   - `read_orders`
   - `write_orders`

3. **Get API Credentials:**
   - Copy the Access Token
   - Copy your store domain (e.g., `your-store.myshopify.com`)

4. **Update Backend .env:**
   ```env
   SHOPIFY_ACCESS_TOKEN=your_access_token
   SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
   ```

### Sync Products

As an admin, go to the admin dashboard and use the Shopify sync feature to import products. The system will:
- Create new products from Shopify
- Update existing products
- Map categories based on product types/tags
- Set appropriate tax rates

---

## 🧪 Testing Flow

1. **Login as Admin** (`admin@pos.com`)
2. **Create/View Stores** in Admin → Stores
3. **Create Users** in Admin → Users (assign to stores)
4. **Sync Products** from Shopify (optional)
5. **Logout and Login as Cashier** (`john@pos.com`)
6. **Make a Sale:**
   - Search for products
   - Add to cart
   - Apply discounts
   - Select payment method
   - Enter customer details
   - Complete checkout
7. **Download Invoice**
8. **View Sales** as admin

---

## 📱 Mobile Optimization

- Responsive design optimized for mobile screens
- Touch-friendly buttons and inputs
- Font sizes: 14-16px for readability
- Smooth transitions and modals
- No zoom on input focus (iOS)

---

## 🎨 UI/UX Design

- **Clean & Minimal:** White background, light theme
- **Card-Based Layout:** Easy-to-scan information
- **Color-Coded Status:** Green (in stock), Yellow (low stock), Red (out of stock)
- **Real-Time Updates:** Cart and inventory sync instantly
- **Smooth Animations:** Professional transitions
- **Icons:** Lucide React for consistent iconography

---

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Protected API endpoints
- Input validation
- Secure environment variables

---

## 📦 Production Deployment

### Backend

```bash
cd backend
npm start
```

**Environment Variables:**
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Use MongoDB Atlas for database

### Frontend

```bash
cd frontend
npm run build
npm start
```

**Deployment Platforms:**
- Vercel (recommended for Next.js)
- Netlify
- AWS / DigitalOcean

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
brew services list  # macOS
sudo systemctl status mongod  # Linux

# Restart MongoDB
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod  # Linux
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in backend/.env
PORT=5001
```

### Shopify API Errors
- Verify access token is correct
- Check API permissions are enabled
- Ensure shop domain is correct (include `.myshopify.com`)

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ for modern retail businesses.

---

## 🙏 Acknowledgments

- Shopify API Documentation
- Next.js Documentation
- MongoDB Documentation
- Tailwind CSS
- Lucide Icons

---

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Happy Selling! 🎉**

