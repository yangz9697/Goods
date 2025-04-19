import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Button } from 'antd';
import { useOrderDetail } from './hooks/useOrderDetail';
import { OrderItemTable, OrderItemTableRef } from './components/OrderItemTable';
import { OrderHeader } from '@/pages/SupplyOrders/components/OrderHeader';

const OrderDetail: React.FC = () => {
  const { id: orderNo } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('all');
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const navigate = useNavigate();
  const [weight, setWeight] = useState<string>('0');
  const tableRef = useRef<OrderItemTableRef>(null);

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

  const handleJumpToLastDelivery = () => {
    if (tableRef.current) {
      tableRef.current.scrollToLastDeliveryItem();
    }
  };

  if (!order) {
    return null;
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fff'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <OrderHeader
          order={order}
          statusList={statusList}
          isAdmin={isAdmin}
          onStatusChange={handleStatusChange}
          onPayStatusChange={handleUpdatePayStatus}
          onDeleteSuccess={handleDeleteSuccess}
          onWeightChange={setWeight}
        />
      </div>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        height: '100%',
        background: '#fff',
        borderRadius: '4px',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #f0f0f0',
          padding: '0 16px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: activeTab === 'all' ? '2px solid #1890ff' : 'none',
                color: activeTab === 'all' ? '#1890ff' : 'inherit',
                marginBottom: '-1px'
              }}
              onClick={() => setActiveTab('all')}
            >
              全部
            </div>
            <div
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: activeTab === 'box' ? '2px solid #1890ff' : 'none',
                color: activeTab === 'box' ? '#1890ff' : 'inherit',
                marginBottom: '-1px'
              }}
              onClick={() => setActiveTab('box')}
            >
              大货
            </div>
          </div>
          <Button type="primary" onClick={handleJumpToLastDelivery}>
            跳转
          </Button>
        </div>
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          margin: '16px'
        }}>
          {activeTab === 'all' && (
            <OrderItemTable
              ref={tableRef}
              type="all"
              items={order.items.map(item => ({
                ...item,
                count: item.count || 0
              }))}
              isAdmin={isAdmin}
              deliveryUsers={deliveryUsers}
              weight={weight}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
              onAdd={handleAdd}
            />
          )}
          {activeTab === 'box' && (
            <OrderItemTable
              ref={tableRef}
              type="bulk"
              items={order.items
                .filter(item => item.unit === '箱')
                .map(item => ({
                  ...item,
                  count: item.count || 0
                }))}
              isAdmin={isAdmin}
              deliveryUsers={deliveryUsers}
              weight={weight}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
              onAdd={handleAdd}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 