import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { OrderType, OrderFilters } from '../types/order';
import { generateOrderNumber } from '../utils/format';

dayjs.extend(isBetween);

export const useOrders = (initialOrders: OrderType[] = []) => {
  const [orders, setOrders] = useState<OrderType[]>(initialOrders);

  const addOrder = useCallback((values: Partial<OrderType>) => {
    const customerOrders = orders.filter(order => 
      order.customerId === values.customerId &&
      dayjs(order.date).isSame(dayjs(), 'day')
    );

    const newOrder: OrderType = {
      id: String(Date.now()),
      orderNumber: generateOrderNumber(
        dayjs().format('YYYYMMDD'),
        values.customerId!,
        customerOrders.length + 1
      ),
      ...values,
      items: [],
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      deliveryStatus: 'preparing',
      status: 'adding',
      deliveryPerson: '张三' // TODO: 使用实际登录用户
    } as OrderType;

    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  }, [orders]);

  const updateOrder = useCallback((id: string, updates: Partial<OrderType>) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, ...updates } : order
    ));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  }, []);

  const toggleUrgent = useCallback((id: string) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, isUrgent: !order.isUrgent } : order
    ));
  }, []);

  const filterOrders = useCallback((filters: OrderFilters) => {
    return orders.filter(order => {
      if (filters.dateRange[0] && filters.dateRange[1]) {
        const orderDate = dayjs(order.date);
        if (!orderDate.isBetween(filters.dateRange[0], filters.dateRange[1], 'day', '[]')) {
          return false;
        }
      }

      if (filters.searchText && !order.customerName.includes(filters.searchText)) {
        return false;
      }

      if (filters.searchPhone && order.customerPhone.replace(/\D/g, '') !== filters.searchPhone) {
        return false;
      }

      return true;
    });
  }, [orders]);

  return {
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    toggleUrgent,
    filterOrders
  };
}; 