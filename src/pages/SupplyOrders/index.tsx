import React, { useState, useEffect } from 'react';
import { Tabs, Empty, Row, Col, Modal, AutoComplete } from 'antd';
import { CustomerCard } from '../../components/SupplyOrders/CustomerCard';
import { OrderList } from '../../components/SupplyOrders/OrderList';
import { OrderDetail } from '../../components/SupplyOrders/OrderDetail';
import { OrderModal } from '../../components/SupplyOrders/OrderModal';
import { useOrders } from '../../hooks/useOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useScaleData } from '../../hooks/useScaleData';
import type { OrderType, OrderFilters } from '../../types/order';
import type { CustomerType } from '../../types/customer';
import { mockOrders } from '../../mock/orders';
import { mockCustomers } from '../../mock/customers';

const SupplyOrders: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<string>('list');
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    dateRange: [null, null],
    searchText: '',
    searchPhone: ''
  });
  const [searchResults, setSearchResults] = useState<CustomerType[]>([]);

  // 自定义 hooks
  const { orders, addOrder, updateOrder, deleteOrder, toggleUrgent, filterOrders } = useOrders(mockOrders);
  const { searchCustomers } = useCustomers(mockCustomers);
  const { scaleWeight, startListening: _startListening, stopListening: _stopListening } = useScaleData();

  // 处理函数
  const handleAddOrder = (values: any) => {
    const newOrder = addOrder(values);
    setSelectedOrder(newOrder);
    setActiveTab('detail');
    setAddModalVisible(false);
  };

  const handleOrderEdit = (order: OrderType) => {
    setSelectedOrder(order);
    setActiveTab('detail');
  };

  const handleOrderDelete = (id: string) => {
    deleteOrder(id);
    if (selectedOrder?.id === id) {
      setSelectedOrder(null);
      setActiveTab('list');
    }
  };

  const handlePrint = async (orderIds: string[]) => {
    // TODO: 实现打印功能
    console.log('打印订单:', orderIds);
  };

  const handleExport = async (orderIds: string[]) => {
    // TODO: 实现导出功能
    console.log('导出订单:', orderIds);
  };

  const handleItemChange = (orderId: string, itemId: string, updates: Partial<OrderType>) => {
    updateOrder(orderId, { items: selectedOrder?.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    )});
  };

  const handleItemDelete = (orderId: string, itemId: string) => {
    updateOrder(orderId, { items: selectedOrder?.items.filter(item => 
      item.id !== itemId
    )});
  };

  const handleItemAdd = (orderId: string) => {
    updateOrder(orderId, { items: [...(selectedOrder?.items || []), {
      id: String(Date.now()),
      name: '',
      quantity: 0,
      unit: 'jin'
    }]});
  };

  // 在组件中添加 useEffect 来处理电子秤监听
  useEffect(() => {
    if (activeTab === 'detail') {
      _startListening();
      return () => _stopListening();
    }
  }, [activeTab, _startListening, _stopListening]);

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: '供货单列表',
            children: (
              <Row gutter={[16, 16]}>
                {mockCustomers.map((customer: CustomerType) => (
                  <Col key={customer.id} xs={24} sm={12} md={8} lg={6}>
                    <CustomerCard
                      customer={customer}
                      orders={orders}
                      onAddOrder={(customerId) => {
                        const customer = mockCustomers.find(c => c.id === customerId) || null;
                        setSelectedCustomer(customer);
                        setAddModalVisible(true);
                      }}
                      onToggleUrgent={toggleUrgent}
                      onOrderClick={handleOrderEdit}
                      onCardClick={(customer) => {
                        setSelectedCustomer(customer);
                        setOrderDetailModalVisible(true);
                      }}
                    />
                  </Col>
                ))}
              </Row>
            )
          },
          {
            key: 'detail',
            label: '供货单详情',
            children: selectedOrder ? (
              <OrderDetail
                order={selectedOrder}
                scaleWeight={scaleWeight}
                onBack={() => {
                  setActiveTab('list');
                  setSelectedOrder(null);
                }}
                onDelete={handleOrderDelete}
                onPrint={(id) => handlePrint([id])}
                onExport={(id) => handleExport([id])}
                onOrderChange={(id, updates) => updateOrder(id, updates)}
                onItemChange={handleItemChange}
                onItemDelete={handleItemDelete}
                onItemAdd={handleItemAdd}
              />
            ) : (
              <Empty description="请选择一个供货单查看详情" />
            )
          }
        ]}
      />

      {/* 供货单列表弹窗 */}
      <Modal
        title={`${selectedCustomer?.name || ''}的供货单列表`}
        visible={orderDetailModalVisible}
        onCancel={() => setOrderDetailModalVisible(false)}
        width={1000}
        footer={null}
      >
        <OrderList
          orders={filterOrders(filters)}
          selectedOrders={selectedOrders}
          filters={filters}
          onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
          onOrderSelect={setSelectedOrders}
          onOrderEdit={(order) => {
            handleOrderEdit(order);
            setOrderDetailModalVisible(false);
          }}
          onOrderDelete={handleOrderDelete}
          onAddOrder={() => setAddModalVisible(true)}
          onPrint={handlePrint}
          onExport={handleExport}
        />
      </Modal>

      <OrderModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSubmit={handleAddOrder}
        selectedCustomer={selectedCustomer}
      >
        <AutoComplete
          disabled={!!selectedCustomer}
          placeholder="搜索客户姓名或手机号"
          onSearch={(value) => {
            const matchedCustomers = searchCustomers(value);
            setSearchResults(matchedCustomers);
          }}
          options={searchResults.map(customer => ({
            value: customer.id,
            label: `${customer.name} (${customer.phone})`
          }))}
          onChange={(value) => {
            const customer = searchResults.find(c => c.id === value);
            if (customer) {
              setSelectedCustomer(customer);
            }
          }}
        />
      </OrderModal>
    </div>
  );
};

export default SupplyOrders; 