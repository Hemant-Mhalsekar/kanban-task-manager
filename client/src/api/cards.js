import apiClient from './apiClient';

export const getCards = () =>
  apiClient.get('/cards').then((res) => res.data);

export const createCard = (data) =>
  apiClient.post('/cards', data).then((res) => res.data);

export const updateCard = (id, data) =>
  apiClient.put(`/cards/${id}`, data).then((res) => res.data);

export const deleteCard = (id) =>
  apiClient.delete(`/cards/${id}`).then((res) => res.data);
