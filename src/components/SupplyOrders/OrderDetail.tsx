import React from 'react';
import { Space, Button, Typography, Tag, Form, Row, Col, DatePicker, Input, Select, AutoComplete, Card, Tabs, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { OrderType, OrderItem } from '../../types/order';
import { ItemList } from './ItemList';
import { formatPhone } from '../../utils/format';

const { Title } = Typography;

interface OrderDetailProps {
  order: OrderType;
  scaleWeight: number;
  onBack: () => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void;
  onExport: (id: string) => void;
  onOrderChange: (id: string, updates: Partial<OrderType>) => void;
  onItemChange: (orderId: string, itemId: string, updates: Partial<OrderItem>) => void;
  onItemDelete: (orderId: string, itemId: string) => void;
  onItemAdd: (orderId: string) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  scaleWeight,
  onBack,
  onDelete,
  onPrint,
  onExport,
  onOrderChange,
  onItemChange,
  onItemDelete,
  onItemAdd
}) => {
  const [activeTab, setActiveTab] = React.useState('all');

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <Tag color="blue" style={{ fontSize: '16px' }}>
              电子秤: {scaleWeight} 斤
            </Tag>
            <Button onClick={() => onPrint(order.id)}>打印</Button>
            <Button onClick={() => onExport(order.id)}>导出PDF</Button>
            {order.deliveryStatus !== 'settled' && (
              <Popconfirm
                title="确定要删除这个供货单吗？"
                onConfirm={() => {
                  onDelete(order.id);
                  onBack();
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
            customerId: order.customerId,
            customerName: order.customerName,
            deliveryStatus: order.deliveryStatus
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="日期" name="date">
                <DatePicker 
                  style={{ width: '100%' }}
                  onChange={(date) => date && onOrderChange(order.id, {
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
                  onChange={(value) => onOrderChange(order.id, { deliveryStatus: value })}
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
                    <ItemList
                      items={order.items}
                      defaultUnit="jin"
                      scaleWeight={scaleWeight}
                      onItemChange={(itemId, updates) => onItemChange(order.id, itemId, updates)}
                      onItemDelete={(itemId) => onItemDelete(order.id, itemId)}
                    />
                  )
                },
                {
                  key: 'bulk',
                  label: '大货',
                  children: (
                    <ItemList
                      items={order.items.filter(item => item.unit === 'box')}
                      defaultUnit="box"
                      scaleWeight={scaleWeight}
                      onItemChange={(itemId, updates) => onItemChange(order.id, itemId, updates)}
                      onItemDelete={(itemId) => onItemDelete(order.id, itemId)}
                    />
                  )
                }
              ]}
            />
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => onItemAdd(order.id)}
              style={{ marginTop: 16 }}
            >
              添加货品
            </Button>
          </Card>
        </Form>
      </Space>
    </div>
  );
}; 