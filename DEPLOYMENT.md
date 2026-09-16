# 🚀 HRMS Deployment Plan & Guide

This document outlines the step-by-step deployment strategy for the Mini HRMS application using a modern, scalable cloud architecture:
- **Database**: MongoDB Atlas 
- **Backend API**: Render (Web Service)
- **Frontend App**: Vercel

---

## 📅 Architecture Overview

```mermaid
flowchart LR
    User([End User]) <--> |HTTPS| Vercel(Vercel Frontend)
    Vercel <--> |REST API| Render(Render Node.js Backend)
    Render <--> |Mongoose Connection| Atlas[(MongoDB Atlas Cluster)]
```

---

## 🛠️ Step 1: Database Setup (MongoDB Atlas)

1. **Create Cluster**:
   - Create an account on [MongoDB Atlas](https://www.mongodb.com/atlas/database) and start a free `M0` Cluster.
   - Set up the initial `Database User` with a strong password. Note these credentials.
   
2. **Network Access**:
   - Go to **Network Access** > **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) so Render can easily connect.

3. **Get Connection URI**:
   - Go to **Database** > **Connect** > **Compass** or **Drivers** (Node.js).
   - Copy your connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/hrms_db?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials.

---

## ⚙️ Step 2: Backend Deployment (Render)

1. **Create Web Service**:
   - Go to [Render.com](https://render.com/) and create a new **Web Service**.
   - Connect your GitHub repository (`HRMS`).
   - Fill out the required build settings:
     - **Root Directory**: `server`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node index.js` (or `npm start`)

2. **Environment Variables**:
   Under the **Environment** tab, click **Add Environment Variable** and add the following:
   
   | Key | Value | Example |
   | :--- | :--- | :--- |
   | `PORT` | `5000` | (Render provides its own port, but setting it provides a fallback) |
   | `MONGODB_URI` | *[Your Atlas Connection String]* | `mongodb+srv://admin:pass@cluster0...` |
   | `JWT_SECRET` | *[A strong random string]* | `y$B&E)H@McQfTjWnZq4t7w!z%C*F-JaN` |
   | `JWT_EXPIRE` | `7d` | `7d` |

3. **Deploy & Seed**:
   - Click **Save & Deploy**. 
   - Once the deployment succeeds, navigate to the deployment logs.
   - Render exposes an active URL like `https://hrms-api.onrender.com`.  
   *(Optional: If you need to seed demo data in production, you can temporarily change the start command to `npm run seed && node index.js` for ONE build, then change it back).*

---

## 🖥️ Step 3: Frontend Deployment (Vercel)

> **Important Note**
> The Vercel frontend relies on a dynamic URL to talk to your new Render backend. We recently updated `client/src/services/api.js` to utilize the `VITE_API_URL` environment variable for exactly this reason.

1. **Create Vercel Project**:
   - Go to [Vercel](https://vercel.com/) and click **Add New Project**.
   - Import your `HRMS` GitHub repository.

2. **Configure Build Settings**:
   - Expand the **Framework Preset**, it should auto-detect **Vite**.
   - Expand **Build and Output Settings** (if necessary):
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Environment Variables**:
   In the **Environment Variables** section, add your Render API endpoint:
   
   | Name | Value |
   | :--- | :--- |
   | `VITE_API_URL` | *[Your Render Backend URL]* (e.g., `https://hrms-api.onrender.com/api`) |
   
   > **Warning**
   > Make sure you add `/api` to the end of the URL, as this matches how endpoints are prefixed on your backend router.

4. **Deploy**:
   - Click **Deploy**. Vercel will install dependencies and build the Vite React application.
   - Once completed, visit the generated domain (e.g., `https://hrms-app.vercel.app`).

---

## ✅ Deployment Sanity Check

Upon full deployment, open your Vercel URL and check these things:
- Can you reach the **Login Page**?
- Does clicking Login using `hr@apptrait.com` successfully navigate to the dashboard? *(If it gives a CORS/Network Error, verify your Render Backend is awake and the `VITE_API_URL` variable was set correctly during build time).*
- Are the statistics loading correctly on the Dashboard? *(Verifies Database Atlas connection is working in production).*
