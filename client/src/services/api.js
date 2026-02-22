import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const register = (username, password) =>
  api.post('/auth/register', { username, password });

export const getChannels = () => api.get('/channels');
export const addChannel = data => api.post('/channels', data);
export const deleteChannel = id => api.delete(`/channels/${id}`);

export const sendPost = (message, channelIds) =>
  api.post('/posts/send', { message, channelIds });

export const getHistory = () => api.get('/posts/history');

export default api;
