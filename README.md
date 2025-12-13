# 🍽️ Savoria Bistro - Full-Stack Restaurant Management System

A comprehensive, production-ready restaurant management platform featuring AI-powered concierge services, real-time order tracking, multi-role user management, delivery system, and advanced admin analytics. Built with modern web technologies and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Authentication & Authorization](#authentication--authorization)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Savoria Bistro** is a full-stack restaurant management system designed to provide a seamless dining experience for customers while offering powerful administrative tools for restaurant management. The platform supports multiple user roles, real-time order tracking, AI-powered menu recommendations, loyalty programs, and comprehensive analytics.

---

## 🖼️ UI Screenshots

| Home | Menu | Admin Dashboard | Delivery Dashboard | Rider Dashboard | Reservation | Profile | Gallery | Contact | Sign In/Up |
|------|------|----------------|-------------------|----------------|-------------|---------|---------|---------|------------|
| ![Home](client/screenshots/Home.png) | ![Menu](client/screenshots/Menu.png) | ![Admin Dashboard 1](client/screenshots/Admin%20Dashboard%201.png) | ![Delivery Dashboard 1](client/screenshots/Delivery%20Dashboard%201.png) | ![Rider Dashboard 1](client/screenshots/Rider%20Dashboard%201.png) | ![Reservation](client/screenshots/Reservation.png) | ![Profile - Orders](client/screenshots/Profile%20-%20Orders.png) | ![Gallery](client/screenshots/Gallery.png) | ![Contact](client/screenshots/Contact.png) | ![Sign In](client/screenshots/Sign%20In.png) |

Additional screenshots are available in the screenshots folder.

---

### Key Highlights

- **Multi-Role System**: Supports customers, staff, admins, master admins, delivery riders, and delivery managers
- **AI Integration**: Google Gemini-powered AI chef for personalized recommendations
- **Real-Time Features**: Live order tracking with status updates and delivery management
- **Payment Processing**: Secure Stripe integration for online payments
- **Comprehensive Admin Dashboard**: Analytics, stock management, user management, and reporting
- **Email Verification**: Secure email verification system with OTP codes
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS

---

## 🚀 Key Features

### Customer Features

- **🔐 User Authentication**
  - Secure signup/login with email verification
  - Password reset functionality
  - JWT-based authentication with refresh tokens
  - Role-based access control

- **🍽️ Menu & Ordering**
  - Browse menu with categories (Starter, Main, Dessert, Drink)
  - Advanced filtering (dietary restrictions, price range, tags)
  - Search functionality
  - Add items to cart with quantity management
  - Real-time stock availability checking
  - Secure checkout with Stripe payment integration

- **📦 Order Management**
  - Real-time order tracking with status updates
  - Order history with detailed information
  - Multiple payment methods (Card, Cash on Delivery)
  - Order status notifications

- **📅 Reservations**
  - Table booking system with date/time selection
  - Availability checking
  - Reservation confirmation with unique codes
  - View and manage reservations
  - Deposit payment integration

- **⭐ Loyalty Program**
  - Points accumulation system
  - Tier system (Bronze, Silver, Gold)
  - Points redemption
  - Order history tracking

- **🤖 AI Concierge (Chef Gustav)**
  - Chat-based menu recommendations
  - Wine pairing suggestions
  - Dietary restriction assistance
  - Powered by Google Gemini API

- **📸 Gallery & Reviews**
  - Visual gallery of restaurant ambiance
  - Customer reviews and ratings
  - Social proof display

### Admin Features

- **📊 Dashboard & Analytics**
  - Revenue analytics with charts (Line, Bar, Area, Pie)
  - Order statistics and trends
  - User management metrics
  - Sales reports with CSV export
  - Real-time data visualization using Recharts

- **👥 User Management**
  - Create and manage admins
  - Staff management
  - Customer management
  - Role assignment and permissions
  - Activity logging

- **🍴 Menu Management**
  - Add, edit, delete menu items
  - Image upload with Cloudinary integration
  - Stock management
  - Category management
  - Featured items selection

- **📦 Order Management**
  - View all orders
  - Update order status
  - Order filtering and search
  - Order analytics

- **📅 Reservation Management**
  - View all reservations
  - Manage reservation status
  - Availability management

- **📧 Newsletter Management**
  - Subscriber management
  - Campaign creation and sending
  - Newsletter statistics

- **🎨 Gallery Management**
  - Upload and manage gallery images
  - Image organization

- **⭐ Review Management**
  - Moderate reviews
  - Approve/reject reviews
  - Review analytics

- **🎁 Promo Management**
  - Create and manage promotional codes
  - Discount management
  - Promo analytics

- **📊 Stock Management**
  - Low stock alerts
  - Stock updates with reason tracking
  - Stock statistics
  - Automated alerts system

- **📝 Feedback Analytics**
  - Customer feedback collection
  - Feedback analytics and insights
  - Sentiment analysis

- **🚚 Delivery Management**
  - Rider assignment
  - Delivery tracking
  - Rider management
  - Delivery analytics

### Staff Features

- **📋 Order Processing**
  - View assigned orders
  - Update order status
  - Kitchen workflow management

- **📊 Limited Analytics**
  - View order statistics
  - Performance metrics

### Delivery Features

- **🚴 Rider Dashboard**
  - View assigned deliveries
  - Update delivery status
  - Upload delivery proof
  - Delivery notes

- **📱 Delivery Manager Dashboard**
  - Assign riders to orders
  - Track all deliveries
  - Manage riders
  - Delivery analytics

---

## 🛠️ Tech Stack

### Frontend

- **React 18.2** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **React Router DOM 6.22** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Chart library for analytics
- **React DatePicker** - Date selection component
- **Stripe React** - Payment processing
- **Axios** - HTTP client
- **Google Gemini API** - AI integration

### Backend

- **Node.js** - JavaScript runtime
- **Express.js 4.18** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 7.6** - MongoDB ODM
- **JWT (jsonwebtoken)** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Stripe** - Payment processing
- **Cloudinary** - Image storage and management
- **Express Rate Limit** - API rate limiting
- **CORS** - Cross-origin resource sharing

### Development Tools

- **TypeScript** - Type checking
- **Nodemon** - Development server auto-reload
- **Dotenv** - Environment variable management

---

## 🏗️ Project Architecture

### Frontend Architecture

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx       # Navigation with auth modals
│   │   ├── AIChef.tsx       # AI concierge component
│   │   ├── AdminNavigation.tsx
│   │   ├── StockManagement.tsx
│   │   ├── FeedbackAnalytics.tsx
│   │   └── ...              # Form components
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── MenuPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   ├── RiderDashboard.tsx
│   │   └── ...
│   ├── services/            # API service layer
│   │   ├── api.ts          # Main API functions
│   │   ├── deliveryApi.ts
│   │   ├── geminiService.ts
│   │   └── ...
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main app component
│   └── main.tsx           # Entry point
```

### Backend Architecture

```
server/
├── models/                 # MongoDB schemas
│   ├── User.js
│   ├── Admin.js
│   ├── Staff.js
│   ├── MenuItem.js
│   ├── Order.js
│   └── ...
├── routes/                 # API route handlers
│   ├── auth.js            # Authentication routes
│   ├── menu.js            # Menu CRUD operations
│   ├── orders.js          # Order management
│   ├── reservations.js   # Reservation system
│   ├── payments.js        # Stripe integration
│   ├── delivery.js        # Delivery management
│   └── ...
├── utils/                  # Utility functions
│   └── emailService.js    # Email sending service
├── server.js               # Express app setup
└── package.json
```

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js** (v16+ recommended)
- **MongoDB** (Local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/savoria-bistro.git
cd savoria-bistro
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/savoria
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/savoria

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production


# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...


# Email Configuration (for Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@savoria.com

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Client URL (for CORS and email links)
CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

The server will start on `http://localhost:5000` and automatically seed the database with initial menu data if empty.

### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Google Gemini API (for AI Chef)
VITE_GEMINI_API_KEY=your-google-gemini-api-key

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Start the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

**Frontend:**
```bash
cd client
npm run build
```

**Backend:**
```bash
cd server
npm start
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/verify-email` | Verify email with OTP | No |
| POST | `/api/auth/resend-verification` | Resend verification code | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | Yes |

### Menu Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/menu` | Get all menu items | No |
| GET | `/api/menu/:id` | Get single menu item | No |
| POST | `/api/menu` | Create menu item | Admin |
| PUT | `/api/menu/:id` | Update menu item | Admin |
| DELETE | `/api/menu/:id` | Delete menu item | Admin |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders` | Get all orders | Admin/Staff |
| GET | `/api/orders/:orderId` | Get order details | Yes |
| POST | `/api/orders` | Create new order | Customer |
| PUT | `/api/orders/:orderId` | Update order status | Admin/Staff |
| GET | `/api/orders/user/:userId` | Get user orders | Customer |

### Reservation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reservations` | Get all reservations | Admin |
| POST | `/api/reservations` | Create reservation | Customer |
| GET | `/api/reservations/user/:email` | Get user reservations | Customer |
| GET | `/api/reservations/check-availability/:date/:time` | Check availability | No |
| PUT | `/api/reservations/:id` | Update reservation | Admin |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/create-intent` | Create payment intent | Customer |
| POST | `/api/payments/confirm` | Confirm payment | Customer |

### Delivery Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/delivery/riders` | Get all riders | Admin/DeliveryManager |
| POST | `/api/delivery/riders` | Create rider | Admin |
| PUT | `/api/delivery/assign/:orderId` | Assign rider to order | Admin/DeliveryManager |
| PUT | `/api/delivery/update-status/:orderId` | Update delivery status | Rider |

### Other Endpoints

- **Reviews**: `/api/reviews` - CRUD operations for reviews
- **Gallery**: `/api/gallery` - Image management
- **Newsletter**: `/api/newsletter` - Subscriber management
- **Stock**: `/api/stock` - Stock management and alerts
- **Feedback**: `/api/feedback` - Customer feedback
- **Promos**: `/api/promos` - Promotional code management
- **Settings**: `/api/settings` - Application settings

---

## 🗄️ Database Models

### User Model
- Customer information (name, email, phone, address)
- Loyalty points and tier
- Order history
- Email verification status
- Password reset tokens

### Admin Model
- Admin credentials
- Role (admin/masterAdmin)
- Permissions
- Activity logs

### Staff Model
- Staff credentials
- Role and permissions
- Department assignment

### MenuItem Model
- Item details (name, description, price)
- Category and tags
- Images (Cloudinary)
- Stock information
- Dietary information

### Order Model
- Order items and quantities
- Total amount
- Status tracking
- Payment information
- Delivery information
- Customer information

### Reservation Model
- Customer details
- Date and time
- Number of guests
- Status and confirmation code
- Payment information

### Other Models
- **Review** - Customer reviews and ratings
- **Gallery** - Restaurant images
- **Newsletter** - Subscriber management
- **StockAlert** - Stock monitoring
- **OrderFeedback** - Customer feedback
- **Promo** - Promotional codes
- **DeliveryRider** - Rider information
- **ActivityLog** - System activity tracking

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **User Registration**
   - User signs up with email, password, and personal details
   - Email verification code sent via Nodemailer
   - User verifies email with 6-digit OTP code
   - Account activated

2. **Login**
   - User provides email and password
   - Server validates credentials
   - JWT access token (1 hour) and refresh token (7 days) generated
   - Tokens stored in browser storage

3. **Token Refresh**
   - Access token expires after 1 hour
   - Refresh token used to get new access token
   - Refresh token expires after 7 days

### Authorization Roles

| Role | Permissions |
|------|-------------|
| **customer** | View menu, place orders, make reservations, view own orders |
| **staff** | View orders, update order status, limited analytics |
| **admin** | Full menu/order/reservation management, user management, analytics |
| **masterAdmin** | All admin permissions + admin user management |
| **rider** | View assigned deliveries, update delivery status |
| **deliveryManager** | Assign riders, manage deliveries, rider management |

### Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: API rate limiting for auth endpoints
- **CORS**: Configured CORS for allowed origins
- **Email Verification**: Required for customer accounts
- **Password Reset**: Secure token-based password reset
- **Role-Based Access Control**: Middleware for route protection

---

## 🚀 Deployment

### Backend Deployment (Render/Vercel)

1. Push code to GitHub
2. Connect repository to Render/Vercel
3. Set environment variables in dashboard
4. Deploy

### Frontend Deployment (Vercel)

1. Connect GitHub repository
2. Set build command: `cd client && npm install && npm run build`
3. Set output directory: `client/dist`
4. Configure environment variables
5. Deploy

### Environment Variables Checklist

**Backend:**
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
- `CLOUDINARY_*` variables
- `CLIENT_URL`

**Frontend:**
- `VITE_API_URL`
- `VITE_GEMINI_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

## 📂 Project Structure

```
savoria-bistro/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types.ts        # TypeScript types
│   │   ├── App.tsx         # Main app
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Backend Express application
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── server.js          # Express setup
│   └── package.json
│
└── README.md
```

---

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `EMAIL_HOST` | SMTP server | Yes |
| `EMAIL_USER` | SMTP username | Yes |
| `EMAIL_PASSWORD` | SMTP password | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `CLIENT_URL` | Frontend URL | Yes |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |

---

## 🎨 Key Features in Detail

### AI Concierge (Chef Gustav)
- Powered by Google Gemini API
- Natural language processing for menu queries
- Dietary restriction recommendations
- Wine pairing suggestions
- Personalized menu recommendations

### Real-Time Order Tracking
- Status updates: Confirmed → Preparing → Quality Check → Packing → Packed & Ready → Assigned → Picked Up → Out for Delivery → Delivered
- Live status updates without page refresh
- Delivery proof upload
- Estimated delivery time tracking

### Loyalty Program
- Points earned per order
- Tier progression: Bronze → Silver → Gold
- Points redemption system
- Member benefits display

### Stock Management
- Automated low stock alerts
- Stock update tracking with reasons
- Stock statistics and analytics
- Integration with menu items

### Analytics Dashboard
- Revenue charts (daily, weekly, monthly)
- Order statistics
- User metrics
- Sales reports with CSV export
- Visual data representation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Your Name**
- Portfolio: [https://github.com/OsandaMadugalle/savoria-bistro]
- GitHub: [@OsandaMadugalle]
- LinkedIn: [https://www.linkedin.com/in/osandamadugalle/]
- Email: osandamadugallel@gmail.com

---

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Stripe for payment processing
- Cloudinary for image management
- MongoDB for database services
- All open-source contributors

---

**Built with ❤️ using React, TypeScript, Node.js, Express, and MongoDB**
