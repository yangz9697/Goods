import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, message } from 'antd';
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card style={{ marginBottom: 16 }}>
        <OrderHeader
          order={order}
          statusList={statusList}
          isAdmin={isAdmin}
          onStatusChange={handleStatusChange}
          onPayStatusChange={handleUpdatePayStatus}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </Card>
      <Card 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          height: '100%'
        }}
        bodyStyle={{
          height: '100%',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '16px'
        }}>
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'all' ? '2px solid #1890ff' : 'none',
              color: activeTab === 'all' ? '#1890ff' : 'inherit'
            }}
            onClick={() => setActiveTab('all')}
          >
            全部
          </div>
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'box' ? '2px solid #1890ff' : 'none',
              color: activeTab === 'box' ? '#1890ff' : 'inherit'
            }}
            onClick={() => setActiveTab('box')}
          >
            大货
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'all' && (
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
          )}
          {activeTab === 'box' && (
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
          )}
        </div>
      </Card>
    </div>
  );
};

export default OrderDetail; 