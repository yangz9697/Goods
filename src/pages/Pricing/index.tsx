import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, InputNumber, message, DatePicker, Typography, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Search } = Input;
const { Title } = Typography;

interface PriceItem {
  id: string;
  name: string;
  jinPrice: number;
  boxPrice: number;
  piecePrice: number;
  yesterdayJinPrice?: number;
  yesterdayBoxPrice?: number;
  yesterdayPiecePrice?: number;
  operator: string;
  updateTime: string;
}

// 模拟数据
const mockPriceData: PriceItem[] = [
  {
    id: '1',
    name: '大白菜',
    jinPrice: 5,
    boxPrice: 100,
    piecePrice: 0,
    yesterdayJinPrice: 4.5,
    yesterdayBoxPrice: 90,
    yesterdayPiecePrice: 0,
    operator: '张三',
    updateTime: '2024-03-14 10:00:00'
  }
];

const Pricing: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<PriceItem | null>(null);
  const [priceData, setPriceData] = useState<PriceItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [form] = Form.useForm();

  useEffect(() => {
    // 加载模拟数据
    setPriceData(mockPriceData);
  }, []);

  // 搜索功能
  const filteredData = priceData.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 编辑价格
  const handleEdit = async (values: any) => {
    try {
      if (!currentItem) return;

      const updatedItem = {
        ...currentItem,
        jinPrice: values.jinPrice,
        boxPrice: values.boxPrice,
        piecePrice: values.piecePrice,
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator: '当前用户' // TODO: 替换为实际登录用户
      };

      setPriceData(priceData.map(item => 
        item.id === currentItem.id ? updatedItem : item
      ));

      message.success('价格更新成功');
      setEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('价格更新失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '单价(斤)',
      dataIndex: 'jinPrice',
      key: 'jinPrice',
      render: (price: number, record: PriceItem) => (
        <Space direction="vertical" size={0}>
          <span>{price}</span>
          {record.yesterdayJinPrice && (
            <span style={{ fontSize: '12px', color: '#999' }}>
              昨日价格：{record.yesterdayJinPrice}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '单价(箱)',
      dataIndex: 'boxPrice',
      key: 'boxPrice',
      render: (price: number, record: PriceItem) => (
        <Space direction="vertical" size={0}>
          <span>{price}</span>
          {record.yesterdayBoxPrice && (
            <span style={{ fontSize: '12px', color: '#999' }}>
              昨日价格：{record.yesterdayBoxPrice}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '单价(个)',
      dataIndex: 'piecePrice',
      key: 'piecePrice',
      render: (price: number, record: PriceItem) => (
        <Space direction="vertical" size={0}>
          <span>{price}</span>
          {record.yesterdayPiecePrice && (
            <span style={{ fontSize: '12px', color: '#999' }}>
              昨日价格：{record.yesterdayPiecePrice}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PriceItem) => (
        <Button type="link" onClick={() => {
          setCurrentItem(record);
          form.setFieldsValue(record);
          setEditModalVisible(true);
        }}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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

        {/* 搜索框 */}
        <Search
          placeholder="请输入商品名称"
          onSearch={value => setSearchText(value)}
          style={{ width: 200 }}
        />

        {/* 数据表格 */}
        <Table 
          columns={columns} 
          dataSource={filteredData}
          rowKey="id"
        />
      </Space>

      {/* 编辑价格弹窗 */}
      <Modal
        title="编辑菜品价格"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleEdit}>
          <Form.Item
            name="name"
            label="名称"
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="jinPrice"
            label="单价(斤)"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item
            name="boxPrice"
            label="单价(箱)"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item
            name="piecePrice"
            label="单价(个)"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Pricing; 