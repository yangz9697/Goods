import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Space, Button, Form, Row, Col, DatePicker, Input, Select, AutoComplete, Card, Tabs, Popconfirm, message, Table, InputNumber, Tag, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { formatPhone } from '../../utils/format';
import dayjs from 'dayjs';
import { orderApi } from '@/api/orders';
import { orderObjectApi, AddOrderObjectRequest } from '@/api/orderObject';
import type { ColumnsType } from 'antd/es/table';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  unitPrice: number;
  remark: string;
  deliveryName: string | undefined;
  objectDetailId: number;
}

interface NewOrderItem extends OrderItem {
  selectedObjectId?: number;
  inventory?: number;
}

interface ObjectOption {
  objectDetailId: number;
  objectDetailName: string;
}

interface OrderStatus {
  orderStatusCode: 'add' | 'wait' | 'ready' | 'waitCheck' | 'end';
  orderStatusName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  createTime: string;
  customerName: string;
  customerPhone: string;
  deliveryStatus: 'add' | 'wait' | 'ready' | 'waitCheck' | 'end';
  items: OrderItem[];
  totalPrice: number;
}

interface OrderInfo {
  orderSupplyDate: string;
  orderNo: string;
  orderStatus: 'wait' | 'processing' | 'completed';
  orderStatusName: string;
  remark: string;
  userId: number;
  userName: string;
  userMobile: string;
  createTime: number | null;
}

const OrderDetail: React.FC = () => {
  const { id: orderNo } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [order, setOrder] = useState<Order | null>(null);
  const [searchOptions, setSearchOptions] = useState<ObjectOption[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<NewOrderItem>({
    id: 'new-item',
    name: '',
    quantity: 0,
    unit: '斤',
    price: 0,
    unitPrice: 0,
    remark: '',
    deliveryName: undefined,
    objectDetailId: 0
  });
  const [statusList, setStatusList] = useState<OrderStatus[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const [deliveryUsers, setDeliveryUsers] = useState<{ label: string; value: string }[]>([]);

  const fetchOrderInfo = async () => {
    if (!orderNo) return;
    
    try {
      const res = await orderApi.getOrderInfo(orderNo);
      if (res.success) {
        setOrderInfo(res.data);
      } else {
        message.error(res.displayMsg || '获取供货单详情失败');
      }
    } catch (error) {
      message.error('获取供货单详情失败：' + (error as Error).message);
    }
  };

  const fetchOrderDetail = async () => {
    if (!orderNo) return;
    setLoading(true);
    try {
      const response = await orderObjectApi.getObjectListByOrderNo(orderNo);
      if (response.success && orderInfo) {
        const items = response.data.objectInfoList.map((item) => ({
          id: `item-${item.objectDetailId}`,
          name: item.objectDetailName,
          quantity: item.count,
          unit: item.unitName,
          price: item.price,
          unitPrice: item.unitPrice,
          remark: item.remark,
          deliveryName: item.deliveryName || undefined,
          objectDetailId: item.objectDetailId,
          totalPrice: item.totalPrice
        }));
        
        setOrder({
          id: orderNo,
          orderNumber: orderNo,
          date: dayjs(orderInfo.orderSupplyDate).format('YYYY-MM-DD'),
          createTime: dayjs(orderInfo.createTime).format('YYYY-MM-DD HH:mm:ss'),
          customerName: orderInfo.userName,
          customerPhone: orderInfo.userMobile,
          deliveryStatus: orderInfo.orderStatus as 'add' | 'wait' | 'ready' | 'waitCheck' | 'end',
          items,
          totalPrice: response.data.orderTotalPrice
        });
      } else {
        message.error(response.displayMsg || '获取订单详情失败');
      }
    } catch (error) {
      message.error('获取订单详情失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusList = async () => {
    try {
      const response = await orderApi.getOrderAllStatus();
      if (response.success) {
        setStatusList(response.data);
      } else {
        message.error(response.displayMsg || '获取状态列表失败');
      }
    } catch (error) {
      message.error('获取状态列表失败：' + (error as Error).message);
    }
  };

  const fetchDeliveryUsers = async () => {
    try {
      const response = await orderApi.selectDelivery();
      if (response.success) {
        setDeliveryUsers(
          response.data.map(user => ({
            label: `${user.name} (${user.username})`,
            value: user.name
          }))
        );
      }
    } catch (error) {
      message.error('获取配货员列表失败：' + (error as Error).message);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchOrderInfo();
      await fetchOrderDetail();
      await fetchStatusList();
      await fetchDeliveryUsers();
    };
    init();
  }, [orderNo]);

  const handleAdd = async (values: AddOrderObjectRequest) => {
    try {
      const response = await orderObjectApi.addOrderObject({
        ...values,
        orderNo: orderNo!
      });

      if (response.success) {
        message.success('添加成功');
        setIsAdding(false);
        setNewItem({
          id: 'new-item',
          name: '',
          quantity: 0,
          unit: '斤',
          price: 0,
          unitPrice: 0,
          remark: '',
          deliveryName: undefined,
          objectDetailId: 0,
          inventory: undefined
        });
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '添加失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleDeleteItem = async (objectDetailId: number) => {
    try {
      const response = await orderObjectApi.deleteOrderObject({
        objectDetailId,
        orderNo: orderNo!
      });

      if (response.success) {
        message.success('删除成功');
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '删除失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const searchObjects = async (keyword: string) => {
    if (!keyword) {
      setSearchOptions([]);
      return;
    }
    try {
      const response = await orderObjectApi.selectObjectByName(keyword);
      if (response.success) {
        setSearchOptions(response.data || []);
      } else {
        message.error(response.displayMsg || '搜索商品失败');
      }
    } catch (error) {
      message.error('搜索商品失败：' + (error as Error).message);
    }
  };

  const handleEdit = async (values: {
    count: number;
    objectDetailId: number;
    price: number;
    remark: string;
    unitName?: string;
    deliveryName?: string;
  }) => {
    try {
      const currentItem = order?.items.find(item => item.objectDetailId === values.objectDetailId);
      const response = await orderObjectApi.updateOrderObject({
        ...values,
        orderNo: orderNo!,
        objectDetailName: currentItem?.name || '',
        unitName: values.unitName || currentItem?.unit || '斤'
      });

      if (response.success) {
        message.success('编辑成功');
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '编辑失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const fetchInventory = async (objectDetailId: number, unitName: string) => {
    try {
      const response = await orderObjectApi.getObjectInventory(objectDetailId, unitName);
      if (response.success) {
        setNewItem(prev => ({
          ...prev,
          inventory: response.data === null ? 0 : response.data
        }));
      } else {
        message.error(response.displayMsg || '获取库存失败');
        setNewItem(prev => ({ ...prev, inventory: 0 }));
      }
    } catch (error) {
      message.error('获取库存失败：' + (error as Error).message);
      setNewItem(prev => ({ ...prev, inventory: 0 }));
    }
  };

  const handleDeleteOrder = async () => {
    try {
      const response = await orderApi.deleteOrder(orderNo!);
      if (response.success) {
        message.success('删除订单成功');
        navigate('/supply-orders/list');
      } else {
        message.error(response.displayMsg || '删除订单失败');
      }
    } catch (error) {
      message.error('删除订单失败：' + (error as Error).message);
    }
  };

  const handleStatusChange = async (statusCode: 'add' | 'wait' | 'ready' | 'waitCheck' | 'end') => {
    try {
      const response = await orderApi.updateOrderStatus({
        orderNo: orderNo!,
        orderStatusCode: statusCode
      });
      
      if (response.success) {
        message.success('更新状态成功');
        fetchOrderInfo();
      } else {
        message.error(response.displayMsg || '更新状态失败');
      }
    } catch (error) {
      message.error('更新状态失败：' + (error as Error).message);
    }
  };

  const handleUpdatePayStatus = async (statusCode: 'waitPay' | 'paySuccess') => {
    try {
      const response = await orderApi.updateOrderPayStatus({
        orderNo: orderNo!,
        orderPayStatusCode: statusCode
      });
      
      if (response.success) {
        message.success('更新支付状态成功');
        fetchOrderInfo();
      } else {
        message.error(response.displayMsg || '更新支付状态失败');
      }
    } catch (error) {
      message.error('更新支付状态失败：' + (error as Error).message);
    }
  };

  const getColumns = (): ColumnsType<NewOrderItem> => {
    const baseColumns: ColumnsType<NewOrderItem> = [
      {
        title: '商品名称',
        dataIndex: 'name',
        key: 'name',
        render: (_, record: NewOrderItem) => {
          if (record.id === 'new-item') {
            return (
              <Select
                showSearch
                placeholder="输入商品名称搜索"
                style={{ width: '100%' }}
                filterOption={false}
                onSearch={searchObjects}
                onChange={(_, option: any) => {
                  const selectedItem = option.data;
                  setNewItem({
                    id: 'new-item',
                    name: selectedItem.objectDetailName,
                    selectedObjectId: selectedItem.objectDetailId,
                    quantity: 0,
                    unit: '斤',
                    price: 0,
                    unitPrice: 0,
                    remark: '',
                    deliveryName: undefined,
                    objectDetailId: 0,
                    inventory: undefined
                  });
                  fetchInventory(selectedItem.objectDetailId, '斤');
                }}
                options={searchOptions.map(item => ({
                  label: item.objectDetailName,
                  value: item.objectDetailId,
                  data: item
                }))}
              />
            );
          }
          return record.name;
        }
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        render: (_, record: NewOrderItem) => {
          if (record.id === 'new-item') {
            return (
              <Space>
                <InputNumber
                  value={record.quantity}
                  style={{ width: '100px' }}
                  disabled={!record.selectedObjectId}
                  onChange={(value) => {
                    setNewItem(prev => ({
                      ...prev,
                      quantity: value || 0
                    }));
                  }}
                  onBlur={() => {
                    if (newItem.selectedObjectId && newItem.quantity > 0) {
                      handleAdd({
                        objectDetailId: newItem.selectedObjectId,
                        objectDetailName: newItem.name,
                        count: newItem.quantity,
                        unitName: newItem.unit,
                        price: 0,
                        remark: '',
                        orderNo: orderNo!
                      });
                    }
                  }}
                />
                {record.selectedObjectId && (
                  <Tag color="blue">
                    库存: {record.inventory || 0} {record.unit}
                  </Tag>
                )}
              </Space>
            );
          }
          return (
            <InputNumber
              defaultValue={record.quantity}
              onBlur={(e) => {
                const newValue = Number(e.target.value);
                if (newValue !== record.quantity) {
                  handleEdit({
                    objectDetailId: record.objectDetailId,
                    count: newValue,
                    price: record.price,
                    remark: record.remark
                  });
                }
              }}
            />
          );
        }
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        render: (_, record: NewOrderItem) => (
          <Input
            defaultValue={record.remark}
            onBlur={(e) => {
              const newValue = e.target.value;
              if (newValue !== record.remark) {
                handleEdit({
                  objectDetailId: record.objectDetailId,
                  count: record.quantity,
                  price: record.price,
                  remark: newValue
                });
              }
            }}
          />
        ),
      },
      {
        title: '配货员',
        dataIndex: 'deliveryName',
        key: 'deliveryName',
        render: (_, record: NewOrderItem) => (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            placeholder="选择配货员"
            defaultValue={record.deliveryName}
            options={deliveryUsers}
            onChange={(value) => {
              handleEdit({
                objectDetailId: record.objectDetailId,
                count: record.quantity,
                price: record.price,
                remark: record.remark,
                deliveryName: value
              });
            }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        ),
      },
    ];

    // 管理员可见的额外列
    if (isAdmin) {
      baseColumns.push(
        {
          title: '单价',
          dataIndex: 'price',
          key: 'price',
          render: (_, record: NewOrderItem) => (
            <Space>
              <InputNumber
                defaultValue={record.price}
                min={0}
                precision={2}
                style={{ width: 100 }}
                onBlur={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (newValue !== record.price) {
                    handleEdit({
                      objectDetailId: record.objectDetailId,
                      count: record.quantity,
                      price: newValue,
                      remark: record.remark,
                      deliveryName: record.deliveryName
                    });
                  }
                }}
              />
              <Tag color="blue">今日价: {record.unitPrice}</Tag>
            </Space>
          ),
        },
        {
          title: '金额',
          dataIndex: 'totalPrice',
          key: 'totalPrice',
          render: (_, record: any) => (
            <span>{record.totalPrice?.toFixed(2) || '-'}</span>
          ),
        }
      );
    }

    baseColumns.push({
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (_, record: NewOrderItem) => (
        <Popconfirm
          title="确定要删除这个货品吗？"
          onConfirm={() => handleDeleteItem(record.objectDetailId)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    });

    return baseColumns;
  };

  const bulkColumns: ColumnsType<NewOrderItem> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (_, record: NewOrderItem) => {
        if (record.id === 'new-item') {
          return (
            <Select
              showSearch
              placeholder="输入商品名称搜索"
              style={{ width: '100%' }}
              filterOption={false}
              onSearch={searchObjects}
              onChange={(_, option: any) => {
                const selectedItem = option.data;
                setNewItem({
                  id: 'new-item',
                  name: selectedItem.objectDetailName,
                  selectedObjectId: selectedItem.objectDetailId,
                  quantity: 0,
                  unit: '箱',
                  price: 0,
                  unitPrice: 0,
                  remark: '',
                  deliveryName: undefined,
                  objectDetailId: 0,
                  inventory: undefined
                });
                fetchInventory(selectedItem.objectDetailId, '箱');
              }}
              options={searchOptions.map(item => ({
                label: item.objectDetailName,
                value: item.objectDetailId,
                data: item
              }))}
            />
          );
        }
        return record.name;
      }
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_, record: NewOrderItem) => {
        if (record.id === 'new-item') {
          return (
            <Space>
              <InputNumber
                value={record.quantity}
                style={{ width: '100px' }}
                disabled={!record.selectedObjectId}
                onChange={(value) => {
                  setNewItem(prev => ({
                    ...prev,
                    quantity: value || 0
                  }));
                }}
                onBlur={() => {
                  if (newItem.selectedObjectId && newItem.quantity > 0) {
                    handleAdd({
                      objectDetailId: newItem.selectedObjectId,
                      objectDetailName: newItem.name,
                      count: newItem.quantity,
                      unitName: newItem.unit,
                      price: 0,
                      remark: '',
                      orderNo: orderNo!
                    });
                  }
                }}
              />
              {record.selectedObjectId && (
                <Tag color="blue">
                  库存: {record.inventory || 0} {record.unit}
                </Tag>
              )}
            </Space>
          );
        }
        return (
          <InputNumber
            defaultValue={record.quantity}
            onBlur={(e) => {
              const newValue = Number(e.target.value);
              if (newValue !== record.quantity) {
                handleEdit({
                  objectDetailId: record.objectDetailId,
                  count: newValue,
                  price: record.price,
                  remark: record.remark
                });
              }
            }}
          />
        );
      }
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: () => '箱'
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (_, record: NewOrderItem) => (
        <Input
          defaultValue={record.remark}
          onBlur={(e) => {
            const newValue = e.target.value;
            if (newValue !== record.remark) {
              handleEdit({
                objectDetailId: record.objectDetailId,
                count: record.quantity,
                price: record.price,
                remark: newValue
              });
            }
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: NewOrderItem) => (
        <Popconfirm
          title="确定要删除这个货品吗？"
          onConfirm={() => handleDeleteItem(record.objectDetailId)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (loading) {
    return <Spin size="large" />;
  }

  if (!orderInfo || !order) {
    return <Spin size="large" />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 顶部控制区域 */}
      <Row gutter={16}>
        {/* 电子秤 */}
        <Col span={4}>
          <Card>
            <div style={{ textAlign: 'center' }}>
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
        <Col span={20}>
          <Card bodyStyle={{ padding: '16px 24px' }}>
            {/* 筛选项 */}
            <div style={{ marginBottom: 16 }}>
              <Form layout="inline">
                <Form.Item label="日期" name="date" style={{ marginBottom: 8 }}>
                  <DatePicker 
                    style={{ width: 130 }}
                    value={dayjs(order.date)}
                    onChange={(date) => date && setOrder({
                      ...order,
                      date: date.format('YYYY-MM-DD')
                    })}
                  />
                </Form.Item>
                <Form.Item label="下单时间" style={{ marginBottom: 8 }}>
                  <Input 
                    disabled 
                    value={order.createTime} 
                    style={{ width: 160 }} 
                  />
                </Form.Item>
                <Form.Item
                  label="配货状态"
                  name="deliveryStatus"
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    style={{ width: 100 }}
                    value={order.deliveryStatus}
                    onChange={handleStatusChange}
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
                    <AutoComplete
                      value={order.customerName}
                      placeholder="搜索客户"
                      style={{ width: 120 }}
                    />
                    <span>{formatPhone(order.customerPhone)}</span>
                  </Space>
                </Form.Item>
              </Form>
            </div>

            {/* 操作按钮 */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Space wrap size="small">
                {isAdmin && (
                  <>
                    <Button 
                      type="primary"
                      onClick={() => handleUpdatePayStatus('waitPay')}
                    >
                      计算金额
                    </Button>
                    <Button 
                      type="primary"
                      onClick={() => handleUpdatePayStatus('paySuccess')}
                    >
                      结算完成
                    </Button>
                  </>
                )}
                <Button onClick={() => console.log('打印:', order.id)}>打印</Button>
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

      {/* 商品列表 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: '全部',
              children: (
                <>
                  <Table
                    loading={loading}
                    dataSource={[
                      ...order.items,
                      ...(isAdding && activeTab === 'all' ? [newItem] : [])
                    ]}
                    rowKey="id"
                    pagination={false}
                    columns={getColumns()}
                  />
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => setIsAdding(true)}
                    style={{ marginTop: 16, marginBottom: 16 }}
                    disabled={isAdding}
                  >
                    添加货品
                  </Button>
                  {isAdmin && (
                    <Row justify="end">
                      <Col>
                        <Space size="large">
                          <span style={{ fontSize: 16 }}>
                            <strong>总计：</strong>
                          </span>
                          <span style={{ fontSize: 16, color: '#1890ff' }}>
                            <strong>￥{order.totalPrice.toFixed(2)}</strong>
                          </span>
                        </Space>
                      </Col>
                    </Row>
                  )}
                </>
              )
            },
            {
              key: 'bulk',
              label: '大货',
              children: (
                <>
                  <Table
                    loading={loading}
                    dataSource={[
                      ...order.items.filter(item => item.unit === '箱'),
                      ...(isAdding && activeTab === 'bulk' ? [newItem] : [])
                    ]}
                    rowKey="id"
                    pagination={false}
                    columns={bulkColumns}
                  />
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => setIsAdding(true)}
                    style={{ marginTop: 16 }}
                    disabled={isAdding}
                  >
                    添加大货
                  </Button>
                </>
              )
            }
          ]}
        />
      </Card>
    </Space>
  );
};

export default OrderDetail; 