import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message } from 'antd';
import { orderApi } from '@/api/orders';
import dayjs from 'dayjs';

interface MonthlyOrdersProps {
  userId: string | null;
  month: string | null;
}

interface OrderInfo {
  orderNoList: string[];
  orderDate: string;
  orderPrice: number;
  orderPayStatusCode: 'waitPay' | 'paySuccess';
  orderPayStatusName: string;
}

const MonthlyOrders: React.FC<MonthlyOrdersProps> = ({ userId, month }) => {
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState<OrderInfo[]>([]);
  
  useEffect(() => {
    if (!userId || !month) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const startTime = dayjs(month).startOf('month').valueOf();
        const endTime = dayjs(month).add(1, 'month').startOf('month').subtract(1, 'millisecond').valueOf();
        
        const response = await orderApi.getOrderInfoByUserId({
          userId: Number(userId),
          startTime,
          endTime
        });

        if (response.success) {
          setOrderList(response.data);
        } else {
          message.error(response.displayMsg || '获取订单列表失败');
        }
      } catch (error) {
        message.error('获取订单列表失败：' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId, month]);

  const columns = [
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
    },
    {
      title: '订单号',
      dataIndex: 'orderNoList',
      key: 'orderNoList',
      render: (orderNoList: string[]) => orderNoList.join(', '),
    },
    {
      title: '金额',
      dataIndex: 'orderPrice',
      key: 'orderPrice',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'orderPayStatusName',
      key: 'orderPayStatusName',
      render: (status: string, record: OrderInfo) => (
        <Tag color={record.orderPayStatusCode === 'paySuccess' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  const unpaidOrders = orderList.filter(order => order.orderPayStatusCode === 'waitPay');
  const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + order.orderPrice, 0);

  return (
    <Card 
      title={`${month}月订单列表`}
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
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={orderList}
        rowKey="orderDate"
        pagination={false}
      />
    </Card>
  );
};

export default MonthlyOrders; 