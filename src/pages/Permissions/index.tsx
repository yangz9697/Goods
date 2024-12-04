import React from 'react';
import { Table, Button, Space, Tag } from 'antd';

const Permissions: React.FC = () => {
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'green'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="primary">编辑权限</Button>
          <Button>重置密码</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>权限管理</h2>
      <Button type="primary" style={{ marginBottom: 16 }}>
        添加用户
      </Button>
      <Table columns={columns} />
    </div>
  );
};

export default Permissions; 