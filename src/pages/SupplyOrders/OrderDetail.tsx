import React, { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message, Button, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useOrderDetail } from './hooks/useOrderDetail';
import { OrderItemTable, OrderItemTableRef } from './components/OrderItemTable';
import { OrderHeader } from '@/pages/SupplyOrders/components/OrderHeader';

const OrderDetail: React.FC = () => {
  const { id: orderNo } = useParams<{ id: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as 'all' | 'small' | 'box' | null) || 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'small' | 'box'>(initialTab);
  const [searchKeyword, setSearchKeyword] = useState('');
  const role = localStorage.getItem('role') || undefined;
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

  // 过滤货品列表
  const filteredItems = useMemo(() => {
    if (!order?.items) return [];
    
    if (!searchKeyword.trim()) {
      return order.items;
    }
    
    return order.items.filter(item => 
      item.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [order?.items, searchKeyword]);

  // 计算大货的实际数量总和
  const bulkItemsTotalCount = useMemo(() => {
    return filteredItems
      .filter(item => item.unit === '箱')
      .reduce((sum, item) => sum + (item.count || 0), 0);
  }, [filteredItems]);

  if (!order) {
    return null;
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
    }}>
      <div style={{ marginBottom: '12px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  borderBottom: activeTab === 'small' ? '2px solid #1890ff' : 'none',
                  color: activeTab === 'small' ? '#1890ff' : 'inherit',
                  marginBottom: '-1px'
                }}
                onClick={() => setActiveTab('small')}
              >
                小货
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
            <div style={{ marginLeft: '24px' }}>
              <Input
                placeholder="搜索货品名称"
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
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
              items={filteredItems.map(item => ({
                ...item,
                count: item.count || 0
              }))}
              isAdmin={isAdmin}
              role={role}
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
              items={filteredItems
                .filter(item => item.unit === '箱')
                .map(item => ({
                  ...item,
                  count: item.count || 0
                }))}
              isAdmin={isAdmin}
              role={role}
              deliveryUsers={deliveryUsers}
              weight={weight}
              totalCount={bulkItemsTotalCount}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
              onAdd={handleAdd}
            />
          )}
          {activeTab === 'small' && (
            <OrderItemTable
              ref={tableRef}
              type="small"
              items={filteredItems
                .filter(item => item.unit !== '箱')
                .map(item => ({
                  ...item,
                  count: item.count || 0
                }))}
              isAdmin={isAdmin}
              role={role}
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