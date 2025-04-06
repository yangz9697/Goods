import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Button, Space } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { orderApi } from '@/api/orders';
import dayjs from 'dayjs';

interface MonthlyOrdersProps {
  userId: string | null;
  startTime: number;
  endTime: number;
}

interface OrderInfo {
  orderNoList: string[];
  orderDate: string;
  orderPrice: number;
  orderPayStatusCode: 'waitPay' | 'paySuccess';
  orderPayStatusName: string;
}

const MonthlyOrders: React.FC<MonthlyOrdersProps> = ({ userId, startTime, endTime }) => {
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState<OrderInfo[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
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
  }, [userId, startTime, endTime]);

  const rowSelection: TableRowSelection<OrderInfo> = {
    selectedRowKeys: selectedOrders,
    onChange: (selectedRowKeys) => {
      setSelectedOrders(selectedRowKeys as string[]);
    }
  };

  const handleBatchSettle = async () => {
    if (selectedOrders.length === 0) {
      message.warning('请选择要结算的订单');
      return;
    }

    try {
      // 从选中的行中获取所有订单号数组并合并
      const orderNoList = selectedOrders.reduce<string[]>((acc, curr) => {
        // 获取选中行的数据
        const selectedRecord = orderList.find(item => item.orderNoList.join(',') === curr);
        // 如果找到了记录，将其订单号数组合并到结果中
        if (selectedRecord) {
          return [...acc, ...selectedRecord.orderNoList];
        }
        return acc;
      }, []);

      const response = await orderApi.batchUpdateOrderPayStatus({
        orderNoList,
        orderPayStatusCode: 'paySuccess'
      });

      if (response.success) {
        message.success('批量结算成功');
        setSelectedOrders([]);
        // 重新获取订单列表
        const response = await orderApi.getOrderInfoByUserId({
          userId: Number(userId),
          startTime,
          endTime
        });

        if (response.success) {
          setOrderList(response.data);
        }
      } else {
        message.error(response.displayMsg || '批量结算失败');
      }
    } catch (error) {
      message.error('批量结算失败：' + (error as Error).message);
    }
  };

  const unpaidOrders = orderList.filter(order => order.orderPayStatusCode === 'waitPay');
  const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + order.orderPrice, 0);

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
      render: (orderNoList: string[]) => (
        <Space>
          {orderNoList.map((orderNo) => (
            <a
              key={orderNo}
              onClick={(e) => {
                e.stopPropagation();  // 防止触发行选择
                window.open(`/supply-orders/detail/${orderNo}`, '_blank');
              }}
              style={{ color: '#1890ff', cursor: 'pointer' }}
            >
              {orderNo}
            </a>
          ))}
        </Space>
      ),
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

  return (
    <Card 
      title={`${dayjs(startTime).format('YYYY年MM月')}订单列表`}
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
          <Button
            type="primary"
            disabled={selectedOrders.length === 0}
            onClick={handleBatchSettle}
          >
            批量结算
          </Button>
        </div>
      }
      loading={loading}
    >
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={orderList}
        rowKey={(record) => record.orderNoList.join(',')}
        pagination={false}
      />
    </Card>
  );
};

export default MonthlyOrders; 