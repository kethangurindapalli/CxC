# CxC - Connect and Collab

*Formerly ProjectConnect* — Connect people working on similar projects/topics and help them find people who may have faced or solved the same problem.

**Flow:** Create Project → Describe Problem → Find Similar People → Connect → Chat → Solve/Share Knowledge

Example: User A has "AI Face Detection - Low accuracy" problem, User B solved similar accuracy issue in "Computer Vision". System recommends User B to User A with similarity percentage + reasons.

## Features
- JWT + bcrypt authentication (Register/Login/Logout)
- User profile (name, bio, skills, interests, availability: Available/Sometimes/Not available)
- Projects (title, description, category, technologies, currentProblem, status, visibility: Public/Connections Only/Private) - edit/delete own projects
- **Matching System** - local keyword/category/technology/problem similarity, modular for future AI, shows 91% Match + reasons (Similar topic, Same technology, Similar problem), prioritizes active/available, never recommends self, respects privacy/visibility
- **Privacy** - Public vs Private separation, private projects hidden from search, matching uses private info internally but doesn't expose, Anonymous Mode (Anonymous User #1234 with limited info)
- **Connections** - send/accept/reject/cancel/remove, no self-connect, no duplicates, only accepted can see connection-only info & chat
- **Private Chat** - Socket.IO real-time 1-to-1, only connected users, stored in MongoDB (sender, receiver, message, timestamp), authorization checks
- **Responsiveness** - availability status, recently active, prioritize available in matching, activityVisibility toggle
- **Search** - users/projects/topics/technologies respecting privacy (private never public)
- **Pages** - Home, Register, Login, Dashboard, Profile, Create/Edit Project, Project Details, Find Matches, Connections, Chat, Privacy Settings, Search (React Router)

## Tech Stack (FREE)
- Frontend: React.js + Vite + CSS
- Backend: Node.js + Express.js
- Database: MongoDB Atlas Free Tier (or local MongoDB)
- Auth: JWT + bcryptjs
- Realtime: Socket.IO
- No paid APIs

## Project Structure
```
projectconnect/
├── client/src/
│   ├── components/ (Navbar, ProtectedRoute, LoadingSpinner)
│   ├── pages/ (Home, Register, Login, Dashboard, Profile, Projects, ProjectForm, ProjectDetails, Matches, Connections, Chat, PrivacySettings, Search, UserDetail)
│   ├── services/api.js
│   ├── context/ (AuthContext, SocketContext, ToastContext)
│   └── App.jsx
├── server/
│   ├── controllers/ (auth, user, project, match, connection, message)
│   ├── models/ (User, Project, Connection, Message)
│   ├── routes/ (auth, users, projects, matches, connections, messages)
│   ├── middleware/ (auth, validate)
│   ├── services/matching.js
│   ├── socket/socketHandler.js
│   └── server.js
├── .env.example
└── README.md
```

## Setup Instructions

### 1. MongoDB Atlas (Free Tier)
1. Go to https://www.mongodb.com/atlas -> Create free cluster (M0)
2. Create Database User (username/password)
3. Network Access -> Allow Access from Anywhere (0.0.0.0/0) for development
4. Copy connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/projectconnect?retryWrites=true&w=majority`
5. Alternative: use local MongoDB `mongodb://localhost:27017/projectconnect`

### 2. Environment Variables
Copy `.env.example` to `server/.env` (and root `.env` if needed):
```
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/projectconnect?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-strong-random-string-at-least-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Install & Run

**Install all:**
```bash
npm run install:all  # from root, or manually:
cd server && npm install
cd ../client && npm install
```

**Run backend:**
```bash
cd server
npm run dev   # or npm start
# Server at http://localhost:5000
```

**Run frontend:**
```bash
cd client
npm run dev
# Frontend at http://localhost:5173
```

**Or from root (requires concurrently):**
```bash
npm run dev
```

### 4. Build Frontend for production
```bash
cd client && npm run build
```

## API Routes

**Auth:**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me
- PUT  /api/auth/profile

**Users:**
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/search?q=&skills=&interests=
- GET /api/users/:id

**Projects:**
- POST   /api/projects
- GET    /api/projects (own)
- GET    /api/projects/all
- GET    /api/projects/search?q=&technologies=&category=
- GET    /api/projects/:id
- PUT    /api/projects/:id
- DELETE /api/projects/:id

**Matching:**
- GET /api/matches
- GET /api/matches/:projectId

**Connections:**
- POST   /api/connections {receiverId}
- GET    /api/connections
- PUT    /api/connections/:id {action: accept|reject}
- DELETE /api/connections/:id (cancel if pending, remove if accepted)

**Messages:**
- GET  /api/messages/conversations
- GET  /api/messages/:userId
- POST /api/messages {receiverId, message}

Socket.IO events: `sendMessage`, `joinConversation`, `typing`, `stopTyping`, `newMessage`, `connectionRequest`

## Security
- JWT authentication, bcrypt hashing, protected routes, authorization checks (owner only, connection only, visibility checks), input validation (express-validator), CORS, env vars, no passwords in responses, private projects/chats protected.

## Testing Flow
Register → Login → Create Profile (skills, availability) → Create Project (with problem) → Find Similar Users (check %) → Send Connection → Accept (second user) → Start Chat. Also verify: private projects not visible, anonymous hides identity, duplicate connections blocked, chat blocked without connection, auth required.

## Troubleshooting
- If MongoDB connection fails, check IP whitelist and URI.
- If CORS error, set CLIENT_URL correctly.
- If Socket fails, ensure token is in localStorage (set on login) and CLIENT_URL matches.
