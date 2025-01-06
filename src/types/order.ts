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
  status: string;
  date: string;
  createTime: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
  remark: string;
  isUrgent: boolean;
  deliveryStatus: string;
  deliveryPerson: string;
  updateTime: number;
}

export interface OrderFilters {
  dateRange: [Dayjs | null, Dayjs | null];
  searchText: string;
  searchPhone: string;
} 