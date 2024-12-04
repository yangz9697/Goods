import React from 'react';
import { Table, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const CustomerOrders: React.FC = () => {
  const navigate = useNavigate();

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '订单日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '总金额',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" onClick={() => navigate(`/order/${record.id}`)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>客户供货单列表</h2>
      <Table columns={columns} />
    </div>
  );
};

export default CustomerOrders; 