import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, DatePicker, Modal, Form, Typography, Tag, Row, Col, message, Tabs, Descriptions, Empty, Table, Popconfirm, Tooltip, AutoComplete, Select, InputNumber } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { CustomerType } from '../Customers';
import { mockCustomers } from '../Customers';
import { PlusOutlined } from '@ant-design/icons';

dayjs.extend(isBetween);

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Title } = Typography;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'box' | 'jin' | 'piece';
  deliveryPerson?: string;
  remark?: string;
}

interface OrderType {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  status: 'urgent' | 'adding' | 'preparing' | 'completed' | 'unpaid' | 'settled';
  remark?: string;
  isUrgent?: boolean;
  items: OrderItem[];
  createTime: string;
  deliveryStatus: 'preparing' | 'adding' | 'checking' | 'completed' | 'settled';
  deliveryPerson: string;
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
    orderNumber: '20240314001',
    customerId: '1',
    customerName: '张三',
    customerPhone: '138****8000',
    date: '2024-03-14',
    status: 'preparing',
    remark: '加急订单',
    isUrgent: true,
    items: [],
    createTime: '2024-03-14 10:00:00',
    deliveryStatus: 'preparing',
    deliveryPerson: '张三'
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
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [searchText, setSearchText] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [activeItemTab, setActiveItemTab] = useState<string>('all');
  const [scaleWeight, setScaleWeight] = useState<number>(0);

  // 处理添加订单
  const handleAddOrder = async (values: any) => {
    try {
      const newOrder: OrderType = {
        id: String(Date.now()),
        orderNumber: generateOrderNumber(values.customerId),
        customerId: values.customerId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        date: values.date.format('YYYY-MM-DD'),
        status: 'adding',
        items: [],
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        deliveryStatus: 'preparing',
        deliveryPerson: '张三'
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

  // 添加筛选逻辑
  const filteredOrders = orders.filter(order => {
    // 日期范围筛选
    if (dateRange[0] && dateRange[1]) {
      const orderDate = dayjs(order.date);
      if (!orderDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
        return false;
      }
    }

    // 姓名模糊匹配
    if (searchText && !order.customerName.includes(searchText)) {
      return false;
    }

    // 手机号精确匹配
    if (searchPhone && order.customerPhone.replace(/\D/g, '') !== searchPhone) {
      return false;
    }

    return true;
  });

  // 生成订单号的函数
  const generateOrderNumber = (customerId: string) => {
    const date = dayjs().format('YYYYMMDD');
    const customerOrders = orders.filter(order => 
      order.customerId === customerId &&
      dayjs(order.date).isSame(dayjs(), 'day')
    );
    const orderCount = customerOrders.length + 1;
    return `${date}${customerId}${orderCount.toString().padStart(2, '0')}`;
  };

  // 添加打印和导出函数
  const handlePrint = (orderIds: string[]) => {
    // TODO: 实现打印功能
    console.log('打印订单:', orderIds);
  };

  const handleExport = (orderIds: string[]) => {
    // TODO: 实现导出功能
    console.log('导出订单:', orderIds);
  };

  // 添加 handleDelete 函数
  const handleDelete = (orderId: string) => {
    setOrders(orders.filter(order => order.id !== orderId));
    message.success('删除成功');
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
                  <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Title level={3}>供货单</Title>
                    <Space>
                      {scaleWeight > 0 && (
                        <Tag color="blue" style={{ fontSize: '16px' }}>
                          电子秤: {scaleWeight} 斤
                        </Tag>
                      )}
                      <Button onClick={() => handlePrint([selectedOrder.id])}>打印</Button>
                      <Button onClick={() => handleExport([selectedOrder.id])}>导出PDF</Button>
                      {selectedOrder.deliveryStatus !== 'settled' && (
                        <Popconfirm
                          title="确定要删除这个供货单吗？"
                          onConfirm={() => {
                            handleDelete(selectedOrder.id);
                            setActiveTab('list');
                          }}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button danger>删除</Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </Space>

                  <Form
                    layout="vertical"
                    initialValues={{
                      date: dayjs(selectedOrder.date),
                      customerId: selectedOrder.customerId,
                      customerName: selectedOrder.customerName,
                      deliveryStatus: selectedOrder.deliveryStatus
                    }}
                  >
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item label="日期" name="date">
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="供货单号">
                          <Input disabled value={selectedOrder.orderNumber} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="下单时间">
                          <Input disabled value={selectedOrder.createTime} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label="配货状态"
                          name="deliveryStatus"
                          rules={[{ required: true, message: '请选择配货状态' }]}
                        >
                          <Select>
                            <Select.Option value="preparing">配货中</Select.Option>
                            <Select.Option value="adding">加单中</Select.Option>
                            <Select.Option value="checking">待检查</Select.Option>
                            <Select.Option value="completed">已完成</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label="客户信息">
                      <Space>
                        <AutoComplete
                          value={selectedOrder.customerName}
                          placeholder="搜索客户姓名或手机号"
                          // TODO: 实现客户搜索功能
                        />
                        <span>{selectedOrder.customerPhone}</span>
                      </Space>
                    </Form.Item>

                    {/* 货品列表 */}
                    <Card>
                      <Tabs
                        activeKey={activeItemTab}
                        onChange={(key: string) => setActiveItemTab(key)}
                        items={[
                          {
                            key: 'all',
                            label: '全部',
                            children: (
                              <ItemList
                                items={selectedOrder.items}
                                defaultUnit="jin"
                                scaleWeight={scaleWeight}
                              />
                            )
                          },
                          {
                            key: 'bulk',
                            label: '大货',
                            children: (
                              <ItemList
                                items={selectedOrder.items.filter(item => item.unit === 'box')}
                                defaultUnit="box"
                                scaleWeight={scaleWeight}
                              />
                            )
                          }
                        ]}
                      />
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => {/* TODO: 添加新行 */}}
                        style={{ marginTop: 16 }}
                      >
                        添加货品
                      </Button>
                    </Card>
                  </Form>
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
        title="供货单列表"
        visible={orderDetailModalVisible}
        onCancel={() => setOrderDetailModalVisible(false)}
        footer={[
          <Button key="print" onClick={() => handlePrint(selectedOrders)}>打印</Button>,
          <Button key="export" onClick={() => handleExport(selectedOrders)}>导出</Button>
        ]}
        width={1000}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 筛选器 */}
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])}
              allowClear
            />
            <Search
              placeholder="客户姓名"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Search
              placeholder="手机号"
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              style={{ width: 200 }}
            />
            <Button onClick={() => {
              setDateRange([null, null]);
              setSearchText('');
              setSearchPhone('');
            }}>
              重置
            </Button>
            <Button type="primary" onClick={() => setAddModalVisible(true)}>
              添加供货单
            </Button>
          </Space>

          {/* 订单列表 */}
          <Table
            rowSelection={{
              type: 'checkbox',
              onChange: (selectedRowKeys) => setSelectedOrders(selectedRowKeys as string[])
            }}
            columns={[
              {
                title: '订单号',
                dataIndex: 'orderNumber',
                key: 'orderNumber',
              },
              {
                title: '姓名',
                dataIndex: 'customerName',
                key: 'customerName',
              },
              {
                title: '手机号',
                dataIndex: 'customerPhone',
                key: 'customerPhone',
                render: (phone: string) => {
                  if (!phone) return '';
                  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
                }
              },
              {
                title: '配货状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: OrderType['status']) => (
                  <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
                )
              },
              {
                title: '下单时间',
                dataIndex: 'createTime',
                key: 'createTime',
              },
              {
                title: '货品',
                dataIndex: 'items',
                key: 'items',
                render: (items: OrderType['items']) => {
                  const text = items.map(item => 
                    `${item.name} ${item.quantity}${item.unit === 'box' ? '箱' : item.unit === 'jin' ? '斤' : '个'}`
                  ).join('，');
                  return (
                    <Tooltip title={text}>
                      <div style={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {text}
                      </div>
                    </Tooltip>
                  );
                }
              },
              {
                title: '备注',
                dataIndex: 'remark',
                key: 'remark',
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record: OrderType) => (
                  <Space>
                    <Button 
                      type="link" 
                      onClick={() => {
                        setSelectedOrder(record);
                        setActiveTab('detail');
                        setOrderDetailModalVisible(false);
                      }}
                    >
                      编辑
                    </Button>
                    {record.status !== 'settled' && (
                      <Popconfirm
                        title="确定要删除这个供货单吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="link" danger>删除</Button>
                      </Popconfirm>
                    )}
                  </Space>
                )
              }
            ]}
            dataSource={filteredOrders}
            rowKey="id"
          />
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

// 添加货品列表组件
interface ItemListProps {
  items: OrderItem[];
  defaultUnit: 'box' | 'jin' | 'piece';
  scaleWeight: number;
}

const ItemList: React.FC<ItemListProps> = ({ items, defaultUnit, scaleWeight }) => {
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: OrderItem) => (
        <AutoComplete
          value={record.name}
          placeholder="搜索商品"
          // TODO: 实现商品搜索功能
        />
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_: any, record: OrderItem) => (
        <InputNumber
          value={record.quantity}
          placeholder="库存: 0"
          onClick={() => {
            console.log('同步电子秤数据');
          }}
        />
      )
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: (_: any, record: OrderItem) => (
        <Select defaultValue={defaultUnit}>
          <Select.Option value="box">箱</Select.Option>
          <Select.Option value="jin">斤</Select.Option>
          <Select.Option value="piece">个</Select.Option>
        </Select>
      )
    },
    {
      title: '配送员',
      dataIndex: 'deliveryPerson',
      key: 'deliveryPerson',
      render: (_: any, record: OrderItem) => (
        <Select>
          {/* TODO: 根据权限显示配送员列表 */}
        </Select>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (_: any, record: OrderItem) => (
        <Input.TextArea />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: OrderItem) => (
        <Button type="link" danger>删除</Button>
      )
    }
  ];

  return (
    <Table<OrderItem>
      columns={columns}
      dataSource={items}
      rowKey="id"
      pagination={false}
    />
  );
};

export default SupplyOrders; 