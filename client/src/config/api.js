const rawApiBase =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export const API_BASE = rawApiBase.replace(/\/$/, "");
