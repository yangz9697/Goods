import React from 'react';
import { Tabs } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const SupplyOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  console.log('SupplyOrders render, location:', location.pathname);

  const getActiveKey = () => {
    const key = location.pathname.includes('/detail/') ? 'detail' 
      : location.pathname.includes('/list') ? 'list' 
      : 'customers';
    console.log('Active tab key:', key);
    return key;
  };

  const handleTabChange = (key: string) => {
    switch (key) {
      case 'customers':
        navigate('/supply-orders');
        break;
      case 'list':
        navigate('/supply-orders/list');
        break;
      case 'detail':
        if (!location.pathname.includes('/detail/')) {
          navigate('/supply-orders/list');
        }
        break;
      default:
        navigate('/supply-orders');
    }
  };

  return (
    <div>
      <Tabs 
        activeKey={getActiveKey()} 
        onChange={handleTabChange}
        items={[
          {
            key: 'customers',
            label: '客户供货单'
          },
          {
            key: 'list',
            label: '供货单列表'
          },
          {
            key: 'detail',
            label: '供货单详情'
          }
        ]}
      />
      <div style={{ padding: '16px 0' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default SupplyOrders; 