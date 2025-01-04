import React, { useState, useEffect } from 'react';
import { Space, Tabs } from 'antd';
import { useNavigate, useLocation, useSearchParams, Outlet } from 'react-router-dom';

const SupplyOrders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [customerName, setCustomerName] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');

  useEffect(() => {
    const name = searchParams.get('name');
    const date = searchParams.get('date');
    const pathSegments = location.pathname.split('/');
    const lastSegment = pathSegments.pop();

    if (name) setCustomerName(name);
    if (date) setSelectedDate(date);

    if (lastSegment) {
      if (location.pathname.includes('/supply-orders/customer/')) {
        setCustomerId(lastSegment);
      } else if (location.pathname.includes('/supply-orders/order/')) {
        setOrderNo(lastSegment);
      }
    }
  }, [location.pathname, location.search]);

  const getActiveKey = () => {
    if (location.pathname === '/supply-orders') {
      return 'list';
    }
    if (location.pathname.includes('/supply-orders/customer/')) {
      return 'customer';
    }
    if (location.pathname.includes('/supply-orders/order/')) {
      return 'order';
    }
    return 'list';
  };

  const getTabLabel = (key: string) => {
    switch (key) {
      case 'list':
        return '供货单列表';
      case 'customer':
        return customerName ? `${customerName}的供货单 (${selectedDate})` : '客户供货单';
      case 'order':
        return orderNo ? `供货单详情 (${orderNo})` : '供货单详情';
      default:
        return '';
    }
  };

  const items = [
    {
      key: 'list',
      label: getTabLabel('list'),
    },
    {
      key: 'customer',
      label: getTabLabel('customer'),
    },
    {
      key: 'order',
      label: getTabLabel('order'),
    }
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%', display: 'flex' }}>
      <Tabs
        activeKey={getActiveKey()}
        items={items}
        onChange={(key) => {
          if (key === 'list') {
            navigate('/supply-orders');
          } else if (key === 'customer' && customerName && selectedDate && customerId) {
            navigate(`/supply-orders/customer/${customerId}?name=${encodeURIComponent(customerName)}&date=${selectedDate}`);
          } else if (key === 'order' && orderNo) {
            navigate(`/supply-orders/order/${orderNo}`);
          }
        }}
      />
      <Outlet />
    </Space>
  );
};

export default SupplyOrders; 