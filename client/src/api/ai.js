import apiClient from './apiClient';

export const getAIPriority = () =>
  apiClient.post('/ai/priority').then((res) => res.data);
