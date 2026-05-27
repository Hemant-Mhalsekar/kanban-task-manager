import apiClient from './apiClient';

export const getAnalytics = async () => {
  const { data } = await apiClient.get('/analytics');
  return data;
};
