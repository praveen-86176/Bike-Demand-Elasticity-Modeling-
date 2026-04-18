import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

export const trainModel = (csvFile) => {
  const formData = new FormData();
  formData.append('file', csvFile);
  return api.post('/train', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const predict = (features) => api.post('/predict', features);
export const getRuns  = ()       => api.get('/runs');
export const getRun   = (id)     => api.get(`/runs/${id}`);
export const health   = ()       => api.get('/health');

export default api;
