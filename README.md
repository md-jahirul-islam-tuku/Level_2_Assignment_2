# Internal Tech Issue & Feature Tracker API

A role-based backend API for managing internal technical issues and feature requests. Users can report bugs, request new features, update issues based on permissions, and maintainers can manage workflow status and system operations.

## Live URL

Live API: `(https://level-2-assignment-2-ruby.vercel.app/)`

## Repository

GitHub Repository: `(https://github.com/md-jahirul-islam-tuku/Level_2_Assignment_2)`

---

## Features

### Authentication & Authorization
- User registration and login
- JWT-based authentication
- Refresh token support using HTTP-only cookies
- Role-based authorization
- Two user roles:
  - `contributor`
  - `maintainer`

### Issue Management
- Create new issues (`bug` or `feature_request`)
- Retrieve all issues with:
  - sorting
  - filtering by type
  - filtering by status
- Retrieve a single issue
- Update issue details
- Delete issue
- Maintainer-only workflow status update

### Permission Rules
#### Contributor
- Register & login
- Create issue
- View all issues
- View single issue
- Update own issue **only if status is `open`**

#### Maintainer
- All contributor permissions
- Update any issue
- Delete any issue
- Change issue workflow status independently
- Access internal management functionality

---

## Tech Stack

| Technology | Usage |
|------------|-------|
| Node.js (LTS 24+) | Runtime environment |
| TypeScript | Type safety |
| Express.js | Backend framework |
| PostgreSQL | Relational database |
| pg | Native PostgreSQL driver |
| Raw SQL | Database queries (`pool.query()`) |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| cookie-parser | Refresh token handling |
| cors | Cross-origin resource sharing |
| dotenv | Environment configuration |

---

## Project Structure

```txt
src
├── config
├── db
├── middleware
├── modules
│   ├── auth
│   └── issue
├── types
├── utils
├── app.ts
└── server.ts
```

## Architecture

This project follows a modular architecture with clear separation of concerns:

- `config/` → environment configuration
- `db/` → PostgreSQL connection & database initialization
- `middleware/` → authentication & error handling
- `modules/` → feature-based modules (`auth`, `issue`)
- `types/` → shared TypeScript types
- `utils/` → reusable helper functions

## Setup Instructions

### 1. Clone Repository

```bash
git clone (https://github.com/md-jahirul-islam-tuku/Level_2_Assignment_2.git)
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
CONNECTION_STRING=your_postgresql_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
NODE_ENV=development
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build Project

```bash
npm run build
```

### 6. Start Production Server

```bash
npm start
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh-token` | Public |

---

### Issues

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/issues` | Authenticated |
| GET | `/api/issues` | Public |
| GET | `/api/issues/:id` | Public |
| PATCH | `/api/issues/:id` | Contributor (own issue if open) / Maintainer |
| PATCH | `/api/issues/:id/status` | Maintainer |
| DELETE | `/api/issues/:id` | Maintainer |

---

## Query Parameters

### Get All Issues

Example:

```http
GET /api/issues?sort=newest&type=bug&status=open
```

### Supported Filters

| Param | Values |
|--------|--------|
| sort | newest, oldest |
| type | bug, feature_request |
| status | open, in_progress, resolved |

---

## Database Schema Summary

### Users Table

| Field | Type |
|--------|------|
| id | SERIAL PRIMARY KEY |
| name | VARCHAR(100) |
| email | VARCHAR(255) UNIQUE |
| password | TEXT |
| role | contributor / maintainer |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

### Issues Table

| Field | Type |
|--------|------|
| id | SERIAL PRIMARY KEY |
| title | VARCHAR(150) |
| description | TEXT |
| type | bug / feature_request |
| status | open / in_progress / resolved |
| reporter_id | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## Important Implementation Notes

### Raw SQL Only
This project strictly uses **raw SQL queries with `pool.query()`** and does **not use**:
- ORM
- Query Builder
- SQL JOIN

### Reporter Data Without JOIN
To retrieve reporter details in the **Get All Issues** endpoint, issues are fetched first and reporter information is retrieved separately using:

```sql
WHERE id = ANY($1)
```

This follows the assignment restriction of **no SQL JOIN usage** while still avoiding multiple unnecessary queries.

---

## Standard API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {}
}
```

---

## ✔ Author

### Md Jahirul Islam Tuku

Student, Programming Hero, Level-2, Batch-7,
