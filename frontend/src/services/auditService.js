import apiClient from './apiClient';

const auditService = {
  getLogs: async (params) => {
    return apiClient.get('/audit-logs', { params });
  }
};

export default auditService;
