import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * All API calls go through this client so the base URL is defined once.
 * The Vite dev server proxy forwards /api/* → http://localhost:5000/api/*
 */
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
