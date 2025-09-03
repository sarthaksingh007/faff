import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const createUser = (user) => axios.post(`${API_BASE}/users`, user).then(r => r.data);
export const signup = (payload) => axios.post(`${API_BASE}/auth/signup`, payload).then(r => r.data);
export const login = (payload) => axios.post(`${API_BASE}/auth/login`, payload).then(r => r.data);
export const sendMessageREST = (payload) => axios.post(`${API_BASE}/messages`, payload).then(r => r.data);
export const fetchMessages = (userId, limit = 100) => axios.get(`${API_BASE}/messages`, { params: { userId, limit } }).then(r => r.data);
export const fetchUsers = () =>axios.get(`${API_BASE}/users`).then((r) => r.data);
export const fetchSemanticSearch = (userId, q, top = 10) =>
    axios.get(`${API_BASE}/semantic-search`, { params: { userId, q, top } }).then(r => r.data);
  