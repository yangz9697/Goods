import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Modal, Form, Input, message, Button, Space, Avatar } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  ShopOutlined,
  DatabaseOutlined,
  PayCircleOutlined,
  ShoppingCartOutlined,
  SafetyCertificateOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { authApi } from '../../api/auth';
import './index.less';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = AntLayout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [form] = Form.useForm();
  const [username] = useState(localStorage.getItem('name') || '');
  const [tenantName, setTenantName] = useState(localStorage.getItem('tenant_name') || '');
  const role = localStorage.getItem('role');
  const currentTenant = localStorage.getItem('tenant');
  const [loading, setLoading] = useState(false);
  const [tenantList, setTenantList] = useState<{ tenant: string; tenantName: string }[]>([]);

  const menuItems = [
    role === 'admin' && {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
      children: [
        {
          key: '/dashboard/overview',
          label: '销售概览'
        },
        {
          key: '/dashboard/payment',
          label: '付款情况'
        }
      ].filter(Boolean) as Required<MenuProps>['items']
    },
    (role === 'admin' || role === 'manager' || role === 'managerLeader') && {
      key: '/inventory',
      icon: <DatabaseOutlined />,
      label: '库存管理'
    },
    (role === 'admin' || role === 'manager' || role === 'managerLeader') && {
      key: '/pricing',
      icon: <PayCircleOutlined />,
      label: '价格管理'
    },
    (role === 'admin' || role === 'managerLeader') && {
      key: '/customers',
      icon: <TeamOutlined />,
      label: '客户管理'
    },
    {
      key: '/supply-orders',
      icon: <ShoppingCartOutlined />,
      label: '供货单'
    },
    role === 'admin' && {
      key: '/permissions',
      icon: <SafetyCertificateOutlined />,
      label: '权限管理'
    },
    role === 'admin' && {
      key: '/tenants',
      icon: <ShopOutlined />,
      label: '门店管理'
    }
  ].filter(Boolean) as Required<MenuProps>['items'];

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
        const selectedTenant = tenantList.find(item => item.tenant === tenant);
        if (selectedTenant) {
          localStorage.setItem('tenant', tenant);
          localStorage.setItem('tenant_name', selectedTenant.tenantName);
          setTenantName(selectedTenant.tenantName);
        }
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

  const userMenuItems = {
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
    ].filter(Boolean) as Required<MenuProps>['items']
  };

  return (
    <AntLayout style={{ height: '100vh' }}>
      {role !== 'employee' && (
        <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#fff', filter: 'drop-shadow(0px 0px 12px rgba(68, 62, 132, 0.12))' }}>
          <div style={{ height: '65px', display: 'flex', alignItems: 'center', paddingLeft: '24px', borderBottom: '1px solid #F4F6FA' }}>
            <img src="/assets/logo.png" alt="logo" style={{ width: '22px', height: '19px', marginRight: '12px' }} />
            <div style={{ color: '#35324D', fontWeight: 'bold', fontSize: '20px' }}>仓库管理系统</div>
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
          <img src="/assets/comi.png" alt="decoration" style={{ width: '100%', height: 'auto', position: 'absolute', bottom: '20px' }} />
        </Sider>
      )}
      <AntLayout>
        <Header style={{ padding: 0, background: '#fff', display: 'flex', alignItems: 'center' }}>
          {role !== 'employee' && (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          )}
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              fontSize: '16px',
              height: 64,
            }}
          >
            返回上一页
          </Button>
          <div style={{ flex: 1 }} />
          <Space style={{ marginRight: 16 }}>
            <span>{tenantName}</span>
            <Dropdown menu={userMenuItems}>
              <Space>
                <Avatar icon={<UserOutlined />} />
                <span>{username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            padding: 24,
            minHeight: 280,
            overflow: 'auto',
            // backgroundColor: '#ffffff'
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>

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
    </AntLayout>
  );
};

export default AppLayout; 