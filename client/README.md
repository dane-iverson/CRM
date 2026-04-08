# CRM Frontend

React frontend for the CRM dashboard.

## Run

- Install: `npm install`
- Development: `npm start` (runs on `http://localhost:2901`)
- Production build: `npm run build`

## Key Areas

- `src/App.js` Route guards and auth restoration
- `src/components/LoginPage.js` Login and registration
- `src/components/Dashboard.js` Lead table, filtering, and admin controls
- `src/config/api.js` API base URL configuration

## Notes

- Expects backend API at `http://localhost:4000`
- Authentication token is stored in localStorage and applied to Axios headers
