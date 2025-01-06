import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Space, Button, Form, Row, Col, DatePicker, Input, Select, AutoComplete, Card, Tabs, Popconfirm, message, Table, InputNumber, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getOrderDetail, deleteOrder, getOrderAllStatus, updateOrderStatus } from '../../api/orders';
import { addOrderObject, updateOrderObject, deleteOrderObject, selectObjectByName, getObjectInventory } from '../../api/orderObject';
import { formatPhone } from '../../utils/format';
import dayjs from 'dayjs';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  unitPrice: number;
  remark: string;
  deliveryName: string | null;
  objectDetailId: number;
}

interface NewOrderItem extends OrderItem {
  selectedObjectId?: number;
  inventory?: number;
}

interface ApiOrderItem {
  count: number;
  createTime: number;
  creator: string;
  deliveryName: string | null;
  objectDetailId: number;
  objectDetailName: string;
  price: number;
  remark: string;
  unitName: string;
  unitPrice: number;
  updateTime: number;
  updater: string;
}

interface ObjectOption {
  objectDetailId: number;
  objectDetailName: string;
}

interface UnitOption {
  unitId: number;
  unitName: string;
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
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderState = {
    updateTime: Number(searchParams.get('updateTime')),
    customerName: searchParams.get('customerName') || '',
    customerPhone: searchParams.get('customerPhone') || '',
    orderStatusCode: searchParams.get('orderStatusCode') as 'add' | 'wait' | 'ready' | 'waitCheck' | 'end'
  };
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [order, setOrder] = useState<{
    id: string;
    orderNumber: string;
    date: string;
    createTime: string;
    customerName: string;
    customerPhone: string;
    deliveryStatus: 'add' | 'wait' | 'ready' | 'waitCheck' | 'end';
    items: OrderItem[];
  } | null>(null);
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
    deliveryName: null,
    objectDetailId: 0
  });
  const [statusList, setStatusList] = useState<OrderStatus[]>([]);

  const fetchOrderDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getOrderDetail(id);
      if (response.success) {
        const items = (response.data || []).map((item: ApiOrderItem) => ({
          id: `item-${item.objectDetailId}`,
          name: item.objectDetailName,
          quantity: item.count,
          unit: item.unitName,
          price: item.price,
          unitPrice: item.unitPrice,
          remark: item.remark,
          deliveryName: item.deliveryName,
          objectDetailId: item.objectDetailId
        }));
        
        setOrder({
          id,
          orderNumber: id,
          date: dayjs().format('YYYY-MM-DD'),
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          customerName: orderState?.customerName || '',
          customerPhone: orderState?.customerPhone || '',
          deliveryStatus: orderState?.orderStatusCode || 'wait',
          items
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

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  useEffect(() => {
    const fetchStatusList = async () => {
      try {
        const response = await getOrderAllStatus();
        if (response.success) {
          setStatusList(response.data);
        }
      } catch (error) {
        console.error('获取订单状态失败:', error);
      }
    };

    fetchStatusList();
  }, []);

  const handleAdd = async (values: {
    objectDetailId: number;
    objectDetailName: string;
    count: number;
    unitName: string;
    price: number;
    remark: string;
  }) => {
    try {
      const response = await addOrderObject({
        ...values,
        orderNo: id!
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
          deliveryName: null,
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
      const response = await deleteOrderObject({
        objectDetailId,
        orderNo: id!
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
      const response = await selectObjectByName(keyword);
      if (response.success) {
        setSearchOptions(response.data || []);
      } else {
        console.error('搜索商品失败:', response.displayMsg);
      }
    } catch (error) {
      console.error('搜索商品失败:', (error as Error).message);
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
      const response = await updateOrderObject({
        ...values,
        orderNo: id!
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
      const response = await getObjectInventory(objectDetailId, unitName);
      if (response.success) {
        console.log('库存查询结果:', response.data);
        setNewItem(prev => {
          const inventory = response.data === null ? 0 : response.data;
          console.log('设置库存:', inventory);
          return {
            ...prev,
            inventory
          };
        });
      } else {
        console.error('库存查询失败:', response.displayMsg);
        setNewItem(prev => ({
          ...prev,
          inventory: 0
        }));
      }
    } catch (error) {
      console.error('获取库存失败:', (error as Error).message);
      setNewItem(prev => ({
        ...prev,
        inventory: 0
      }));
    }
  };

  const handleDeleteOrder = async () => {
    try {
      const response = await deleteOrder(id!);
      if (response.success) {
        message.success('删除订单成功');
        navigate(-1);
      } else {
        message.error(response.displayMsg || '删除订单失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleStatusChange = async (statusCode: 'add' | 'wait' | 'ready' | 'waitCheck' | 'end') => {
    try {
      const response = await updateOrderStatus({
        orderNo: id!,
        orderStatusCode: statusCode
      });
      
      if (response.success) {
        message.success('更新状态成功');
        setOrder(prev => prev ? {
          ...prev,
          deliveryStatus: statusCode
        } : null);
      } else {
        message.error(response.displayMsg || '更新状态失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
          </Space>
        </Card>
      </Col>

      <Col span={18}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form
            layout="vertical"
            initialValues={{
              date: dayjs(order.date),
              customerName: order.customerName,
              deliveryStatus: order.deliveryStatus
            }}
          >
            <Row gutter={16}>
              <Col span={5}>
                <Form.Item label="日期" name="date">
                  <DatePicker 
                    style={{ width: '100%' }}
                    onChange={(date) => date && setOrder({
                      ...order,
                      date: date.format('YYYY-MM-DD')
                    })}
                  />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item label="下单时间">
                  <Input disabled value={order.createTime} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label="配货状态"
                  name="deliveryStatus"
                  rules={[{ required: true, message: '请选择配货状态' }]}
                >
                  <Select
                    onChange={(value) => {
                      handleStatusChange(value);
                    }}
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
              </Col>
              <Col span={9}>
                <Form.Item label="客户信息">
                  <Space>
                    <AutoComplete
                      value={order.customerName}
                      placeholder="搜索客户姓名或手机号"
                      style={{ width: 200 }}
                      // TODO: 实现客户搜索功能
                    />
                    <span>{formatPhone(order.customerPhone)}</span>
                  </Space>
                </Form.Item>
              </Col>
            </Row>

            <Card>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'all',
                    label: '全部',
                    children: (
                      <Table
                        loading={loading}
                        dataSource={[...(order.items || []), ...(isAdding ? [newItem] : [])]}
                        rowKey="id"
                        pagination={false}
                        columns={[
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
                                        deliveryName: null,
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
                                            remark: ''
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
                            render: (_, record: NewOrderItem) => {
                              if (record.id === 'new-item') {
                                return (
                                  <Select
                                    value={record.unit}
                                    style={{ width: 80 }}
                                    onChange={(value) => {
                                      setNewItem(prev => ({
                                        ...prev,
                                        unit: value
                                      }));
                                      if (record.selectedObjectId) {
                                        fetchInventory(record.selectedObjectId, value);
                                      }
                                    }}
                                  >
                                    <Select.Option value="斤">斤</Select.Option>
                                    <Select.Option value="箱">箱</Select.Option>
                                    <Select.Option value="个">个</Select.Option>
                                  </Select>
                                );
                              }
                              return (
                                <Select
                                  defaultValue={record.unit}
                                  style={{ width: 80 }}
                                  onChange={(value) => {
                                    handleEdit({
                                      objectDetailId: record.objectDetailId,
                                      count: record.quantity,
                                      price: record.price,
                                      remark: record.remark,
                                      unitName: value
                                    });
                                  }}
                                >
                                  <Select.Option value="斤">斤</Select.Option>
                                  <Select.Option value="箱">箱</Select.Option>
                                  <Select.Option value="个">个</Select.Option>
                                </Select>
                              );
                            }
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
                              <Input
                                defaultValue={record.deliveryName || ''}
                                onBlur={(e) => {
                                  const newValue = e.target.value;
                                  if (newValue !== record.deliveryName) {
                                    handleEdit({
                                      objectDetailId: record.objectDetailId,
                                      count: record.quantity,
                                      price: record.price,
                                      remark: record.remark,
                                      deliveryName: newValue
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
                        ]}
                      />
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
                          columns={[
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
                                          deliveryName: null,
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
                                              remark: ''
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
                          ]}
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
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => setIsAdding(true)}
                style={{ marginTop: 16 }}
                disabled={isAdding}
              >
                添加货品
              </Button>
            </Card>

            <Row justify="end" style={{ marginTop: 16 }}>
              <Space>
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
            </Row>
          </Form>
        </Space>
      </Col>
    </Row>
  );
};

export default OrderDetail; 