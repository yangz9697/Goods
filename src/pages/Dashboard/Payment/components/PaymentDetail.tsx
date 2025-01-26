import React from 'react';
import { Card, Table, Button } from 'antd';
import { mockPaymentData } from '@/mock/dashboard';

interface PaymentDetailProps {
  userId: string | null;
  onMonthClick: (month: number) => void;
}

const PaymentDetail: React.FC<PaymentDetailProps> = ({ userId, onMonthClick }) => {
  const user = userId ? mockPaymentData.list.find(u => u.id === parseInt(userId)) : null;

  if (!user) {
    return <Card>请从付款列表选择用户查看详情</Card>;
  }

  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      render: (month: number) => `${month}月`,
    },
    {
      title: '已付金额',
      dataIndex: 'paid',
      key: 'paid',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '待付金额',
      dataIndex: 'unpaid',
      key: 'unpaid',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="link"
          onClick={() => onMonthClick(record.month)}
        >
          查看订单
        </Button>
      ),
    },
  ];

  return (
    <Card title={`${user.name} - 付款详情`}>
      <Table
        columns={columns}
        dataSource={user.monthlyDetails}
        rowKey="month"
        pagination={false}
      />
    </Card>
  );
};

export default PaymentDetail; 