import React from 'react';
import { Tabs } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

const SupplyOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 根据当前路径确定激活的 tab
  const getActiveKey = () => {
    if (location.pathname.includes('/detail/')) {
      return 'detail';
    }
    if (location.pathname.includes('/list')) {
      return 'list';
    }
    return 'customers';
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
        // 如果已经在详情页，保持当前 URL
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
      <Tabs activeKey={getActiveKey()} onChange={handleTabChange}>
        <TabPane tab="客户供货单" key="customers" />
        <TabPane tab="供货单列表" key="list" />
        <TabPane tab="供货单详情" key="detail" />
      </Tabs>
      <div style={{ padding: '16px 0' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default SupplyOrders; 