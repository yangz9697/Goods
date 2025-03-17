import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Space, Card, Tabs, message } from 'antd';
import { useOrderDetail } from './hooks/useOrderDetail';
import { OrderItemTable } from './components/OrderItemTable';
import { OrderHeader } from '@/pages/SupplyOrders/components/OrderHeader';

const OrderDetail: React.FC = () => {
  const { id: orderNo } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('all');
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const navigate = useNavigate();

  const {
    order,
    statusList,
    deliveryUsers,
    handleAdd,
    handleEdit,
    handleDeleteItem,
    handleStatusChange,
    handleUpdatePayStatus
  } = useOrderDetail(orderNo);

  const handleDeleteSuccess = () => {
    message.success('删除供货单成功');
        navigate('/supply-orders/list');
  };

  if (!order) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
          <Card>
        <OrderHeader
          order={order}
          statusList={statusList}
          isAdmin={isAdmin}
          onStatusChange={handleStatusChange}
          onPayStatusChange={handleUpdatePayStatus}
          onDeleteSuccess={handleDeleteSuccess}
        />
          </Card>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: '全部',
              children: (
                <OrderItemTable
                  type="all"
                  items={order.items.map(item => ({
                    ...item,
                    count: item.count || 0
                  }))}
                  isAdmin={isAdmin}
                  deliveryUsers={deliveryUsers}
                  onEdit={handleEdit}
                  onDelete={handleDeleteItem}
                  onAdd={handleAdd}
                />
              )
            },
            {
              key: 'box',
              label: '大货',
              children: (
                <OrderItemTable
                  type="bulk"
                  items={order.items
                    .filter(item => item.unit === '箱')
                    .map(item => ({
                      ...item,
                      count: item.count || 0
                    }))}
                  isAdmin={isAdmin}
                  deliveryUsers={deliveryUsers}
                  onEdit={handleEdit}
                  onDelete={handleDeleteItem}
                  onAdd={handleAdd}
                />
              )
            }
          ]}
        />
      </Card>
    </Space>
  );
};

export default OrderDetail; 