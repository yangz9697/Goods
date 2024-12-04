import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, DatePicker, Modal, Form, Typography, Tag, Row, Col, message, Tabs, Descriptions, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import type { CustomerType } from '../Customers';
import { mockCustomers } from '../Customers';

const { Search } = Input;
const { Title } = Typography;

interface OrderType {
  id: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  status: 'urgent' | 'adding' | 'preparing' | 'completed' | 'unpaid' | 'settled';
  remark?: string;
  isUrgent?: boolean;
}

interface CustomerCardProps {
  customer: CustomerType;
  orders: OrderType[];
  onAddOrder: (customerId: string) => void;
  onToggleUrgent: (orderId: string) => void;
  onOrderClick: (order: OrderType) => void;
  onCardClick: (customer: CustomerType) => void;
}

// 模拟数据
const mockOrders: OrderType[] = [
  {
    id: '1',
    orderNumber: 1,
    customerId: '1',
    customerName: '张三',
    customerPhone: '138****8000',
    date: '2024-03-14',
    status: 'preparing',
    remark: '加急订单',
    isUrgent: true
  }
];

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  orders,
  onAddOrder,
  onToggleUrgent,
  onOrderClick,
  onCardClick
}) => {
  const todayOrders = orders.filter(order => 
    dayjs(order.date).isSame(dayjs(), 'day') && 
    order.customerId === customer.id
  );

  return (
    <Card
      hoverable
      style={{ 
        opacity: todayOrders.length ? 1 : 0.5,
        cursor: 'pointer'
      }}
      onClick={() => onCardClick(customer)}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={5}>{customer.name}</Title>
          <div>{customer.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</div>
        </div>
        <Space className="card-actions">
          <Button type="primary" onClick={(e) => {
            e.stopPropagation();
            onAddOrder(customer.id);
          }}>
            新建订单
          </Button>
        </Space>
        <div className="order-list">
          {todayOrders.slice(0, 2).map(order => (
            <div
              key={order.id}
              onClick={(e) => {
                e.stopPropagation();
                onOrderClick(order);
              }}
              style={{ cursor: 'pointer', padding: '8px 0' }}
            >
              <Space size="middle">
                <span>单号: {order.orderNumber}</span>
                <Tag color={getStatusColor(order.status)}>{getStatusText(order.status)}</Tag>
                {order.remark && <span>{order.remark}</span>}
                <Button
                  size="small"
                  type={order.isUrgent ? 'primary' : 'default'}
                  danger={order.isUrgent}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleUrgent(order.id);
                  }}
                >
                  {order.isUrgent ? '取消加急' : '加急'}
                </Button>
              </Space>
            </div>
          ))}
          {todayOrders.length > 2 && <div>...</div>}
        </div>
      </Space>
    </Card>
  );
};

const SupplyOrders: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [nameSearch, setNameSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [orders, setOrders] = useState<OrderType[]>(mockOrders);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('list');
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);

  // 处理添加订单
  const handleAddOrder = async (values: any) => {
    try {
      const newOrder: OrderType = {
        id: String(Date.now()),
        orderNumber: orders.length + 1,
        customerId: values.customerId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        date: values.date.format('YYYY-MM-DD'),
        status: 'adding',
      };
      setOrders([...orders, newOrder]);
      message.success('订单创建成功');
      setAddModalVisible(false);
      form.resetFields();
      // 切换到详情 Tab
      setSelectedOrder(newOrder);
      setActiveTab('detail');
    } catch (error) {
      message.error('订单创建失败');
    }
  };

  // 处理重置
  const handleReset = () => {
    setSelectedDate(dayjs());
    setNameSearch('');
    setPhoneSearch('');
  };

  // 处理加急状态切换
  const handleToggleUrgent = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, isUrgent: !order.isUrgent }
        : order
    ));
  };

  // 处理订单点击
  const handleOrderClick = (order: OrderType) => {
    setSelectedOrder(order);
    setActiveTab('detail');
  };

  // 处理卡片点击
  const handleCardClick = (customer: CustomerType) => {
    const customerOrders = orders.filter(order => 
      order.customerId === customer.id &&
      dayjs(order.date).isSame(selectedDate, 'day')
    );

    // 只显示弹窗，不切换 tab
    setSelectedCustomer(customer);
    setOrderDetailModalVisible(true);
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: '供货单列表',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 日期选择器 */}
                <Space align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {selectedDate.format('YYYY年MM月DD日')}
                      {selectedDate.isSame(dayjs(), 'day') && (
                        <Tag color="red" style={{ marginLeft: 8 }}>今天</Tag>
                      )}
                    </div>
                  </Title>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                    allowClear={false}
                    style={{ marginLeft: 16 }}
                  />
                </Space>

                {/* 搜索区域 */}
                <Space>
                  <Search
                    placeholder="客户姓名"
                    value={nameSearch}
                    onChange={e => setNameSearch(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Search
                    placeholder="手机号"
                    value={phoneSearch}
                    onChange={e => setPhoneSearch(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Button onClick={handleReset}>重置</Button>
                  <Button type="primary" onClick={() => setAddModalVisible(true)}>
                    添加供货单
                  </Button>
                </Space>

                {/* 客户卡片列表 */}
                <Row gutter={[16, 16]}>
                  {/* TODO: 根据筛选条件过滤并排序客户列表 */}
                  {mockCustomers.map(customer => (
                    <Col key={customer.id} xs={24} sm={12} md={8} lg={6}>
                      <CustomerCard
                        customer={customer}
                        orders={orders}
                        onAddOrder={(customerId) => {
                          setSelectedCustomer(customer);
                          setAddModalVisible(true);
                        }}
                        onToggleUrgent={handleToggleUrgent}
                        onOrderClick={handleOrderClick}
                        onCardClick={handleCardClick}
                      />
                    </Col>
                  ))}
                </Row>
              </Space>
            )
          },
          {
            key: 'detail',
            label: '供货单详情',
            children: selectedOrder ? (
              <div>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Button 
                    onClick={() => {
                      setActiveTab('list');
                      setSelectedOrder(null);
                    }}
                  >
                    返回列表
                  </Button>
                  <Descriptions bordered>
                    <Descriptions.Item label="订单编号">{selectedOrder.orderNumber}</Descriptions.Item>
                    <Descriptions.Item label="客户名称">{selectedOrder.customerName}</Descriptions.Item>
                    <Descriptions.Item label="订单日期">{selectedOrder.date}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={getStatusColor(selectedOrder.status)}>
                        {getStatusText(selectedOrder.status)}
                      </Tag>
                    </Descriptions.Item>
                    {selectedOrder.remark && (
                      <Descriptions.Item label="备注">{selectedOrder.remark}</Descriptions.Item>
                    )}
                  </Descriptions>
                  {/* TODO: 添加订单商品列表等其他详情内容 */}
                </Space>
              </div>
            ) : (
              <Empty description="请选择一个供货单查看详情" />
            )
          }
        ]}
      />

      {/* 添加供货单弹窗 */}
      <Modal
        title="新建供货单"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleAddOrder}
          initialValues={{
            date: dayjs(),
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer?.name,
            customerPhone: selectedCustomer?.phone,
          }}
        >
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            {/* TODO: 实现客户搜索选择组件 */}
            <Input disabled={!!selectedCustomer} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => setAddModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title={`${selectedCustomer?.name}的供货单列表`}
        visible={orderDetailModalVisible}
        onCancel={() => setOrderDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {orders
            .filter(order => 
              order.customerId === selectedCustomer?.id &&
              dayjs(order.date).isSame(selectedDate, 'day')
            )
            .map(order => (
              <div
                key={order.id}
                onClick={() => {
                  setOrderDetailModalVisible(false);
                  setSelectedOrder(order);
                  setActiveTab('detail');
                }}
                style={{ 
                  cursor: 'pointer', 
                  padding: '12px', 
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: '#fff'
                }}
                className="order-item"
              >
                <Space size="large">
                  <span style={{ fontWeight: 'bold' }}>单号: {order.orderNumber}</span>
                  <Tag color={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Tag>
                  {order.isUrgent && <Tag color="red">加急</Tag>}
                  {order.remark && (
                    <span style={{ color: '#666' }}>备注: {order.remark}</span>
                  )}
                </Space>
              </div>
            ))}
          {orders.filter(order => 
            order.customerId === selectedCustomer?.id &&
            dayjs(order.date).isSame(selectedDate, 'day')
          ).length === 0 && (
            <Empty description="当天没有供货单" />
          )}
        </Space>
      </Modal>
    </div>
  );
};

// 辅助函数
const getStatusColor = (status: OrderType['status']) => {
  const colors: Record<OrderType['status'], string> = {
    urgent: 'red',
    adding: 'blue',
    preparing: 'processing',
    completed: 'success',
    unpaid: 'warning',
    settled: 'default'
  };
  return colors[status];
};

const getStatusText = (status: OrderType['status']) => {
  const texts: Record<OrderType['status'], string> = {
    urgent: '加急',
    adding: '加单中',
    preparing: '配货中',
    completed: '已完成',
    unpaid: '待付款',
    settled: '已结算'
  };
  return texts[status];
};

export default SupplyOrders; 