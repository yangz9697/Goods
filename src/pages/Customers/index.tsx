import React from 'react';
import { Table, Button, Space } from 'antd';

const Customers: React.FC = () => {
  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="primary">编辑</Button>
          <Button>查看订单</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>客户信息管理</h2>
      <Button type="primary" style={{ marginBottom: 16 }}>
        添加客户
      </Button>
      <Table columns={columns} />
    </div>
  );
};

export default Customers; 