# CRM Application Features

## Overview

This CRM is a full-stack web application for capturing, managing, and following up on sales leads. It includes role-based access control, reminder workflows, and production-ready deployment configuration.

## Authentication and Access Control

- User registration and login with JWT authentication
- Role support for sales representatives and admins
- Admin sign-up protection using an admin secret
- Persistent login state on frontend refresh
- Protected dashboard route with redirect to login when unauthenticated

## Lead Management

- Create, view, update, and delete leads
- Standard lead fields:
  - Name
  - Phone
  - Email
  - Product or service
  - Status
  - Notes
  - Follow-up date
- Lead status pipeline:
  - New
  - Contacted
  - Quoted
  - Closed

## Search and Filtering

- Search leads by name and phone
- Filter by lead status
- Admin-only filter to view leads by assigned sales rep
- Admin option to view unassigned leads

## Admin Features

- View all leads across users
- Summary of total leads and lead counts by sales rep
- Manage leads across the full organization scope

## Client Communication Tools

- One-click WhatsApp follow-up link generation
- Reminder scheduling for leads
- Email reminder support through SMTP configuration

## Reminder and Follow-up Workflow

- Per-lead reminder settings
- Scheduled backend job for overdue follow-up checks
- Automated reminder email dispatch for eligible leads

## Dashboard and UX

- Separate login page and dashboard route
- Automatic lead refresh on load and at intervals
- Manual refresh action in dashboard
- Detailed lead modal for full client context
- Responsive UI powered by Bootstrap

## Security and Reliability

- CORS allowlist via environment variable
- Security headers via Helmet
- Request rate limiting to reduce abuse
- Request ID attached to responses for traceability
- Health endpoint for uptime checks
- Graceful shutdown handling for server and scheduler

## Deployment Readiness

- Frontend API base URL driven by environment variable
- Backend origin allowlist driven by environment variable
- Compatible with Vercel (frontend) and Render or Railway (backend)
- Environment example files included for client and server setup

## Technology Stack

### Frontend

- React
- React Router
- Axios
- Bootstrap

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT
- Nodemailer
- Node Schedule
