import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Space, Card, Tabs, Spin, message } from 'antd';
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
    loading,
    order,
    statusList,
    deliveryUsers,
    fetchOrderDetail,
    handleAdd,
    handleEdit,
    handleDeleteItem,
    handleStatusChange,
    handleUpdatePayStatus
  } = useOrderDetail(orderNo);

  useEffect(() => {
    if (orderNo) {
      fetchOrderDetail();
    }
  }, [orderNo, fetchOrderDetail]);

  const handleDeleteSuccess = () => {
    message.success('删除供货单成功');
    navigate('/supply-orders/list');  // 删除成功后返回列表页
  };

  if (loading || !order) {
    return <Spin size="large" />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <OrderHeader 
        order={order}
        statusList={statusList}
        isAdmin={isAdmin}
        onStatusChange={handleStatusChange}
        onPayStatusChange={handleUpdatePayStatus}
        onDeleteSuccess={handleDeleteSuccess}
      />
      
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
                  items={order.items}
                  isAdmin={isAdmin}
                  deliveryUsers={deliveryUsers}
                  onEdit={handleEdit}
                  onDelete={handleDeleteItem}
                  onAdd={handleAdd}
                />
              )
            },
            {
              key: 'bulk',
              label: '大货',
              children: (
                <OrderItemTable
                  type="bulk"
                  items={order.items.filter(item => item.unit === '箱')}
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