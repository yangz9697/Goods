import React, { useMemo } from 'react';
import { Tabs } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const SupplyOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 使用 useMemo 缓存 activeKey 的计算结果
  const activeKey = useMemo(() => {
    const key = location.pathname.includes('/detail/') ? 'detail' 
      : location.pathname.includes('/list') ? 'list' 
      : 'customers';
    return key;
  }, [location.pathname]);

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

  // 使用 useMemo 缓存 tabs 配置
  const tabItems = useMemo(() => [
    {
      key: 'customers',
      label: '供货单首页'
    },
    {
      key: 'list',
      label: '供货单列表'
    },
    {
      key: 'detail',
      label: '供货单详情'
    }
  ], []);

  return (
    <div>
      <Tabs 
        activeKey={activeKey}
        onChange={handleTabChange}
        items={tabItems}
      />
      <div style={{ padding: '16px 0' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default SupplyOrders; 