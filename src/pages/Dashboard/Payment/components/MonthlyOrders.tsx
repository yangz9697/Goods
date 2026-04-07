import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, message, Button, Space } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { orderApi } from '@/api/orders';
import { debounce } from 'lodash';
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
  const [printLoading, setPrintLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
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
  const totalUnpaid = Number(unpaidOrders.reduce((sum, order) => sum + order.orderPrice, 0).toFixed(2));

  const debouncedPrint = useCallback(
    debounce(async () => {
      if (selectedOrders.length === 0) {
        message.warning('请选择要打印的订单');
        return;
      }

      // 从选中的行中获取所有订单号数组并合并
      const orderNoList = selectedOrders.reduce<string[]>((acc, curr) => {
        const selectedRecord = orderList.find(item => item.orderNoList.join(',') === curr);
        if (selectedRecord) {
          return [...acc, ...selectedRecord.orderNoList];
        }
        return acc;
      }, []);

      setPrintLoading(true);
      try {
        const blob = await orderApi.batchPrintOrderToPDF({
          orderNoList
        });

        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
          try {
            printFrame.contentWindow?.print();
          } catch (error) {
            message.error('打印失败：' + (error as Error).message);
          }
        };

        printFrame.src = url;
      } catch (error) {
        message.error('批量打印失败：' + (error as Error).message);
      } finally {
        setPrintLoading(false);
      }
    }, 300),
    [selectedOrders, orderList]
  );

  const debouncedExport = useCallback(
    debounce(async () => {
      if (selectedOrders.length === 0) {
        message.warning('请选择要导出的订单');
        return;
      }

      const orderNoList = selectedOrders.reduce<string[]>((acc, curr) => {
        const selectedRecord = orderList.find(item => item.orderNoList.join(',') === curr);
        if (selectedRecord) {
          return [...acc, ...selectedRecord.orderNoList];
        }
        return acc;
      }, []);

      if (orderNoList.length === 0) {
        message.warning('未找到可导出的订单');
        return;
      }

      setExportLoading(true);
      try {
        const blob = await orderApi.batchExportOrderToExcel({
          orderNoList
        });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `供货单批量导出_${dayjs().format('YYYYMMDD')}.zip`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        message.error('批量导出失败：' + (error as Error).message);
      } finally {
        setExportLoading(false);
      }
    }, 300),
    [selectedOrders, orderList]
  );

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
      render: (price: number) => `¥${price}`,
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
              ¥{totalUnpaid}
            </span>
          </span>
          <Space>
            <Button
              type="primary"
              disabled={selectedOrders.length === 0}
              onClick={handleBatchSettle}
            >
              批量结算
            </Button>
            <Button
              onClick={debouncedPrint}
              disabled={selectedOrders.length === 0}
              loading={printLoading}
            >
              批量打印
            </Button>
            <Button
              onClick={debouncedExport}
              disabled={selectedOrders.length === 0}
              loading={exportLoading}
            >
              批量导出
            </Button>
          </Space>
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