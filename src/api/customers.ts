import request from './request';
import type { CustomerType } from '../types/customer';

export interface CustomerQueryParams {
  keyword?: string;
}

export const customersApi = {
  getCustomers: (params: CustomerQueryParams) => 
    request.get('/customers', { params }),
    
  getCustomerById: (id: string) => 
    request.get(`/customers/${id}`),
    
  createCustomer: (data: Partial<CustomerType>) => 
    request.post('/customers', data),
    
  updateCustomer: (id: string, data: Partial<CustomerType>) => 
    request.put(`/customers/${id}`, data),
    
  deleteCustomer: (id: string) => 
    request.delete(`/customers/${id}`)
}; 