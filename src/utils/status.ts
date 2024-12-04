import type { OrderType } from '../types/order';

export const getStatusColor = (status: OrderType['status']) => {
  const colors: Record<OrderType['status'], string> = {
    urgent: 'red',
    adding: 'blue',
    preparing: 'processing',
    completed: 'success',
    unpaid: 'warning',
    settled: 'default'
  };
  return colors[status];
};

export const getStatusText = (status: OrderType['status']) => {
  const texts: Record<OrderType['status'], string> = {
    urgent: '加急',
    adding: '加单中',
    preparing: '配货中',
    completed: '已完成',
    unpaid: '待付款',
    settled: '已结算'
  };
  return texts[status];
}; 