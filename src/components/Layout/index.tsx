import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  LockOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页'
    },
    {
      key: '/inventory',
      icon: <ShoppingOutlined />,
      label: '库存管理'
    },
    {
      key: '/pricing',
      icon: <DollarOutlined />,
      label: '价格管理'
    },
    {
      key: '/customers',
      icon: <TeamOutlined />,
      label: '客户信息'
    },
    {
      key: '/supply-orders',
      icon: <FileTextOutlined />,
      label: '供货单列表'
    },
    {
      key: '/permissions',
      icon: <LockOutlined />,
      label: '权限管理'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px' }}>
          仓库管理系统
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }} />
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 