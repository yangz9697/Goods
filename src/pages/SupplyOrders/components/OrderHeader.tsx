import React, { useState, useEffect } from 'react';
import { Form, Row, Col, DatePicker, Input, Select, Space, Button, Popconfirm, message } from 'antd';
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
  payStatus: 'waitPay' | 'paySuccess';
  totalPrice: number;
  id: string;  // 改为只接受 string 类型
  deliveryCount: number;
  totalObjectCount: number;
}

interface OrderHeaderProps {
  order: ExtendedOrder;
  statusList: OrderStatus[];
  isAdmin: boolean;
  onStatusChange: (status: OrderStatusCode) => void;
  onPayStatusChange: (status: 'waitPay' | 'paySuccess') => void;
  onDeleteSuccess: () => void;
  onWeightChange: (weight: string) => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  statusList,
  isAdmin,
  onStatusChange,
  onPayStatusChange,
  onDeleteSuccess,
  onWeightChange
}) => {
  const [weight, setWeight] = useState<string>('0');
  const [port, setPort] = useState<SerialPort | null>(null);

  // 初始化串口连接
  useEffect(() => {
    const initSerialPort = async () => {
      try {
        console.log('正在获取串口列表...');
        const ports = await navigator.serial.getPorts();
        let serialPort;
        
        if (ports.length === 0) {
          console.log('请选择串口...');
          serialPort = await navigator.serial.requestPort();
        } else {
          console.log('使用已授权的串口...');
          serialPort = ports[0];
        }

        console.log('正在打开串口...');
        await serialPort.open({ 
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });

        setPort(serialPort);
        console.log('串口已打开，等待数据...');

        while (serialPort.readable) {
          const reader = serialPort.readable.getReader();
          try {
            console.log('开始读取数据...');
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                console.log('读取结束');
                break;
              }
              
              const weightData = new TextDecoder().decode(value);
              console.log(`收到数据: ${weightData}`);
              
              const match = weightData.match(/(\d+(\.\d+)?)\s*kg$/);
              if (match) {
                const newWeight = match[1];
                setWeight(newWeight);
                onWeightChange(newWeight);
                console.log(`解析重量: ${newWeight} kg`);
              }
            }
          } catch (error) {
            console.log(`读取错误: ${(error as Error).message}`);
            console.error('读取串口数据失败:', error);
          } finally {
            reader.releaseLock();
          }
        }
      } catch (error) {
        console.log(`连接错误: ${(error as Error).message}`);
        console.error('初始化串口失败:', error);
        message.error('连接电子秤失败，请检查设备连接');
      }
    };

    initSerialPort();

    return () => {
      if (port) {
        port.close().catch(console.error);
        console.log('串口已关闭');
      }
    };
  }, [onWeightChange]);

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
      link.download = `${order.customerName}${order.date}.xlsx`;  // 设置下载文件名
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
    <Row gutter={8} style={{ height: '100%' }}>
      {/* 电子秤 */}
      <Col span={4} style={{ height: '100%' }}>
        <div style={{ 
          height: '100%',
          background: '#fff',
          borderRadius: '4px',
          // border: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // padding: '16px'
        }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#1890ff',
              padding: '16px',
              background: '#f0f5ff',
              borderRadius: '4px'
            }}>
              {weight} 斤
            </div>
          </div>
        </div>
      </Col>

      {/* 筛选项和操作按钮 */}
      <Col span={20} style={{ height: '100%' }}>
        <div style={{ 
          height: '100%',
          background: '#fff',
          borderRadius: '4px',
          // border: '1px solid #f0f0f0',
          // padding: '8px'
        }}>
          <Form layout="inline">
            {/* 第一行 */}
            <Row style={{ width: '100%', marginBottom: 8 }}>
              <Col flex="auto">
                <Form.Item label="客户信息" style={{ marginBottom: 0, marginRight: 4 }}>
                  <Space>
                    <Input 
                      value={order.customerName+formatPhone(order.customerPhone)}
                      disabled
                      style={{ 
                        width: 200,
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1890ff'
                      }}
                    />
                  </Space>
                </Form.Item>
              </Col>
              <Col>
                <Space>
                  <Form.Item 
                    label="供货日期" 
                    name="date" 
                    style={{ marginBottom: 0, marginRight: 4 }}
                    initialValue={dayjs(order.date)}
                  >
                    <DatePicker 
                      style={{ width: 130 }}
                      format="YYYY-MM-DD"
                      disabled={true}
                    />
                  </Form.Item>
                  <Form.Item label="下单时间" style={{ marginBottom: 0, marginRight: 4 }}>
                    <Input 
                      disabled 
                      value={order.createTime ? dayjs(order.createTime).format('YYYY-MM-DD HH:mm:ss') : ''} 
                      style={{ width: 160 }} 
                    />
                  </Form.Item>
                </Space>
              </Col>
            </Row>

            {/* 第二行 */}
            <Row style={{ width: '100%' }}>
              <Col flex="auto">
                <Form.Item
                  label="配货状态"
                  style={{ marginBottom: 0, marginRight: 4 }}
                >
                  <Space>
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
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 500,
                      color: '#1890ff',
                      marginLeft: '8px'
                    }}>
                      配货进度：{order.deliveryCount}/{order.totalObjectCount}
                    </span>
                  </Space>
                </Form.Item>
              </Col>
              <Col>
                <Space>
                  {isAdmin && (
                    <>
                      <Form.Item style={{ marginBottom: 0, marginRight: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 500 }}>
                          总计：￥{order.totalPrice}
                        </span>
                      </Form.Item>
                      {order.payStatus === 'waitPay' && (
                        <Form.Item style={{ marginBottom: 0, marginRight: 4 }}>
                          <Button 
                            type="primary"
                            onClick={() => onPayStatusChange('paySuccess')}
                          >
                            结算完成
                          </Button>
                        </Form.Item>
                      )}
                      {order.payStatus === 'paySuccess' && (
                        <Form.Item style={{ marginBottom: 0, marginRight: 4 }}>
                          <Button 
                            type="primary"
                            onClick={() => onPayStatusChange('waitPay')}
                          >
                            未结算
                          </Button>
                        </Form.Item>
                      )}
                    </>
                  )}
                  <Form.Item style={{ marginBottom: 0, marginRight: 4 }}>
                    <Button 
                      type="primary" 
                      icon={<PrinterOutlined />}
                      onClick={handlePrint}
                    >
                      打印
                    </Button>
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0, marginRight: 4 }}>
                    <Button onClick={handleExport}>导出</Button>
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Popconfirm
                      title="确定要删除这个供货单吗？"
                      onConfirm={handleDeleteOrder}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button danger>删除</Button>
                    </Popconfirm>
                  </Form.Item>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
      </Col>
    </Row>
  );
}; 