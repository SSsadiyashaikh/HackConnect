# HackConnect - Hackathon Dashboard Application

A full-stack hackathon management platform for students and organizers to discover, join, and manage hackathons.

---

## Features

### For Students
- **User Authentication**: Sign up and login with role-based access  
- **Profile Management**: Add skills, interests, experience, and availability  
- **Hackathon Discovery**: Browse all hackathons with advanced filters (domain, location, date, skills)  
- **Team Formation**: Create teams, join teams, and get suggestions based on complementary skills  
- **Real-time Chat**: Communicate with team members using Socket.io  
- **Notifications**: Get reminders for registration deadlines and new events
- **Quiz**: Quiz Created by Team Leader For Team Members According to scores of Quiz Team Leader Accept and Reject the Request of Joining members.
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

---

## Tech Stack

| Frontend         | Backend            |
| ---------------- | ------------------ |
| React.js         | Node.js            |
| React Router DOM | Express.js         |
| TailwindCSS      | MongoDB            |
| Axios            | Mongoose           |
| Socket.io Client | JWT Authentication |
| React Icons      | Socket.io          |
| date-fns         | bcryptjs           |

---

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

---

## Project Structure

```text
HackConnect/
├── backend/
│   ├── models/        # MongoDB models (User, Hackathon, Team, Notification)
│   ├── routes/        # API routes
│   ├── middleware/    # Authentication middleware
│   └── server.js      # Express server setup
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/         # Page components
│   ├── context/       # React Context (Auth)
│   ├── utils/         # Utility functions (API client)
│   └── App.jsx        # Main app component with routing
├── package.json
└── README.md
```

---

## API Endpoints

### Authentication

* `POST /api/auth/register` - Register new user
* `POST /api/auth/login` - Login user

### Hackathons

* `GET /api/hackathons` - Get all hackathons (with filters)
* `GET /api/hackathons/:id` - Get single hackathon
* `POST /api/hackathons` - Create hackathon (Organizer only)
* `PUT /api/hackathons/:id` - Update hackathon (Organizer only)
* `POST /api/hackathons/:id/register` - Register for hackathon
* `DELETE /api/hackathons/:id/register` - Unregister from hackathon

### Teams

* `GET /api/teams/hackathon/:hackathonId` - Get teams for hackathon
* `GET /api/teams/:id` - Get single team
* `POST /api/teams` - Create team
* `POST /api/teams/:id/join` - Join team
* `POST /api/teams/:id/leave` - Leave team
* `POST /api/teams/:id/chat` - Send message in team chat
* `GET /api/teams/suggestions/:hackathonId` - Get team suggestions

### Users

* `GET /api/users/me/profile` - Get current user profile
* `PUT /api/users/me/profile` - Update profile
* `GET /api/users/:id` - Get user by ID
* `POST /api/users/:id/rate` - Rate a user

### Notifications

* `GET /api/notifications` - Get user notifications
* `PUT /api/notifications/:id/read` - Mark as read
* `PUT /api/notifications/read-all` - Mark all as read
* `DELETE /api/notifications/:id` - Delete notification

---

## Usage

1. **Register/Login**: Create an account as a student or organizer
2. **Complete Profile**: Add your skills, interests, and experience
3. **Browse Hackathons**: Use filters to find hackathons that match your interests
4. **Register**: Register for hackathons you want to participate in
5. **Form Teams**: Create a team or join existing teams
6. **Collaborate**: Use the team chat to communicate with teammates
7. **Stay Updated**: Check notifications for important updates

---
## 📸 THE WEB PAGES

### 🧾 Landing Page

<img width="1919" height="1011" alt="Screenshot 2025-12-31 223655" src="https://github.com/user-attachments/assets/a2a48eaf-0a54-46e5-a280-20bc5b0336a0" />

### 🧾 Register Page

<img width="1919" height="907" alt="Screenshot 2025-12-31 232010" src="https://github.com/user-attachments/assets/61fd94d7-afd0-4c86-be09-c29ac26f6f2b" />

### 🧾 Sign in Page

<img width="1917" height="911" alt="Screenshot 2025-12-31 231956" src="https://github.com/user-attachments/assets/fee273fb-3c31-4303-baae-1407e41f109e" />

### 📊 Dashboard

<img width="1919" height="910" alt="Screenshot 2025-12-31 232047" src="https://github.com/user-attachments/assets/4f551e2c-19d6-4cb9-bc0e-3ac976f21dae" />

### Notification 

<img width="1919" height="960" alt="Screenshot 2025-12-30 163826" src="https://github.com/user-attachments/assets/5afb8175-0b7f-421e-a5f8-74e1c43ca2cc" />

### Registration Of Hackathon

<img width="1919" height="934" alt="Screenshot 2025-12-30 164907" src="https://github.com/user-attachments/assets/da56cb66-8a03-4f97-8569-fa1e930aa81b" />

### Teams Page

<img width="1919" height="952" alt="Screenshot 2025-12-30 164932" src="https://github.com/user-attachments/assets/65a84cfc-3f71-4bec-bc9a-e6a520bc2ac1" />

### Some features of Team for Students

| Operation                  | Description                                   | Screenshot                                                                                           |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Create Team**            | Create a new team                             | ![Create Team](https://github.com/user-attachments/assets/fb143bff-3ed6-492d-87e1-08d6a6ff9363)      |
| **Member Join Quiz**       | Member joins a quiz                           | ![Member Join Quiz](https://github.com/user-attachments/assets/abb85a8a-a20d-4345-a60b-4eb376a9e9c7) |
| **Accept / Reject Member** | Team leader accepts or rejects based on score | ![Accept Reject](https://github.com/user-attachments/assets/af96197a-5133-4b11-864a-9b0934f3490e)    |
| **Chat Box**               | Team members chat in real-time                | ![Chat Box](https://github.com/user-attachments/assets/148db9b5-04ef-4ae9-b375-092e2ff3412b)         |


### Some feature of Organizers 

| Operation                        | Description                           | Screenshot                                                                                                |
| -------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Dashboard**                    | Organizer overview dashboard          | ![Dashboard](https://github.com/user-attachments/assets/e3847c60-af41-4e6f-9681-8ae95996d77c)             |
| **Hackathon Page**               | View and manage hackathons            | ![Hackathon Page](https://github.com/user-attachments/assets/67fe3ca0-d9ee-4ab0-9693-cd6b740e4f71)        |
| **Create Hackathon**             | Create and publish a new hackathon    | ![Create Hackathon](https://github.com/user-attachments/assets/c06c33f5-14b1-4fce-be13-1e8e52998a0c)      |
| **Notifications**                | Receive system and user notifications | ![Notifications](https://github.com/user-attachments/assets/5a61bda4-d174-48e6-99ed-e13919b38b57)         |
| **Participation & Team Details** | View participant and team details     | ![Participation Details](https://github.com/user-attachments/assets/c85d3741-f36f-4f26-bd66-53af70056494) |



---

## Development

### Running in Development Mode

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
npm run dev
```

### Building for Production

**Frontend:**

```bash
npm run build
```

**Backend:**

```bash
npm start
```

---

## Environment Variables

### Backend (.env)

* `PORT` - Server port (default: 5000)
* `MONGODB_URI` - MongoDB connection string
* `JWT_SECRET` - Secret key for JWT tokens
* `NODE_ENV` - Environment (development/production)

### Frontend (.env)

* `VITE_API_URL` - Backend API URL (default: [http://localhost:5000/api](http://localhost:5000/api))


---

## 👩‍💻 Author

**Sadiya Shaikh**

🔗 GitHub: [https://github.com/SSsadiyashaikh](https://github.com/SSsadiyashaikh)

---

⭐ If you like this project, don’t forget to **star the repository**.

