# Quick Setup Guide

## Prerequisites
- Node.js (v16+) installed
- MongoDB running locally or MongoDB Atlas account

## Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hackconnect
JWT_SECRET=your_super_secret_jwt_key_change_this
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

## Step 2: Frontend Setup

```bash
cd ..  # Go back to HackConnect root
npm install
```

Create `HackConnect/.env` (optional):
```
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

## Step 3: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## First Steps

1. Register a new account (as Student or Organizer)
2. Complete your profile with skills and interests
3. If you're an Organizer, create a hackathon
4. If you're a Student, browse and register for hackathons
5. Form or join teams
6. Start collaborating!

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod` or use MongoDB Atlas
- Check your MONGODB_URI in backend/.env

### Port Already in Use
- Change PORT in backend/.env
- Update VITE_API_URL in frontend .env accordingly

### CORS Errors
- Make sure backend is running before frontend
- Check that API URL matches in frontend .env


