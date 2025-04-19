import type { Dayjs } from 'dayjs';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  unitPrice: number;
  remark: string;
  deliveryName: string | undefined;
  objectDetailId: number;
  totalPrice?: number;
  orderNo: string;
  userName: string;
  mobile: string;
  orderStatusCode: OrderStatusCode;
  orderStatusName: string;
  createTime: number;
  updateTime: number;
}

export interface NewOrderItem extends OrderItem {
  selectedObjectId?: number;
  inventory?: number;
}

export interface ObjectOption {
  objectDetailId: number;
  objectDetailName: string;
}

export enum OrderStatusCode {
  WAIT = 'wait',
  READY = 'ready',
  END = 'end'
}

export const OrderStatusMap: Record<OrderStatusCode, string> = {
  [OrderStatusCode.WAIT]: '待配货',
  [OrderStatusCode.READY]: '配货中',
  [OrderStatusCode.END]: '已完成'
};

export interface OrderStatus {
  orderStatusCode: OrderStatusCode;
  orderStatusName: string;
}

export interface Order {
  id: string;
  orderNo: string;
  date: string;
  createTime: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatusCode;
  statusName: string;
  payStatusName: string;
  payStatus: 'waitPay' | 'paySuccess';
  remark: string;
  items: OrderDetailItem[];
  totalPrice: number;
  deliveryCount: number;
  totalObjectCount: number;
}

export interface OrderDetailItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  unitPrice: number;
  remark: string;
  deliveryName: string;
  objectDetailId: number;
  totalPrice: number;
  orderNo: string;
  userName: string;
  mobile: string;
  orderStatusCode: OrderStatusCode;
  orderStatusName: string;
  createTime: number;
  updateTime: number;
  planCount?: number;
  remarkCount?: string;
  count: number;
  jinPerBox?: number;
}

export interface OrderInfo {
  orderSupplyDate: string;
  orderNo: string;
  orderStatus: OrderStatusCode;
  orderStatusName: string;
  remark: string;
  userId: number;
  userName: string;
  userMobile: string;
  createTime: string;
  isUrgent: boolean;
  updateTime: number;
  deliveryCount: number;
  totalObjectCount: number;
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

export interface TableOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  unitPrice: number;
  remark: string;
  deliveryName?: string;
  objectDetailId: number;
  totalPrice?: number;
  inventory?: number;
  orderNo?: string;
  userName?: string;
  mobile?: string;
  orderStatusCode?: string;
  orderStatusName?: string;
  createTime?: number;
  updateTime?: number;
} 