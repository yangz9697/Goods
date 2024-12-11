import request from './request';
import type { InventoryItem } from '../types/inventory';

export interface InventoryQueryParams {
  keyword?: string;
  category?: string;
}

export const inventoryApi = {
  getInventory: (params: InventoryQueryParams) => 
    request.get('/inventory', { params }),
    
  getItemById: (id: string) => 
    request.get(`/inventory/${id}`),
    
  createItem: (data: Partial<InventoryItem>) => 
    request.post('/inventory', data),
    
  updateItem: (id: string, data: Partial<InventoryItem>) => 
    request.put(`/inventory/${id}`, data),
    
  deleteItem: (id: string) => 
    request.delete(`/inventory/${id}`)
}; 