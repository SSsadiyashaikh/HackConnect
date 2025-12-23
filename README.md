# HackConnect - Hackathon Dashboard Application

A full-stack hackathon management platform for students and organizers to discover, join, and manage hackathons.

## Features

### For Students
- **User Authentication**: Sign up and login with role-based access
- **Profile Management**: Add skills, interests, experience, and availability
- **Hackathon Discovery**: Browse all hackathons with advanced filters (domain, location, date, skills)
- **Team Formation**: Create teams, join teams, and get suggestions based on complementary skills
- **Real-time Chat**: Communicate with team members using Socket.io
- **Notifications**: Get reminders for registration deadlines and new events
- **Rating System**: Rate and review other participants

### For Organizers
- **Organizer Dashboard**: Create and manage hackathons
- **Participant Management**: View all registered participants
- **Team Overview**: See all teams and their members
- **Deadline Management**: Set registration deadlines and event dates

### Common Features
- **Responsive Design**: Works on desktop and mobile devices
- **Search & Filter**: Find hackathons by multiple criteria
- **Calendar Integration**: View events and deadlines
- **Clean UI**: Modern, minimalistic design with TailwindCSS

## Tech Stack

### Frontend
- React.js 19
- React Router DOM
- TailwindCSS
- Axios
- Socket.io Client
- React Icons
- date-fns

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.io
- bcryptjs

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hackconnect
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the root directory (HackConnect):
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
HackConnect/
├── backend/
│   ├── models/          # MongoDB models (User, Hackathon, Team, Notification)
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   └── server.js        # Express server setup
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page components
│   ├── context/         # React Context (Auth)
│   ├── utils/           # Utility functions (API client)
│   └── App.jsx          # Main app component with routing
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Hackathons
- `GET /api/hackathons` - Get all hackathons (with filters)
- `GET /api/hackathons/:id` - Get single hackathon
- `POST /api/hackathons` - Create hackathon (Organizer only)
- `PUT /api/hackathons/:id` - Update hackathon (Organizer only)
- `POST /api/hackathons/:id/register` - Register for hackathon
- `DELETE /api/hackathons/:id/register` - Unregister from hackathon

### Teams
- `GET /api/teams/hackathon/:hackathonId` - Get teams for hackathon
- `GET /api/teams/:id` - Get single team
- `POST /api/teams` - Create team
- `POST /api/teams/:id/join` - Join team
- `POST /api/teams/:id/leave` - Leave team
- `POST /api/teams/:id/chat` - Send message in team chat
- `GET /api/teams/suggestions/:hackathonId` - Get team suggestions

### Users
- `GET /api/users/me/profile` - Get current user profile
- `PUT /api/users/me/profile` - Update profile
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/:id/rate` - Rate a user

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Usage

1. **Register/Login**: Create an account as a student or organizer
2. **Complete Profile**: Add your skills, interests, and experience
3. **Browse Hackathons**: Use filters to find hackathons that match your interests
4. **Register**: Register for hackathons you want to participate in
5. **Form Teams**: Create a team or join existing teams
6. **Collaborate**: Use the team chat to communicate with teammates
7. **Stay Updated**: Check notifications for important updates

## Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
npm run dev
```

### Building for Production

Frontend:
```bash
npm run build
```

Backend:
```bash
npm start
```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
