# TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking team progress with role-based access control.

## Live Demo
🔗 **[taskflow.up.railway.app](https://your-app.up.railway.app)** *(update after deployment)*

## Features

- **Authentication** — JWT-based signup/login, protected routes
- **Projects** — Create, manage, and archive projects with progress tracking
- **Tasks** — Create tasks with title, description, priority, status, assignee & due date
- **Team management** — Invite members by email, assign Admin or Member roles
- **Dashboard** — Personal task overview, overdue tracking, status breakdown
- **Kanban board** — Visual board view (To Do / In Progress / Review / Done)
- **Role-based access** — Admins can manage members and settings; Members can view and update tasks

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, Vite, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

## Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL running locally

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and a secret key
npm install
node server.js
```

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

Open http://localhost:5173

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (owner) |
| GET | `/api/projects/:id/members` | List members |
| POST | `/api/projects/:id/members` | Add member (admin) |
| PUT | `/api/projects/:id/members/:userId` | Update role (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/dashboard` | Dashboard stats & tasks |
| GET | `/api/tasks/project/:id` | Tasks for a project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (creator) |

## Deploying on Railway

### Backend
1. Create a new Railway project
2. Add a **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`
3. Add your backend as a service from GitHub
4. Set environment variables:
   ```
   JWT_SECRET=your_secret_here
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
5. Railway auto-detects Node.js and runs `node server.js`

### Frontend
1. Add another service for the frontend
2. Set build command: `cd frontend && npm install && npm run build`
3. Set start command: `npx serve frontend/dist -l 3000`
4. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```

## Database Schema

```sql
users          — id, name, email, password_hash, avatar_color
projects       — id, name, description, owner_id, status
project_members — project_id, user_id, role (admin/member)
tasks          — id, title, description, project_id, assignee_id,
                  created_by, status, priority, due_date
```

## Role-based Access

| Action | Admin | Member |
|--------|-------|--------|
| View project & tasks | ✓ | ✓ |
| Create & edit tasks | ✓ | ✓ |
| Delete own tasks | ✓ | ✓ |
| Invite/remove members | ✓ | ✗ |
| Change member roles | ✓ | ✗ |
| Update project settings | ✓ | ✗ |
| Delete project | Owner only | ✗ |

## Folder Structure

```
taskflow/
├── backend/
│   ├── db/index.js          # DB pool + schema init
│   ├── middleware/auth.js   # JWT + role middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── UI.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── ProjectDetail.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
└── railway.toml
```
