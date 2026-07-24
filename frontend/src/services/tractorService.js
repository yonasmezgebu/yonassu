import apiClient from './apiClient';

const tractorService = {
  // Public
  getAllPublicTractors: async () => {
    const res = await apiClient.get('/tractors/public');
    return res;
  },

  // Manager
  getAllTractors: async () => {
    const res = await apiClient.get('/tractors');
    return res;
  },

  createTractor: async (formData) => {
    const res = await apiClient.post('/tractors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },

  updateTractor: async (id, formData) => {
    const res = await apiClient.put(`/tractors/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },

  softDeleteTractor: async (id) => {
    const res = await apiClient.delete(`/tractors/${id}`);
    return res;
  },

  restoreTractor: async (id) => {
    const res = await apiClient.patch(`/tractors/${id}/restore`);
    return res;
  },

  hardDeleteTractor: async (id) => {
    const res = await apiClient.delete(`/tractors/${id}/permanent`);
    return res;
  },

  updateAssetValue: async (id, value) => {
    const res = await apiClient.patch(`/tractors/${id}/asset-value`, { asset_value: value });
    return res;
  }
};

export default tractorService;
