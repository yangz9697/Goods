import React from 'react';
import { Table, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const SupplyOrders: React.FC = () => {
  const navigate = useNavigate();
  
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '订单日期',
      dataIndex: 'date',
      key: 'date',
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
      <h2>供货单列表</h2>
      <Button type="primary" style={{ marginBottom: 16 }}>
        新建供货单
      </Button>
      <Table columns={columns} />
    </div>
  );
};

export default SupplyOrders; 