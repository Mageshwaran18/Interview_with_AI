import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // FastAPI backend
});

// Signup API
export const signupUser = (data) => {
  return api.post("/auth/signup", data);
};

// Signin API
export const signinUser = (data) => {
  return api.post("/auth/signin", data);
};

// Protected route
export const getCurrentUser = (token) => {
  return api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/*
Why create axios instance?

- Centralized baseURL
- Reusable API configuration
- Cleaner architecture
*/