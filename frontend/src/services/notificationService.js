import apiClient from './apiClient';

const notificationService = {
  // Generic notifications (dashboard bell)
  getNotifications: async (params = {}) => {
    return await apiClient.get('/notifications', { params });
  },

  markAsRead: async (id, source) => {
    return await apiClient.put(`/notifications/${id}/read`, { source });
  },

  // News-based public notifications
  getMyNotifications: async (filter = '') => {
    const params = filter ? `?filter=${filter}` : '';
    const res = await apiClient.get(`/news/notifications${params}`);
    if (res.status === 'success') {
      return {
        ...res,
        data: res.data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.content ? n.content.replace(/<[^>]*>/g, '').slice(0, 120) : '',
          createdAt: n.created_at,
          isRead: n.is_read,
          _type: n.type,
          newsPostId: n.news_post_id,
          hiringPosition: n.hiring_position,
          hiringDeadline: n.hiring_deadline,
          hiringEmail: n.hiring_email,
          youtubeUrl: n.youtube_url,
        })),
      };
    }
    return res;
  },

  getUnreadCount: async () => {
    const res = await apiClient.get('/news/notifications/unread-count');
    return res;
  },

  markAllAsRead: async () => {
    return await apiClient.put('/notifications/read-all');
  },

  // V2 notification endpoints (used by DashboardLayout bell)
  getMyNotificationsV2: async () => {
    const res = await apiClient.get('/notifications/v2');
    return res.data;
  },

  markAsReadV2: async (id) => {
    const res = await apiClient.patch(`/notifications/v2/${id}/read`);
    return res.data;
  },

  markAllAsReadV2: async () => {
    const res = await apiClient.patch('/notifications/v2/mark-all-read');
    return res.data;
  },

  // System-level notifications
  getSystemNotifications: async () => {
    const res = await apiClient.get('/notifications');
    return res;
  },

  markSystemAsRead: async (id) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res;
  },
};

export default notificationService;
