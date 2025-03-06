import React from 'react';
import { Card, Form, Row, Col, DatePicker, Input, Select, Space, Button, Popconfirm, message } from 'antd';
import { formatPhone } from '@/utils/format';
import dayjs from 'dayjs';
import { Order, OrderStatus, OrderStatusCode } from '@/types/order';
import { orderApi } from '@/api/orders';

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
    // 创建一个简单的 PDF 文件内容
    const pdfContent = `
%PDF-1.7
1 0 obj
<</Type /Catalog /Pages 2 0 R>>
endobj
2 0 obj
<</Type /Pages /Kids [3 0 R] /Count 1>>
endobj
3 0 obj
<</Type /Page /Parent 2 0 R /Resources <</Font <</F1 4 0 R>>>> /MediaBox [0 0 612 792] /Contents 5 0 R>>
endobj
4 0 obj
<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>
endobj
5 0 obj
<</Length 89>>
stream
BT
/F1 24 Tf
50 700 Td
(供货单) Tj
/F1 12 Tf
0 -50 Td
(订单号: ${order.orderNo}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000056 00000 n
0000000111 00000 n
0000000212 00000 n
0000000274 00000 n
trailer
<</Size 6 /Root 1 0 R>>
startxref
415
%%EOF`;

    // 将字符串转换为 Blob
    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    
    // 创建一个隐藏的 iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    // 当 iframe 加载完成后触发打印
    printFrame.onload = () => {
      const contentWindow = printFrame.contentWindow;
      if (!contentWindow) return;

      // 监听打印对话框关闭事件
      const cleanup = () => {
        document.body.removeChild(printFrame);
        URL.revokeObjectURL(url);
      };

      try {
        if (contentWindow.matchMedia) {
          const mediaQueryList = contentWindow.matchMedia('print');
          mediaQueryList.addEventListener('change', (mql) => {
            if (!mql.matches) {  // 打印对话框关闭
              cleanup();
            }
          });
        }
        
        contentWindow.print();
      } catch (error) {
        console.error('打印失败:', error);
        cleanup();
      }
    };
    
    // 设置 iframe 的 src
    printFrame.src = url;
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
              <Button onClick={handlePrint}>打印</Button>
              <Button onClick={() => console.log('导出:', order.id)}>导出PDF</Button>
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