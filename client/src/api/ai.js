import apiClient from './apiClient';

export const getAIPriority = () =>
  apiClient.post('/ai/priority').then((res) => res.data);

export const getAIFocus = () =>
  apiClient.post('/ai/focus').then((res) => res.data);
