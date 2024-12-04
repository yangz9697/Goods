import React from 'react';
import { Card, Space, Button, Typography, Tag } from 'antd';
import dayjs from 'dayjs';
import type { CustomerType } from '../../types/customer';
import type { OrderType } from '../../types/order';
import { formatPhone } from '../../utils/format';
import { getStatusColor, getStatusText } from '../../utils/status';

const { Title } = Typography;

interface CustomerCardProps {
  customer: CustomerType;
  orders: OrderType[];
  onAddOrder: (customerId: string) => void;
  onToggleUrgent: (orderId: string) => void;
  onOrderClick: (order: OrderType) => void;
  onCardClick: (customer: CustomerType) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  orders,
  onAddOrder,
  onToggleUrgent,
  onOrderClick,
  onCardClick
}) => {
  const todayOrders = orders.filter(order => 
    dayjs(order.date).isSame(dayjs(), 'day') && 
    order.customerId === customer.id
  );

  return (
    <Card
      hoverable
      style={{ 
        opacity: todayOrders.length ? 1 : 0.5,
        cursor: 'pointer'
      }}
      onClick={() => onCardClick(customer)}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={5}>{customer.name}</Title>
          <div>{formatPhone(customer.phone)}</div>
        </div>
        <Space className="card-actions">
          <Button type="primary" onClick={(e) => {
            e.stopPropagation();
            onAddOrder(customer.id);
          }}>
            新建订单
          </Button>
        </Space>
        <div className="order-list">
          {todayOrders.slice(0, 2).map(order => (
            <div
              key={order.id}
              onClick={(e) => {
                e.stopPropagation();
                onOrderClick(order);
              }}
              style={{ cursor: 'pointer', padding: '8px 0' }}
            >
              <Space size="middle">
                <span>单号: {order.orderNumber}</span>
                <Tag color={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Tag>
                {order.remark && <span>{order.remark}</span>}
                <Button
                  size="small"
                  type={order.isUrgent ? 'primary' : 'default'}
                  danger={order.isUrgent}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleUrgent(order.id);
                  }}
                >
                  {order.isUrgent ? '取消加急' : '加急'}
                </Button>
              </Space>
            </div>
          ))}
          {todayOrders.length > 2 && <div>...</div>}
        </div>
      </Space>
    </Card>
  );
}; 