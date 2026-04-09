# CRM Frontend

React frontend for the CRM dashboard.

## Run

- Install: `npm install`
- Development: `npm start` (runs on `http://localhost:2901`)
- Production build: `npm run build`

## Environment

Create `client/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_SCREENSHOT_MODE=false
```

Screenshot mode is optional and intended for demo/portfolio captures.

## Key Areas

- `src/App.js` Route guards and auth restoration
- `src/components/LoginPage.js` Login and registration
- `src/components/Dashboard.js` Lead table, urgency inbox, filtering, and admin controls
- `src/config/api.js` API base URL configuration

## Notes

- Expects backend API at `http://localhost:4000`
- Authentication token is stored in localStorage and applied to Axios headers
- "Last Contact" uses relative display language in the table (Today, 1 day since contact, N days since contact)
