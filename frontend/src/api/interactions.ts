import { createApiClient } from './client';

const client = createApiClient();

export const favoriteApi = {
  add: async (type: 'skill' | 'prompt', id: string) => {
    const response = await client.post(`/favorites/${type}/${id}`);
    return response.data;
  },

  remove: async (type: 'skill' | 'prompt', id: string) => {
    const response = await client.delete(`/favorites/${type}/${id}`);
    return response.data;
  },

  check: async (type: 'skill' | 'prompt', id: string) => {
    const response = await client.get(`/favorites/${type}/${id}/check`);
    return response.data;
  },

  getFavorites: async (type: 'skills' | 'prompts') => {
    const response = await client.get(`/favorites/${type}`);
    return response.data;
  }
};

export const likeApi = {
  toggle: async (type: 'skill' | 'prompt', id: string) => {
    const response = await client.post(`/likes/${type}/${id}/toggle`);
    return response.data;
  },

  check: async (type: 'skill' | 'prompt', id: string) => {
    const response = await client.get(`/likes/${type}/${id}/check`);
    return response.data;
  },

  getLikes: async (type: 'skills' | 'prompts') => {
    const response = await client.get(`/likes/${type}`);
    return response.data;
  }
};

export const commentApi = {
  getComments: async (type: 'skill' | 'prompt', id: string) => {
    const response = await client.get(`/comments/${type}/${id}`);
    return response.data;
  },

  createComment: async (type: 'skill' | 'prompt', id: string, content: string, parentId?: string) => {
    const response = await client.post(`/comments/${type}/${id}`, { content, parentId });
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await client.delete(`/comments/${commentId}`);
    return response.data;
  }
};
