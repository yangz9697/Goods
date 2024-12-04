import type { Dayjs } from 'dayjs';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'box' | 'jin' | 'piece';
  deliveryPerson?: string;
  remark?: string;
}

export interface OrderType {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  status: 'urgent' | 'adding' | 'preparing' | 'completed' | 'unpaid' | 'settled';
  remark?: string;
  isUrgent?: boolean;
  items: OrderItem[];
  createTime: string;
  deliveryStatus: 'preparing' | 'adding' | 'checking' | 'completed' | 'settled';
  deliveryPerson: string;
}

export interface OrderFilters {
  dateRange: [Dayjs | null, Dayjs | null];
  searchText: string;
  searchPhone: string;
} 