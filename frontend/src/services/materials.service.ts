import { api } from '@/lib/api';

export const materialsService = {
  list: async () => api.get('/materials'),
  listCategories: async () => api.get('/materials/categories'),
};
