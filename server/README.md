# CRM API

Express API for the CRM application with JWT authentication and role-aware access control.

## Setup

1. Create `server/.env`:

```env
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_signup_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
CORS_ORIGIN=http://localhost:2901
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

2. Install dependencies: `npm install`
3. Start the API:
   - Development: `npm run dev`
   - Production: `npm start`

## Auth Endpoints

- `POST /auth/register` Register a user (`rep` or `admin` with admin code)
- `POST /auth/login` Authenticate and return JWT + user profile

## Lead Endpoints

All lead endpoints require `Authorization: Bearer <token>`.

- `GET /leads` List leads (admin sees all, reps see own)
- `POST /leads` Create a lead for the authenticated user
- `POST /leads/:id/contact` Mark lead as contacted and append a contact log entry
- `PUT /leads/:id` Update a lead (admin any lead, rep own lead)
- `DELETE /leads/:id` Delete a lead (admin any lead, rep own lead)
- `GET /leads/search?query=...` Search leads by name or phone
- `POST /reminder/:leadId` Schedule reminder metadata for a lead

## Utility Endpoint

- `GET /health` Returns API status for uptime and deployment checks

## Security and Observability

- Helmet security headers are enabled.
- IP-based rate limiting is enabled (except `/health`).
- Every response includes `X-Request-Id` for easier debugging.
- API errors include `requestId` so logs can be traced quickly.

## Scheduled Job

A daily scheduler checks overdue follow-ups and sends reminder emails for leads with reminder email enabled.

## CORS Configuration

Set `CORS_ORIGIN` to a comma-separated list of allowed frontend origins in production.

Example:

```env
CORS_ORIGIN=https://your-app.vercel.app,https://staging-your-app.vercel.app
```