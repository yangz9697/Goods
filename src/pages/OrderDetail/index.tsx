import React from 'react';
import { Descriptions, Table } from 'antd';
import { useParams } from 'react-router-dom';

const OrderDetail: React.FC = () => {
  const { id } = useParams();

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
    },
  ];

  return (
    <div>
      <h2>供货单详情</h2>
      <Descriptions bordered>
        <Descriptions.Item label="订单编号">{id}</Descriptions.Item>
        <Descriptions.Item label="客户名称">示例客户</Descriptions.Item>
        <Descriptions.Item label="订单日期">2024-03-14</Descriptions.Item>
        <Descriptions.Item label="状态">已完成</Descriptions.Item>
      </Descriptions>
      <h3 style={{ margin: '16px 0' }}>商品明细</h3>
      <Table columns={columns} />
    </div>
  );
};

export default OrderDetail; 