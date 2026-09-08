# Multi-Tenant Project Management

A technical-test project for managing projects across multiple tenants with role-based and permission-based authorization.

## Stack

- Frontend: React with Vite
- Backend: Node.js, Express, JavaScript
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT bearer tokens with database-backed authorization

## Database model

- `Tenant` owns its users and projects.
- `User` has one `Role`; non-super-admin users belong to one tenant.
- `Role` and `Permission` are linked through `RolePermission`.
- `UserPermission` supports additional permissions for a specific user, such as an Agent granted `projects.update`.
- `Project` belongs to one tenant and has a validated status: `ACTIVE`, `INACTIVE`, or `DRAFT`.

## Setup

1. Create a PostgreSQL database named `multi_tenant_pm`.
2. Copy `backend/.env.example` to `backend/.env` and set the database connection string and a secure development JWT secret.
3. Copy `frontend/.env.example` to `frontend/.env` when beginning the frontend phase.
4. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

5. Create the database schema and run the development seed:

   ```bash
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```

6. Start the API:

   ```bash
   npm run dev
   ```

7. In a separate terminal, start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

The health endpoint is available at `GET http://localhost:4000/health`.

## Frontend application

The React application is available at the Vite URL (normally `http://localhost:5173`). It provides:

- JWT login with session storage and validation on application startup.
- Protected hash routes for Projects (`#/projects`) and Users (`#/users`).
- Navigation and actions hidden when the authenticated user lacks the corresponding API permission.
- Project list, create, edit, status filter, and delete interfaces.
- User list, create, edit, and enable/disable interfaces.
- Automatic `Authorization` headers and `X-Tenant-Id` handling for Super Admin requests.
- A Super Admin tenant picker and company-creation control.
- Super Admin controls for granting an individual Agent project create, update, and delete permissions.

Set `VITE_API_BASE_URL` in `frontend/.env` if the backend is not running at `http://localhost:4000`.

## Authentication and authorization

`POST /api/auth/login` accepts `{ "email", "password" }` and returns a JWT plus the authenticated user's permissions. Send the token on protected endpoints as `Authorization: Bearer <token>`. `GET /api/auth/me` verifies the token and returns the current authorization context.

The reusable middleware is intentionally split by responsibility:

- `authenticate` validates a JWT and loads the active user, role permissions, and user-specific permissions from the database.
- `requirePermissions("projects.create")` denies requests lacking every requested permission.
- `requireTenantScope` sets `req.tenant.id` from the logged-in tenant; it rejects a non-super-admin trying to select another tenant. Super Admin requests must explicitly provide an existing `X-Tenant-Id` header, avoiding unscoped tenant queries.
- `tenantWhere(req, filters)` is the required helper for Prisma tenant-owned resources, returning a query filter that always contains the scoped `tenantId`.

The API is limited to 300 requests per 15 minutes per IP. Login additionally permits five unsuccessful attempts per IP per 15 minutes. Both limits return HTTP 429 and standard rate-limit headers. During local testing only, set `LOGIN_RATE_LIMIT_ENABLED="false"` in `backend/.env` to disable the login limit; remove it or set it back to `"true"` before normal use.

## Projects API

All project endpoints require a bearer token and enforce the middleware order `authenticate → requireTenantScope → requirePermissions`. Tenant users are automatically scoped to their own tenant. Super Admins must additionally send `X-Tenant-Id: <tenant UUID>`.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/projects?page=1&pageSize=20&status=ACTIVE` | `projects.read` | List paginated tenant projects; `status` is optional. |
| `POST` | `/api/projects` | `projects.create` | Create a project. |
| `GET` | `/api/projects/:id` | `projects.read` | Retrieve one tenant project. |
| `PATCH` | `/api/projects/:id` | `projects.update` | Update one or more project fields. |
| `DELETE` | `/api/projects/:id` | `projects.delete` | Delete a project. |

Create requests require `name`, `address`, `useCase`, and `status` (`ACTIVE`, `INACTIVE`, or `DRAFT`). `tenantId` is rejected in project payloads and is always supplied by the authenticated request scope. Accessing another tenant's project returns 404, without disclosing that it exists.

## Users API

All user endpoints are tenant-scoped and use `authenticate → requireTenantScope → requirePermissions`. Password hashes are never returned.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users?page=1&pageSize=20&role=AGENT&isActive=true` | `users.read` | List tenant users; filters are optional. |
| `POST` | `/api/users` | `users.create` | Create a tenant Admin or Agent. |
| `PATCH` | `/api/users/:id` | `users.update` | Update name, email, or role. |
| `PATCH` | `/api/users/:id/status` | `users.disable` | Enable or disable a user with `{ "isActive": false }`. |

`POST /api/users` requires `firstName`, `lastName`, `email`, `password` (at least eight characters), and `role`. `tenantId`, password changes, and status changes are not accepted by the general update route. An Admin can view and manage only Agents in its own tenant. A Super Admin can manage Admins and Agents in the selected `X-Tenant-Id` scope. Super Admin accounts are never created or managed through these tenant-scoped routes.

## Tenant and Agent-permission APIs

Only a Super Admin with `permissions.manage` can use these endpoints.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/tenants` | List companies available for Super Admin tenant selection. |
| `POST` | `/api/tenants` | Create a company with `{ "name": "Company A" }`. |
| `GET` | `/api/users/:id/permissions` | Get an Agent's direct project permissions in the selected tenant. |
| `PUT` | `/api/users/:id/permissions` | Replace an Agent's direct permissions with `{ "permissionCodes": ["projects.update"] }`. |

An Agent always receives `projects.read` from its role. Direct permissions are intentionally limited to `projects.create`, `projects.update`, and `projects.delete`; requests for any user-management or role-management permission are rejected.

## Development seed credentials

All development accounts use the password `Password123!`:

- `superadmin@example.com`

These are development-only credentials and must not be used in production.

## Assumptions

- Tenant isolation is enforced by backend authorization. Protected tenant-resource routes derive the scope from the authenticated user, never from a body or query `tenantId` supplied by the client.
- A Super Admin has no tenant and must select one existing tenant with `X-Tenant-Id` for tenant-resource operations; this keeps every tenant query explicitly scoped.
- An Admin may manage only Agents in the Admin’s own tenant, even if the Admin has broad user permissions.
- Agents receive `projects.read` from their role. Extra project permissions are granted through `UserPermission`.
- The current phase includes login, reusable security middleware, tenant-scoped Projects CRUD, tenant-scoped user management, and the React management interface.
