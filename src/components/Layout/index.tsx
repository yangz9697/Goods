import React, { useState } from 'react';
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
  KeyOutlined
} from '@ant-design/icons';
import { authApi } from '../../api/auth';
import './index.less';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [form] = Form.useForm();
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

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

  const handleLogout = () => {
    localStorage.removeItem('accountId');
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
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="changePassword" onClick={() => setChangePasswordVisible(true)} icon={<KeyOutlined />}>
        修改密码
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
        退出登录
      </Menu.Item>
    </Menu>
  );

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
            <Dropdown overlay={userMenu} placement="bottomRight">
              <span className="user-info">
                <UserOutlined />
                <span className="username">{username}</span>
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
        visible={changePasswordVisible}
        onCancel={() => setChangePasswordVisible(false)}
        onOk={() => form.submit()}
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