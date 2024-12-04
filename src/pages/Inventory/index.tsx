import React from 'react';
import { Table, Button, Space } from 'antd';

const Inventory: React.FC = () => {
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="primary">编辑</Button>
          <Button>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>库存管理</h2>
      <Button type="primary" style={{ marginBottom: 16 }}>
        添加商品
      </Button>
      <Table columns={columns} />
    </div>
  );
};

export default Inventory; 