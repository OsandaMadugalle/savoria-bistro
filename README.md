# 🍽️ Savoria Bistro - MERN Stack Restaurant App

A premium restaurant application featuring an AI-powered concierge ("Chef Gustav"), real-time order tracking, loyalty rewards, and table reservations. Built with React, Node.js, Express, MongoDB, and the Google Gemini API.

## 🚀 Features

-   **AI Concierge**: Chat with Chef Gustav (powered by Google Gemini) for menu recommendations and wine pairings.
-   **Full Menu & Ordering**: Browse dishes with dietary filters, add to cart, and checkout.
-   **Real-time Order Tracker**: Track your delivery status with live animations.
-   **Reservations**: Book tables with instant confirmation simulation.
-   **Loyalty System**: Earn points, view tier status (Bronze/Silver/Gold), and order history.
-   **Gallery & Reviews**: Visual storytelling and social proof.
-   **Admin/Backend**: REST API handling menu items, orders, users, and reservations.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
1.  **Node.js** (v14 or higher)
2.  **MongoDB** (Local installation or MongoDB Atlas account)

---

## 📦 Installation Guide

### 1. Backend Setup (Server)

The backend handles the API, database connection, and data seeding.

1.  Navigate to the server directory:
    ```bash
    cd server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the `server/` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/savoria
    # Or use your MongoDB Atlas connection string
    ```

4.  Start the server:
    ```bash
    npm run dev
    ```
    *The server will start on port 5000 and automatically seed the database with initial menu data if it's empty.*

### 2. Frontend Setup (Client)

The frontend is a React application powered by Vite, located in the `client` folder.

1.  Navigate to the client directory:
    ```bash
    cd client
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the `client/` directory:
    ```env
    # Your Google Gemini API Key
    API_KEY=your_google_gemini_api_key_here
    
    # URL of your local backend
    API_URL=http://localhost:5000/api
    ```
    *Note: Get your API key from [Google AI Studio](https://aistudio.google.com/).*

4.  Start the frontend:
    ```bash
    npm run dev
    ```

5.  Open your browser and visit `http://localhost:5173`.

---

## 📂 Project Structure

```
.
├── client/           # Frontend React Application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
├── server/           # Backend Express Application
│   ├── models/
│   ├── routes/
│   └── server.js
└── README.md
```

## 🔐 Environment Variables

| Variable | Location | Description |
| :--- | :--- | :--- |
| `API_KEY` | `client/.env` | Google Gemini API Key for the AI Chef. |
| `API_URL` | `client/.env` | Base URL for the backend API (default: `http://localhost:5000/api`). |
| `MONGO_URI` | `server/.env` | Connection string for MongoDB. |
| `PORT` | `server/.env` | Port for the backend server (default: 5000). |

---

Built with ❤️ using React & Google Gemini.# savoria-bistro
