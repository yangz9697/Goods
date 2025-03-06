import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Modal, Form, Input, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  FileTextOutlined,
  LockOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { authApi } from '../../api/auth';
import './index.less';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [form] = Form.useForm();
  const [username] = useState(localStorage.getItem('name') || '');
  const [tenantList, setTenantList] = useState<{ tenant: string; tenantName: string }[]>([]);
  const role = localStorage.getItem('role');
  const currentTenant = localStorage.getItem('tenant');
  const [loading, setLoading] = useState(false);
  const isAdmin = role === 'admin';

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
      children: [
        {
          key: '/dashboard/overview',
          label: '销售概览'
        },
        ...(isAdmin ? [{
          key: '/dashboard/payment',
          label: '付款情况'
        }] : [])
      ]
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
    role === 'admin' || role === 'manager' ? {
      key: '/permissions',
      icon: <LockOutlined />,
      label: '权限管理'
    } : null,
    role === 'admin' ? {
      key: '/tenants',
      icon: <ShopOutlined />,
      label: '门店管理'
    } : null
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  useEffect(() => {
    if (role === 'admin') {
      authApi.getTenantList().then(res => {
        if (res.success) {
          setTenantList(res.data);
        }
      }).catch(error => {
        message.error(error.message);
      });
    }
  }, [role]);

  const handleTenantChange = async (tenant: string) => {
    const accountId = localStorage.getItem('accountId');
    if (!accountId) return;

    try {
      const res = await authApi.updateTenant({
        accountId: parseInt(accountId),
        tenant
      });

      if (res.success) {
        localStorage.setItem('tenant', tenant);
        message.success('切换门店成功');
        window.location.reload();
      } else {
        message.error(res.displayMsg || '切换门店失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accountId');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('tenant');
    localStorage.removeItem('username');
    
    message.success('登出成功');
    navigate('/login');
  };

  const handleChangePassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }

    const accountId = localStorage.getItem('accountId');
    if (!accountId) {
      message.error('登录信息已失效，请重新登录');
      handleLogout();
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.updatePassword({
        accountId: parseInt(accountId),
        password: values.newPassword,
      });

      if (res.success) {
        message.success('密码修改成功，请重新登录');
        setChangePasswordVisible(false);
        handleLogout();
      } else {
        message.error(res.displayMsg || '密码修改失败');
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const userMenuItems: MenuProps = {
    items: [
      role === 'admin' ? {
        key: 'tenant',
        label: '切换门店',
        icon: <ShopOutlined />,
        children: tenantList.map(item => ({
          key: item.tenant,
          label: item.tenantName,
          disabled: item.tenant === currentTenant,
          onClick: () => handleTenantChange(item.tenant)
        }))
      } : null,
      {
        key: 'changePassword',
        label: '修改密码',
        icon: <KeyOutlined />,
        onClick: () => setChangePasswordVisible(true)
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        onClick: handleLogout
      }
    ].filter((item): item is NonNullable<typeof item> => item !== null)
  };

  return (
    <Layout className="app-layout">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
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
        <Header className="app-header">
          <div className="header-left" />
          <div className="header-right">
            <Dropdown 
              menu={userMenuItems} 
              placement="bottomRight"
            >
              <span className="user-info">
                <UserOutlined />
                <span className="username">
                  {username}
                  {role === 'admin' && currentTenant && (
                    <span className="tenant-info">({currentTenant})</span>
                  )}
                </span>
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Modal
        title="修改密码"
        open={changePasswordVisible}
        onOk={(e) => {
          e.preventDefault();
          form.validateFields().then(handleChangePassword);
        }}
        onCancel={() => setChangePasswordVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          onFinish={handleChangePassword}
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[{ required: true, message: '请确认新密码' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AppLayout; 