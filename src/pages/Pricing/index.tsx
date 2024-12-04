import React from 'react';
import { Table, Button, Space } from 'antd';

const Pricing: React.FC = () => {
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="primary">修改价格</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>价格管理</h2>
      <Table columns={columns} />
    </div>
  );
};

export default Pricing; 