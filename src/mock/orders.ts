import type { OrderType } from '../types/order';

export const mockOrders: OrderType[] = [
  {
    id: '1',
    orderNumber: '20240314001',
    customerId: '1',
    customerName: '张三',
    customerPhone: '13800138000',
    date: '2024-03-14',
    status: 'preparing',
    remark: '加急订单',
    isUrgent: true,
    items: [],
    createTime: '2024-03-14 10:00:00',
    deliveryStatus: 'preparing',
    deliveryPerson: '张三'
  }
]; 