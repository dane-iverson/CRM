# CRM App

Full-stack CRM application with JWT authentication, role-based lead visibility, urgency inbox workflows, and contact tracking.

## Folder Structure

- `server/` Express + MongoDB API
- `server/models/` Mongoose models
- `client/` React dashboard and auth UI
- `client/src/components/` UI components and modals
- `client/src/config/` shared frontend configuration

## Prerequisites

- Node.js 18+
- MongoDB (Atlas or local)

## Environment Variables

Create `server/.env`:

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
SCREENSHOT_MODE=false
```

Create `client/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_SCREENSHOT_MODE=false
```

## Install

```bash
cd server && npm install
cd ../client && npm install
```

## Run

- Backend: `cd server && npm run dev` (port `4000`)
- Frontend: `cd client && npm start` (port `2901`)

For hosted environments, set `REACT_APP_API_BASE_URL` to your deployed backend URL and set `CORS_ORIGIN` to your frontend URL.

If you enable screenshot mode, set both `SCREENSHOT_MODE=true` (server) and `REACT_APP_SCREENSHOT_MODE=true` (client), then restart both apps.

## Core Features

- JWT login and registration (`rep` and `admin` roles)
- Lead CRUD with role-aware access control
- Admin summary and sales-rep filtering
- Reminder scheduling with email delivery
- Urgency inbox with warning and critical follow-up levels
- Contact logging with relative "Last Contact" display (Today, 1 day since contact, N days since contact)
- WhatsApp quick-contact actions

For backend endpoint details, see `server/README.md`.