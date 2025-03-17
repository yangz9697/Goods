import React from 'react';
import { Card, Form, Row, Col, DatePicker, Input, Select, Space, Button, Popconfirm, message } from 'antd';
import { formatPhone } from '@/utils/format';
import dayjs from 'dayjs';
import { Order, OrderStatus, OrderStatusCode } from '@/types/order';
import { orderApi } from '@/api/orders';
import { PrinterOutlined } from '@ant-design/icons';

// 扩展 Order 类型，确保包含所有需要的属性
interface ExtendedOrder extends Order {
  orderNo: string;
  date: string;
  createTime: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatusCode;
  statusName: string;
  payStatusName: string;
  totalPrice: number;
  id: string;  // 改为只接受 string 类型
}

interface OrderHeaderProps {
  order: ExtendedOrder;
  statusList: OrderStatus[];
  isAdmin: boolean;
  onStatusChange: (status: OrderStatusCode) => void;
  onPayStatusChange: (status: 'waitPay' | 'paySuccess') => void;
  onDeleteSuccess: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  statusList,
  isAdmin,
  onStatusChange,
  onPayStatusChange,
  onDeleteSuccess
}) => {
  const handleDeleteOrder = async () => {
    try {
      const response = await orderApi.deleteOrder(order.orderNo);
      if (response.success) {
        onDeleteSuccess();
      } else {
        message.error(response.displayMsg || '删除供货单失败');
      }
    } catch (error) {
      message.error('删除供货单失败：' + (error as Error).message);
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await orderApi.printOrderToPDF(order.orderNo);
      const url = window.URL.createObjectURL(blob);
      
      // 创建一个隐藏的 iframe
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);
      
      // 监听 iframe 加载完成
      printFrame.onload = () => {
        try {
          // 延迟更长时间确保 PDF 完全渲染
          setTimeout(() => {
            if (printFrame.contentWindow) {
              // 监听打印对话框关闭
              const mediaQueryList = window.matchMedia('print');
              const handlePrintChange = (e: MediaQueryListEvent) => {
                if (!e.matches) {  // 打印对话框关闭
                  mediaQueryList.removeEventListener('change', handlePrintChange);
                  document.body.removeChild(printFrame);
                  window.URL.revokeObjectURL(url);
                }
              };
              mediaQueryList.addEventListener('change', handlePrintChange);

              // 触发打印
              printFrame.contentWindow.print();
            }
          }, 1000);  // 增加延时到 1 秒
        } catch (error) {
          message.error('打印失败：' + (error as Error).message);
          document.body.removeChild(printFrame);
          window.URL.revokeObjectURL(url);
        }
      };

      // 设置 iframe 的 src
      printFrame.src = url;
    } catch (error) {
      message.error('打印失败：' + (error as Error).message);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await orderApi.exportOrderToExcel(order.orderNo);
      const url = window.URL.createObjectURL(blob);
      
      // 创建一个隐藏的 a 标签来下载文件
      const link = document.createElement('a');
      link.href = url;
      link.download = `供货单_${order.orderNo}.xlsx`;  // 设置下载文件名
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      message.error('导出失败：' + (error as Error).message);
    }
  };

  return (
    <Row gutter={16} style={{ height: '100%' }}>
      {/* 电子秤 */}
      <Col span={4} style={{ height: '100%' }}>
        <Card 
          style={{ height: '100%' }}
          styles={{
            body: {
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '24px 16px'
            }
          }}
        >
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>电子秤</div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#1890ff',
              padding: '16px',
              background: '#f0f5ff',
              borderRadius: '4px'
            }}>
              0 斤
            </div>
          </div>
        </Card>
      </Col>

      {/* 筛选项和操作按钮 */}
      <Col span={20} style={{ height: '100%' }}>
        <Card 
          style={{ height: '100%' }}
          styles={{
            body: { 
              height: '100%',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          {/* 筛选项 */}
          <div style={{ flex: 1 }}>
            <Form layout="inline">
              <Form.Item 
                label="供货日期" 
                name="date" 
                style={{ marginBottom: 8 }}
                initialValue={dayjs(order.date)}
              >
                <DatePicker 
                  style={{ width: 130 }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              <Form.Item label="下单时间" style={{ marginBottom: 8 }}>
                <Input 
                  disabled 
                  value={order.createTime ? dayjs(order.createTime).format('YYYY-MM-DD HH:mm:ss') : ''} 
                  style={{ width: 160 }} 
                />
              </Form.Item>
              <Form.Item
                label="配货状态"
                style={{ marginBottom: 8 }}
              >
                <Select
                  style={{ width: 100 }}
                  value={order.status}
                  onChange={onStatusChange}
                >
                  {statusList.map(status => (
                    <Select.Option 
                      key={status.orderStatusCode} 
                      value={status.orderStatusCode}
                    >
                      {status.orderStatusName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="客户信息" style={{ marginBottom: 8 }}>
                <Space>
                  <Input 
                    value={order.customerName}
                    disabled
                    style={{ width: 120 }}
                  />
                  <Input 
                    value={formatPhone(order.customerPhone)}
                    disabled
                    style={{ width: 120 }}
                  />
                </Space>
              </Form.Item>
            </Form>
          </div>

          {/* 操作按钮 */}
          <div style={{ 
            borderTop: '1px solid #f0f0f0', 
            paddingTop: 16,
            display: 'flex',
            justifyContent: 'space-between'  // 添加两端对齐
          }}>
            {/* 左侧按钮组 */}
            <Space size="small">
              {isAdmin && (
                <>
                  <span style={{
                    fontSize: 16, 
                    fontWeight: 500 
                  }}>
                    总计：￥{order.totalPrice.toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: 16,
                    color: order.payStatusName === '已付款' ? '#52c41a' : '#f5222d'
                  }}>
                    {order.payStatusName}
                  </span>
                  <Button 
                    type="primary"
                    onClick={() => onPayStatusChange('waitPay')}
                  >
                    计算金额
                  </Button>
                  <Button 
                    type="primary"
                    onClick={() => onPayStatusChange('paySuccess')}
                  >
                    结算完成
                  </Button>
                </>
              )}
            </Space>

            {/* 右侧按钮组 */}
            <Space size="small">
              <Button 
                type="primary" 
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                打印
              </Button>
              <Button onClick={handleExport}>导出Excel</Button>
              <Popconfirm
                title="确定要删除这个供货单吗？"
                onConfirm={handleDeleteOrder}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>删除</Button>
              </Popconfirm>
            </Space>
          </div>
        </Card>
      </Col>
    </Row>
  );
}; 