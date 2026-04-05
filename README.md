# Task Manager API
**GitHub**: https://github.com/Amritk-umar/task-manager-assessment

**Live API**: https://task-manager-assessment-three.vercel.app

A RESTful Task Management API built with Next.js, Prisma, and PostgreSQL (Neon).

## Tech Stack

- **Framework**: Next.js 15 (App Router API Routes)
- **Language**: TypeScript
- **ORM**: Prisma 7
- **Database**: PostgreSQL via Neon (cloud-hosted)
- **Deployment**: Vercel

## Project Structure
src/
├── app/api/
│   ├── users/          # GET, POST, [id] GET, PATCH, DELETE
│   ├── projects/       # GET, POST, [id] GET, PATCH, DELETE, stats
│   └── tasks/          # GET, POST, [id] GET, PATCH, DELETE, complete, restore
├── lib/
│   ├── db.ts           # Prisma client singleton
│   ├── errors.ts       # AppError, NotFoundError, ValidationError, ConflictError
│   └── response.ts     # ok(), created(), noContent(), err()
├── services/
│   ├── userService.ts
│   ├── projectService.ts
│   └── taskService.ts
└── middleware.ts        # Rate limiting + security headers

## Setup

### Prerequisites
- Node.js v18+
- A Neon account (free) — neon.tech
- An Upstash account (free) — upstash.com

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/task-manager-assessment.git
cd task-manager-assessment
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables — create a `.env` file:
```env
DATABASE_URL="postgresql://..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

4. Generate Prisma client and run migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Seed sample data
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

6. Start the development server
```bash
npm run dev
```

API available at: `http://localhost:3000/api`

## API Reference

### Users
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/users | List all users (paginated) | 200 |
| POST | /api/users | Create a user | 201 |
| GET | /api/users/:id | Get user by ID | 200 |
| PATCH | /api/users/:id | Update user | 200 |
| DELETE | /api/users/:id | Delete user | 204 |

### Projects
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/projects | List all projects (paginated) | 200 |
| POST | /api/projects | Create a project | 201 |
| GET | /api/projects/:id | Get project by ID | 200 |
| GET | /api/projects/:id/stats | Get project completion stats | 200 |
| PATCH | /api/projects/:id | Update project | 200 |
| DELETE | /api/projects/:id | Delete project | 204 |

### Tasks
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/tasks | List all tasks (paginated, filterable) | 200 |
| POST | /api/tasks | Create a task | 201 |
| GET | /api/tasks/:id | Get task by ID | 200 |
| PATCH | /api/tasks/:id | Update task | 200 |
| POST | /api/tasks/:id/complete | Mark task as completed | 200 |
| POST | /api/tasks/:id/restore | Restore a soft-deleted task | 200 |
| DELETE | /api/tasks/:id | Soft delete a task | 204 |

### Query Parameters
| Endpoint | Param | Example |
|----------|-------|---------|
| GET /api/tasks | status | ?status=PENDING |
| GET /api/tasks | priority | ?priority=HIGH |
| GET /api/tasks | projectId | ?projectId=abc123 |
| GET /api/tasks | includeDeleted | ?includeDeleted=true |
| GET /api/projects | ownerId | ?ownerId=abc123 |
| Any list endpoint | page | ?page=1&limit=10 |

## Business Rules

All rules enforced in the service layer:

- Cannot delete a project with active tasks → 409
- Duplicate project name per owner blocked → 409
- Cannot update a completed or cancelled task → 409
- Cannot complete an already completed task → 409
- Task due date must be in the future → 400
- Assignee must be an existing user → 404
- Cannot delete a user who owns projects → 409
- Cannot delete a user with active task assignments → 409
- Email must be unique → 409

## Optional Enhancements Implemented

- Pagination with meta (page, limit, total, totalPages, hasNextPage, hasPrevPage)
- Search and filter by status, priority, projectId, ownerId
- Rate limiting via Upstash (10 requests per 60 seconds on write operations)
- Soft delete with restore endpoint for tasks
- 21 integration tests with Jest

## Running Tests
```bash
npm test
```

## Assumptions & Tradeoffs

- **No authentication** — ownerId and assigneeId are passed explicitly in request bodies. In production, these would be derived from a JWT token.
- **Soft delete on tasks only** — Users and Projects use hard delete to keep scope focused.
- **Prisma 7** — Uses the new prisma.config.ts pattern with PrismaNeon adapter for serverless compatibility.
- **Rate limiting** — Applied to POST, PATCH, DELETE only. GET requests are unrestricted.
- **Email validation** — Uses a basic regex, not full RFC 5322 parsing.
