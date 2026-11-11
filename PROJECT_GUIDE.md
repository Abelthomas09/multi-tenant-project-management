# Multi-Tenant Project Management: Complete Project Guide

This document explains the project from database creation to browser behavior. It is based on the current source code, not only the README.

## 1. What the application does

The application manages projects and users for several companies (tenants). A request is controlled by three independent questions:

1. **Who is the caller?** JWT authentication identifies the current user.
2. **What may the caller do?** Role permissions and direct user permissions authorize actions.
3. **Which tenant may the caller access?** Tenant middleware creates a server-side tenant scope.

A tenant user is automatically restricted to its own company. A Super Admin has no tenant and must select one with `X-Tenant-Id` whenever accessing tenant-owned records.

## 2. Technology and folders

- **Frontend:** React, Vite, React Router, browser `localStorage`.
- **Backend:** Node.js, Express 5, CommonJS JavaScript.
- **Database:** PostgreSQL.
- **ORM:** Prisma 7 with the PostgreSQL adapter.
- **Authentication:** bcrypt password hashes and HS256 JWT bearer tokens.
- **Authorization:** database-backed role and direct-user permissions.

Important files:

- [backend/src/server.js](backend/src/server.js): Express application and middleware order.
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma): database model.
- [backend/prisma/seed.js](backend/prisma/seed.js): roles, permissions, demo tenants, user, and projects.
- [backend/src/routes](backend/src/routes): URL-to-controller mapping.
- [backend/src/controllers](backend/src/controllers): HTTP request/response layer.
- [backend/src/services](backend/src/services): business rules and Prisma queries.
- [backend/src/middleware](backend/src/middleware): authentication, authorization, tenant isolation, rate limits, and errors.
- [frontend/src/services/api.js](frontend/src/services/api.js): browser API client.
- [frontend/src/context/AuthProvider.jsx](frontend/src/context/AuthProvider.jsx): login/session lifecycle.

The backend follows this separation:

```mermaid
flowchart LR
  Browser -->|HTTP JSON| Express
  Express --> Routes
  Routes --> Middleware
  Middleware --> Controllers
  Controllers --> Services
  Services --> Prisma
  Prisma --> PostgreSQL
  Services --> Controllers
  Controllers -->|success/error envelope| Browser
```

## 3. Creating the project from scratch

### Prerequisites

Install Node.js with npm and PostgreSQL. Create a PostgreSQL database called `multi_tenant_pm`.

### Backend environment

Create `backend/.env` from `backend/.env.example`. The important values are:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/multi_tenant_pm"
JWT_SECRET="a-long-random-development-secret"
JWT_EXPIRES_IN="1h"
JWT_ISSUER="multi-tenant-project-management"
JWT_AUDIENCE="multi-tenant-project-management-api"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
LOGIN_RATE_LIMIT_ENABLED="true"
```

`DATABASE_URL` and `JWT_SECRET` are always required. `CLIENT_URL` is required in production. `env.js` supplies defaults for the JWT lifetime, issuer, and audience when they are omitted.

### Install, migrate, seed, and run

```bash
cd backend
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

The development script runs `node --watch src/server.js`. Production uses:

```bash
cd backend
npm run prisma:migrate:deploy
npm start
```

The API defaults to port `4000`, or uses the platform `PORT` variable. Check it with:

```text
GET http://localhost:4000/health
```

### Frontend

Create `frontend/.env` and set:

```env
VITE_API_BASE_URL="http://localhost:4000"
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the UI at `http://localhost:5173`.

## 4. Database design

The schema is in [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

```mermaid
erDiagram
  TENANT ||--o{ USER : contains
  TENANT ||--o{ PROJECT : owns
  ROLE ||--o{ USER : assigned
  ROLE ||--o{ ROLE_PERMISSION : grants
  PERMISSION ||--o{ ROLE_PERMISSION : included_in
  USER ||--o{ USER_PERMISSION : receives
  PERMISSION ||--o{ USER_PERMISSION : assigned
```

### Tables and purpose

- **Tenant:** company boundary. `name` is unique. It owns users and projects.
- **User:** account with globally unique email, password hash, role, active flag, and optional tenant. Super Admins have `tenantId = null`.
- **Role:** one of `SUPER_ADMIN`, `ADMIN`, or `AGENT`.
- **Permission:** named capability such as `projects.update`.
- **RolePermission:** many-to-many role-to-permission join table. Its composite key prevents duplicate assignments.
- **UserPermission:** many-to-many user-to-permission join table for exceptions such as granting an Agent project update.
- **Project:** tenant-owned record with `ACTIVE`, `INACTIVE`, or `DRAFT` status.

Tenant, user-role, and project foreign keys use restrictive deletion. Permission join rows cascade when their parent role, user, or permission is removed. Indexes support tenant filtering and project status filtering.

## 5. Seed data

[backend/prisma/seed.js](backend/prisma/seed.js) is intentionally repeatable:

1. Upsert the nine known permissions.
2. Upsert all three roles.
3. Delete and recreate each role's permission assignments.
4. Upsert `Tenant A` and `Tenant B`.
5. Upsert the Super Admin.
6. Delete and recreate the three named demo projects.

Demo login:

```text
Email: superadmin@example.com
Password: Password123!
```

The password is for demonstration only. The seed does not create Admin or Agent users; create them through the user API after logging in.

Default role permissions:

| Role | Default permissions |
| --- | --- |
| SUPER_ADMIN | All nine permissions |
| ADMIN | User CRUD/status permissions plus all project permissions |
| AGENT | `projects.read` |

## 6. Backend startup and global pipeline

[backend/src/server.js](backend/src/server.js) performs this work:

1. Loads `.env` with `dotenv`.
2. Imports configuration, middleware, routes, and error handlers.
3. Calls `validateEnvironment()`.
4. Creates the Express app and reads `PORT`.
5. Disables the Express `X-Powered-By` header.
6. Enables CORS for `CLIENT_URL` with credentials.
7. Parses JSON bodies up to 100 KB.
8. Applies the global API limiter: 300 requests per IP per 15 minutes.
9. Registers `/health` and all `/api/*` routers.
10. Sends unmatched requests to `notFound`.
11. Sends thrown errors to `errorHandler`.

Every controller uses `try/catch` and calls `next(error)`. That lets one error formatter produce consistent responses.

A normal success response looks like:

```json
{
  "success": true,
  "message": "Projects retrieved.",
  "data": {}
}
```

A validation error looks like:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [{ "field": "name", "message": "name must be a non-empty string." }]
}
```

## 7. Security pipeline

Protected tenant routes use this order:

```text
apiLimiter -> authenticate -> requireTenantScope -> requirePermissions -> controller -> service
```

### Authentication: `authenticate`

[authenticate.js](backend/src/middleware/authenticate.js) does the following:

1. Reads `Authorization: Bearer <token>`.
2. Verifies the JWT signature, HS256 algorithm, issuer, audience, and expiration.
3. Reads the current user from PostgreSQL using the JWT `sub` claim.
4. Loads role permissions and direct user permissions.
5. Rejects deleted or disabled users, even if their token has not expired.
6. Merges both permission sources without duplicates.
7. Stores the current authorization context in `req.auth`.

Because the user is reloaded on every request, disabling an account or changing permissions takes effect on the next request.

### Authorization: `requirePermissions`

[authorize.js](backend/src/middleware/authorize.js) receives one or more permission codes. It requires every code to be present in `req.auth.permissions`. It returns `401` without authentication and `403` when the user lacks permission. It does not reveal which permission was missing.

### Tenant isolation: `requireTenantScope` and `tenantWhere`

[tenantIsolation.js](backend/src/middleware/tenantIsolation.js) is the main cross-tenant security boundary:

- A normal user must have a tenant and is automatically scoped to that tenant.
- A normal user cannot use `X-Tenant-Id` to select another tenant.
- A Super Admin must provide `X-Tenant-Id`.
- The header must be a valid UUID and must belong to an existing tenant.
- `tenantWhere(req, filters)` always adds `tenantId: req.tenant.id` to Prisma filters.

Services use `tenantWhere` for reads and existence checks. Therefore, a project or user from another tenant behaves as not found (`404`) rather than exposing that it exists.

### Rate limits

[rateLimiters.js](backend/src/middleware/rateLimiters.js) provides:

- `apiLimiter`: 300 requests per IP per 15 minutes, globally.
- `loginLimiter`: five unsuccessful login requests per IP per 15 minutes. Successful logins are skipped.
- `LOGIN_RATE_LIMIT_ENABLED=false`: local-only switch to disable the login limiter.

Rate-limit responses are HTTP `429` with the standard rate-limit headers.

## 8. Complete API reference

Base URL: `http://localhost:4000`.

For Super Admin tenant-scoped calls, send:

```http
X-Tenant-Id: <tenant UUID>
```

### Health

#### `GET /health`

No authentication. Returns `{ data: { status: "ok" } }`.

### Authentication

#### `POST /api/auth/login`

Middleware: global API limiter, then login limiter.

Body:

```json
{ "email": "superadmin@example.com", "password": "Password123!" }
```

`loginUser` normalizes the email, checks required fields, loads the user and permissions, compares the password with bcrypt, rejects inactive users, and signs a JWT. The response contains `token`, `tokenType`, `expiresIn`, and a public serialized user. The password hash is never returned.

#### `GET /api/auth/me`

Middleware: global API limiter, then `authenticate`.

Returns the current `req.auth` object. It is used by the frontend to validate a saved session when the application starts.

### Projects

All project routes use `authenticate -> requireTenantScope` before their endpoint permission.

#### `GET /api/projects?page=1&pageSize=20&status=ACTIVE`

Permission: `projects.read`.

`getProjects` validates pagination and optional status, adds the tenant filter, queries the page and total count in a Prisma transaction, and returns:

```json
{
  "projects": [],
  "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
}
```

#### `POST /api/projects`

Permission: `projects.create`.

Body requires non-empty `name`, `address`, `useCase`, and one valid status: `ACTIVE`, `INACTIVE`, or `DRAFT`. A client-supplied `tenantId` is rejected. The service takes the tenant ID from `req.tenant.id`.

#### `GET /api/projects/:id`

Permission: `projects.read`.

Validates the UUID and searches by both project ID and tenant scope. A project in another tenant returns `404`.

#### `PATCH /api/projects/:id`

Permission: `projects.update`.

Accepts any non-empty subset of `name`, `address`, `useCase`, and `status`. It rejects `tenantId`, empty updates, invalid UUIDs, and invalid status values. It first confirms tenant ownership, then updates by ID.

#### `DELETE /api/projects/:id`

Permission: `projects.delete`.

Validates the UUID, confirms tenant ownership, and deletes the project. It returns `data: null`.

### Users

All user routes start with `authenticate -> requireTenantScope`.

#### `GET /api/users?page=1&pageSize=20&role=AGENT&isActive=true`

Permission: `users.read`.

Supports pagination, role `ADMIN` or `AGENT`, and `isActive=true|false`. Non-Super Admins are forcibly restricted to Agents even if they request another role. Password hashes are never selected.

#### `POST /api/users`

Permission: `users.create`.

Body:

```json
{
  "firstName": "Asha",
  "lastName": "User",
  "email": "asha@example.com",
  "password": "at-least-8-characters",
  "role": "AGENT"
}
```

Names must be non-empty, email is normalized and validated, and passwords must be at least eight characters. Only Super Admins may create Admins; Admins may create Agents. The service hashes the password with bcrypt cost 12, finds the role ID, and assigns the current tenant server-side.

#### `PATCH /api/users/:id`

Permission: `users.update`.

Can update `firstName`, `lastName`, `email`, or `role`. It rejects `tenantId`, `password`, and `isActive`. Admins cannot update Admin users. The target must be in the current tenant.

#### `PATCH /api/users/:id/status`

Permission: `users.disable`.

Body:

```json
{ "isActive": false }
```

The value must be boolean. The same manageable-user and tenant restrictions apply.

#### `GET /api/users/:id/permissions`

Extra middleware: `requireSuperAdmin -> requirePermissions("permissions.manage")`.

The target must be an Agent in the selected tenant. Returns the allowed project permissions, descriptions, and currently assigned direct permission codes.

#### `PUT /api/users/:id/permissions`

Extra middleware: Super Admin plus `permissions.manage`.

Body:

```json
{ "permissionCodes": ["projects.update", "projects.delete"] }
```

Only `projects.create`, `projects.update`, and `projects.delete` are allowed. The service removes the Agent's old direct project grants and creates the new set inside a transaction. Sending an empty array removes all direct project grants while the Agent keeps the role's `projects.read` permission.

### Admin role permissions

These routes are mounted at `/api/permissions`, and require authentication, Super Admin role, and `permissions.manage`. They do not require a tenant header because role configuration is global.

#### `GET /api/permissions/admin`

Returns the Admin role, all known permissions, and the Admin role's assigned codes.

#### `PUT /api/permissions/admin`

Body:

```json
{ "permissionCodes": ["users.read", "projects.read"] }
```

Validates every code, then replaces all Admin role assignments transactionally. This changes every Admin in every tenant.

### Tenants

These routes require authentication, Super Admin role, and `permissions.manage`. They intentionally do not require `X-Tenant-Id`.

#### `GET /api/tenants`

Returns all tenants ordered alphabetically. The frontend uses this for the Super Admin tenant picker.

#### `POST /api/tenants`

Body:

```json
{ "name": "Company A" }
```

Trims and validates a non-empty name of at most 120 characters. Duplicate names are converted by the error handler to HTTP `409`.

## 9. Function-by-function backend map

### `server.js`

- `validateEnvironment`: rejects missing required configuration.
- Express setup: creates the app, registers parsers, CORS, rate limiting, routes, and error handlers.
- `/health` callback: cheap liveness check.

### Authentication and middleware

- `getBearerToken`: extracts a bearer token from the authorization header.
- `collectPermissions`: unions role and direct-user codes.
- `authenticate`: verifies JWT and reloads active user state.
- `requirePermissions`: enforces one or more capability codes.
- `requireTenantScope`: resolves the tenant context from the logged-in user or Super Admin header.
- `tenantWhere`: prevents services from accidentally creating an unscoped tenant query.
- `rateLimitHandler`: standardizes HTTP 429 responses.
- `notFound`: standardizes unmatched URL responses.
- `errorHandler`: maps Prisma duplicate errors to `409`, logs server errors, and hides internal details in production.

### Services

- `authService.serializeUser`: selects safe public user fields.
- `authService.loginUser`: validates credentials, compares bcrypt hashes, gathers permissions, and signs the JWT.
- `projectService.validateProjectPayload`: validates create and partial-update fields.
- `projectService.getProjects`: validates filters and performs scoped pagination.
- `projectService.createProject`: creates a project using the server tenant scope.
- `projectService.getProjectById`: scoped lookup by UUID.
- `projectService.updateProject`: validates, confirms ownership, and updates.
- `projectService.deleteProject`: validates, confirms ownership, and deletes.
- `userService.serializeUser`: converts Prisma's nested role object into a role string.
- `userService.assertAssignableRole`: allows only Admin/Agent roles and restricts Admin management to Super Admins.
- `userService.validateCreatePayload`: validates and normalizes account creation input.
- `userService.validateUpdatePayload`: allows only safe profile/role fields.
- `userService.findManageableUser`: enforces tenant and role management restrictions.
- `userService.getRoleId`: converts a role enum to its database ID.
- `userService.findAgentForPermissionManagement`: finds only an Agent in the active tenant.
- `userService.getUsers`: applies filters, forced Agent visibility for Admins, pagination, and safe selection.
- `userService.createUser`: hashes a password and creates a tenant user.
- `userService.getAgentPermissions`: returns allowed and assigned direct grants.
- `userService.updateAgentPermissions`: validates allowed codes and replaces assignments transactionally.
- `userService.updateUser`: updates permitted profile fields and converts role to `roleId`.
- `userService.updateUserStatus`: toggles `isActive` after validation.
- `permissionService.getAdminPermissionData`: loads all available and assigned Admin permissions.
- `permissionService.updateAdminPermissions`: validates and transactionally replaces global Admin grants.
- `tenantService.getAllTenants`: lists selectable tenants.
- `tenantService.createTenant`: validates and creates a unique tenant.

### Utility functions

- `HttpError`: carries an HTTP status, message, and field-level errors.
- `validateUUID`: rejects malformed resource IDs before querying.
- `getPagination`: applies defaults and limits page size to 100.
- `emailPattern`: basic email validation used during user creation/update.
- `projectSelect` and `userSelect`: whitelists response fields and prevents password hashes from leaving the service.

## 10. Frontend-to-backend connection

The browser starts in [frontend/src/main.jsx](frontend/src/main.jsx), which mounts React. [frontend/src/App.jsx](frontend/src/App.jsx) creates the router, wraps the application in `AuthProvider`, and renders `AppRoutes`.

`API` in [frontend/src/utils/constants.js](frontend/src/utils/constants.js) reads `VITE_API_BASE_URL` and defaults to `http://localhost:4000`.

### Login/session flow

1. `Login.jsx` calls `loginRequest(email, password)`.
2. `POST /api/auth/login` returns a token and public user.
3. `AuthProvider.login` stores the session in `localStorage` under `pm_session`.
4. The app navigates to `/projects`.
5. On startup, `AuthProvider` reads the saved session and calls `fetchMe`.
6. `GET /api/auth/me` validates that the token and user are still valid.
7. A `401` clears the session and returns to `/login`.

`createApi` attaches the bearer token to every request. For Super Admin tenant-scoped calls it attaches `X-Tenant-Id`; tenant-independent calls such as tenant listing and global Admin permission management pass `tenantScoped: false`.

### Routes and UI permissions

`AppRoutes.jsx` protects `/projects`, `/users`, and `/permissions`. It uses the cached `can(permission)` check to decide which pages are available. `MainLayout.jsx` hides navigation actions the user cannot perform.

- Projects page calls project list/create/update/delete APIs.
- Users page calls user list/create/update/status APIs.
- Agent permission form calls the two Agent permission APIs.
- Permission management calls the two global Admin permission APIs.
- Tenant picker calls tenant list/create APIs and stores the selected tenant ID under `pm_tenant_id`.

The frontend requests up to 100 records but does not currently render pagination controls, even though the backend supports pagination.

## 11. Typical end-to-end request

Example: a Super Admin updates a project in Tenant A.

```mermaid
sequenceDiagram
  participant UI as React UI
  participant API as Express API
  participant JWT as authenticate
  participant Scope as requireTenantScope
  participant Perm as requirePermissions
  participant Service as projectService
  participant DB as PostgreSQL

  UI->>API: PATCH /api/projects/:id + Bearer + X-Tenant-Id
  API->>JWT: Verify token and reload user
  JWT-->>API: req.auth = user, role, permissions
  API->>Scope: Resolve Tenant A
  Scope-->>API: req.tenant.id = Tenant A
  API->>Perm: Require projects.update
  Perm-->>API: Allowed
  API->>Service: updateProject(req, id, body)
  Service->>DB: Find project where id AND tenantId
  DB-->>Service: Project or none
  Service->>DB: Update project
  DB-->>Service: Updated project
  Service-->>API: Safe project fields
  API-->>UI: 200 success/data/project
```

The critical detail is that the body cannot choose the tenant. The tenant comes from authenticated scope and is added to the Prisma query.

## 12. Error and status behavior

- `400`: malformed input, missing required fields, invalid UUID, invalid filters, or missing Super Admin tenant header.
- `401`: missing, invalid, expired, or no-longer-valid authentication token; invalid login credentials.
- `403`: authenticated user lacks permission or attempts another tenant.
- `404`: route, tenant, project, or manageable user not found. Cross-tenant records intentionally look absent.
- `409`: unique database conflict, such as duplicate email or tenant name.
- `429`: rate limit exceeded.
- `500`: unexpected server/configuration/database failure. Internal details are returned only in development diagnostics.

## 13. Important current-code notes

1. The README mentions hash routes such as `#/projects`, but the current frontend uses `BrowserRouter` paths such as `/projects` and `/users`. The Vercel rewrite supports normal browser paths.
2. The Admin role permission endpoints are implemented at `/api/permissions/admin` but were missing from the README API tables.
3. Admin role permissions are global. They are not tenant-specific.
4. The frontend `.env.example` should be replaced with a real backend URL; do not leave a placeholder value.
5. The seed creates only the Super Admin account. Admin and Agent accounts must be created later.
6. `getDatabaseUrl` rewrites several PostgreSQL SSL modes to `verify-full`; local/provider certificates must support that setting.
7. The backend validates environment variables after importing route modules, which also import Prisma. A malformed database URL can therefore fail during import before the friendly validation error.
8. The frontend `fetchMe` throws a generic error when startup validation fails, while normal API calls preserve structured backend errors.
9. Never use the seeded demo password in production. Use a new secret and real user credentials.

## 14. Short operational checklist

- PostgreSQL is running and the database exists.
- `backend/.env` has a valid `DATABASE_URL` and strong `JWT_SECRET`.
- `CLIENT_URL` matches the browser origin.
- Migrations have been applied.
- Seed has completed.
- Backend health returns HTTP 200.
- Frontend `VITE_API_BASE_URL` points to the backend.
- Super Admin selects a tenant before calling tenant-owned APIs.
- Production uses `prisma migrate deploy`, `NODE_ENV=production`, HTTPS, and a production-grade secret.
