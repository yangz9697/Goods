import React, { useState } from 'react';
import { Card, Table, Tag, Button, message } from 'antd';
import { mockPaymentData } from '@/mock/dashboard';

interface MonthlyOrdersProps {
  userId: string | null;
  month: string | null;
}

const MonthlyOrders: React.FC<MonthlyOrdersProps> = ({ userId, month }) => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const user = userId ? mockPaymentData.list.find(u => u.id === parseInt(userId)) : null;
  const monthNumber = month ? parseInt(month) : null;

  if (!user || !monthNumber) {
    return <Card>请选择用户和月份查看订单</Card>;
  }

  const monthlyData = user.monthlyDetails.find(d => d.month === monthNumber);
  if (!monthlyData) {
    return <Card>未找到相关月份的订单数据</Card>;
  }

  const columns = [
    {
      title: '订单日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'red'}>
          {status === 'paid' ? '已付款' : '待付款'}
        </Tag>
      ),
    },
  ];

  const unpaidOrders = monthlyData.orders.filter(order => order.status === 'unpaid');
  const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + order.amount, 0);

  const handleBatchSettle = () => {
    if (selectedOrders.length === 0) return;
    
    message.success('批量结算成功');
    setSelectedOrders([]);
  };

  return (
    <Card 
      title={`${user.name} - ${monthNumber}月订单列表`}
      extra={
        <div>
          <span style={{ marginRight: 16 }}>
            待付订单：{unpaidOrders.length}笔
          </span>
          <span style={{ marginRight: 16 }}>
            待付金额：
            <span style={{ color: '#cf1322' }}>
              ¥{totalUnpaid.toFixed(2)}
            </span>
          </span>
        </div>
      }
    >
      <Table
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys) => {
            setSelectedOrders(selectedRowKeys as string[]);
          },
          getCheckboxProps: (record: any) => ({
            disabled: record.status === 'paid',
          }),
        }}
        columns={columns}
        dataSource={monthlyData.orders}
        rowKey="id"
        pagination={false}
        footer={() => (
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              disabled={selectedOrders.length === 0}
              onClick={handleBatchSettle}
            >
              批量结算
              {selectedOrders.length > 0 && ` (${selectedOrders.length}笔)`}
            </Button>
          </div>
        )}
      />
    </Card>
  );
};

export default MonthlyOrders; 