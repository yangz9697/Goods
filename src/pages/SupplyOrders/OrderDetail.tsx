import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Space, Button, Typography, Tag, Form, Row, Col, DatePicker, Input, Select, AutoComplete, Card, Tabs, Popconfirm, message, Table, Modal, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getOrderDetail } from '../../api/orders';
import { formatPhone } from '../../utils/format';
import dayjs from 'dayjs';

const { Title } = Typography;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  unitPrice: number;
  remark: string;
  deliveryName: string | null;
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

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [order, setOrder] = useState<{
    id: string;
    orderNumber: string;
    date: string;
    createTime: string;
    customerName: string;
    customerPhone: string;
    deliveryStatus: 'preparing' | 'adding' | 'checking' | 'completed';
    items: OrderItem[];
  } | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  const [searchOptions, setSearchOptions] = useState<ObjectOption[]>([]);

  const fetchOrderDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getOrderDetail(id);
      if (response.success) {
        const items = (response.data || []).map((item: ApiOrderItem) => ({
          id: String(item.objectDetailId),
          name: item.objectDetailName,
          quantity: item.count,
          unit: item.unitName === '斤' ? 'jin' : item.unitName === '箱' ? 'box' : 'piece',
          price: item.price,
          unitPrice: item.unitPrice,
          remark: item.remark,
          deliveryName: item.deliveryName
        }));
        
        setOrder({
          id,
          orderNumber: id,
          date: dayjs().format('YYYY-MM-DD'),
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          customerName: '',
          customerPhone: '',
          deliveryStatus: 'preparing',
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

  const handleAdd = async (values: {
    objectDetailId: number;
    objectDetailName: string;
    count: number;
    unitName: string;
    price: number;
    remark: string;
  }) => {
    try {
      const response = await fetch('http://139.224.63.0:8000/erp/orderObject/addOrderObject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-domain-id': '1000'
        },
        body: JSON.stringify({
          ...values,
          orderNo: id
        })
      });

      const data = await response.json();
      if (data.success) {
        message.success('添加成功');
        setAddModalVisible(false);
        addForm.resetFields();
        fetchOrderDetail(); // 重新获取订单详情
      } else {
        message.error(data.displayMsg || '添加失败');
      }
    } catch (error) {
      message.error('添加失败: ' + (error as Error).message);
    }
  };

  const searchObjects = async (keyword: string) => {
    if (!keyword) {
      setSearchOptions([]);
      return;
    }
    try {
      const response = await fetch(`http://139.224.63.0:8000/erp/orderObject/selectObjectByName?keyword=${encodeURIComponent(keyword)}`, {
        headers: {
          'x-domain-id': '1000'
        }
      });
      const data = await response.json();
      if (data.success) {
        setSearchOptions(data.data || []);
      }
    } catch (error) {
      console.error('搜索商品失败:', error);
    }
  };

  const handleObjectSelect = (option: ObjectOption) => {
    addForm.setFieldsValue({
      objectDetailId: option.objectDetailId,
      objectDetailName: option.objectDetailName
    });
  };

  if (!order) {
    return null;
  }

  const renderQuantity = (record: OrderItem) => {
    return `${record.quantity}${record.unit === 'jin' ? '斤' : record.unit === 'box' ? '箱' : '个'}`;
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <Tag color="blue" style={{ fontSize: '16px' }}>
              电子秤: 0 斤
            </Tag>
            <Button onClick={() => console.log('打印:', order.id)}>打印</Button>
            <Button onClick={() => console.log('导出:', order.id)}>导出PDF</Button>
            {order.deliveryStatus !== 'completed' && (
              <Popconfirm
                title="确定要删除这个供货单吗？"
                onConfirm={() => {
                  console.log('删除订单:', order.id);
                  navigate(-1);
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
            date: dayjs(order.date),
            customerName: order.customerName,
            deliveryStatus: order.deliveryStatus
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
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
            <Col span={6}>
              <Form.Item label="供货单号">
                <Input disabled value={order.orderNumber} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="下单时间">
                <Input disabled value={order.createTime} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="配货状态"
                name="deliveryStatus"
                rules={[{ required: true, message: '请选择配货状态' }]}
              >
                <Select
                  onChange={(value) => setOrder({
                    ...order,
                    deliveryStatus: value
                  })}
                >
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
                value={order.customerName}
                placeholder="搜索客户姓名或手机号"
                // TODO: 实现客户搜索功能
              />
              <span>{formatPhone(order.customerPhone)}</span>
            </Space>
          </Form.Item>

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
                      dataSource={order.items}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: '商品名称',
                          dataIndex: 'name',
                          key: 'name',
                        },
                        {
                          title: '数量',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          render: (_, record: OrderItem) => record.quantity,
                        },
                        {
                          title: '单位',
                          dataIndex: 'unit',
                          key: 'unit',
                          render: (_, record: OrderItem) => record.unit === 'jin' ? '斤' : record.unit === 'box' ? '箱' : '个',
                        },
                        {
                          title: '备注',
                          dataIndex: 'remark',
                          key: 'remark',
                        },
                        {
                          title: '配货员',
                          dataIndex: 'deliveryName',
                          key: 'deliveryName',
                        },
                        {
                          title: '操作',
                          key: 'action',
                          render: (_, record: OrderItem) => (
                            <Space>
                              <Button type="link" onClick={() => {
                                console.log('编辑商品:', record);
                              }}>
                                编辑
                              </Button>
                              <Button type="link" danger onClick={() => {
                                console.log('删除商品:', record);
                              }}>
                                删除
                              </Button>
                            </Space>
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
                    <Table
                      loading={loading}
                      dataSource={order.items.filter(item => item.unit === 'box')}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: '商品名称',
                          dataIndex: 'name',
                          key: 'name',
                        },
                        {
                          title: '数量',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          render: (_: unknown, record: OrderItem) => `${record.quantity}箱`,
                        },
                        {
                          title: '操作',
                          key: 'action',
                          render: (_, record: OrderItem) => (
                            <Space>
                              <Button type="link" onClick={() => {
                                // TODO: 实现编辑功能
                                console.log('编辑商品:', record);
                              }}>
                                编辑
                              </Button>
                              <Button type="link" danger onClick={() => {
                                // TODO: 实现删除功能
                                console.log('删除商品:', record);
                              }}>
                                删除
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  )
                }
              ]}
            />
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              style={{ marginTop: 16 }}
            >
              添加货品
            </Button>
          </Card>
        </Form>
      </Space>

      <Modal
        title="添加货品"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
          setSearchOptions([]);
        }}
        footer={null}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAdd}
        >
          <Form.Item
            label="搜索商品"
            required
          >
            <Select
              showSearch
              placeholder="输入商品名称搜索"
              filterOption={false}
              onSearch={searchObjects}
              onChange={(_, option: any) => handleObjectSelect(option.data)}
              options={searchOptions.map(item => ({
                label: item.objectDetailName,
                value: item.objectDetailId,
                data: item
              }))}
            />
          </Form.Item>

          <Form.Item
            label="商品ID"
            name="objectDetailId"
            hidden
          >
            <InputNumber />
          </Form.Item>

          <Form.Item
            label="商品名称"
            name="objectDetailName"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="数量"
            name="count"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="单位"
            name="unitName"
            rules={[{ required: true, message: '请选择单位' }]}
          >
            <Select>
              <Select.Option value="斤">斤</Select.Option>
              <Select.Option value="箱">箱</Select.Option>
              <Select.Option value="个">个</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="价格"
            name="price"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setAddModalVisible(false);
                addForm.resetFields();
                setSearchOptions([]);
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetail; 