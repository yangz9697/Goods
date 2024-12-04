import { useState, useCallback } from 'react';
import type { CustomerType } from '../types/customer';

export const useCustomers = (initialCustomers: CustomerType[] = []) => {
  const [customers] = useState<CustomerType[]>(initialCustomers);

  const searchCustomers = useCallback((keyword: string) => {
    return customers.filter(customer => 
      customer.name.includes(keyword) || 
      customer.phone.includes(keyword)
    );
  }, [customers]);

  return {
    customers,
    searchCustomers
  };
}; 