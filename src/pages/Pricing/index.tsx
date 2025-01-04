import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, InputNumber, message, DatePicker, Typography, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ObjectPrice } from '../../types/objectDetail';
import { pageObjectPrice, updateObjectPrice } from '../../api/objectDetail';
import dayjs from 'dayjs';

const { Search } = Input;
const { Title } = Typography;

const Pricing: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<ObjectPrice | null>(null);
  const [priceData, setPriceData] = useState<ObjectPrice[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();

  // 获取价格列表
  const fetchPriceList = async (page: number, size: number, searchKey: string = '') => {
    setLoading(true);
    try {
      const filters: any = {
        startTime: selectedDate.startOf('day').valueOf(),
        endTime: selectedDate.endOf('day').valueOf()
      };

      if (searchKey) {
        filters.detailObjectName = searchKey;
      }

      const response = await pageObjectPrice({
        currentPage: page,
        pageSize: size,
        filters
      });

      if (response.data) {
        const items = response.data.items.map(item => ({
          ...item,
          updateTime: new Date(item.updateTime).getTime()
        }));

        setPriceData(items);
        setTotal(response.data.total);
      } else {
        message.error('获取价格列表失败');
      }
    } catch (error) {
      message.error('获取价格列表失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 搜索功能
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
    fetchPriceList(1, pageSize, value);
  };

  // 在组件加载时获取数据
  useEffect(() => {
    fetchPriceList(currentPage, pageSize, searchText);
  }, [currentPage, pageSize, selectedDate]);

  // 编辑价格
  const handleEdit = async (values: any) => {
    try {
      if (!currentItem) return;

      const response = await updateObjectPrice({
        objectDetailId: currentItem.objectDetailId,
        priceForAmount: values.priceForAmount,
        priceForBox: values.priceForBox,
        priceForJin: values.priceForJin
      });

      if (response.success) {
        message.success('价格更新成功');
        setEditModalVisible(false);
        form.resetFields();
        // 刷新列表
        fetchPriceList(currentPage, pageSize, searchText);
      } else {
        message.error(response.displayMsg || '价格更新失败');
      }
    } catch (error) {
      message.error('价格更新失败：' + (error as Error).message);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'objectDetailName',
      key: 'objectDetailName',
    },
    {
      title: '价格(个)',
      dataIndex: 'priceForAmount',
      key: 'priceForAmount',
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-'
    },
    {
      title: '价格(斤)',
      dataIndex: 'priceForJin',
      key: 'priceForJin',
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-'
    },
    {
      title: '价格(箱)',
      dataIndex: 'priceForBox',
      key: 'priceForBox',
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作人',
      dataIndex: 'updater',
      key: 'updater',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ObjectPrice) => (
        <Button type="link" onClick={() => {
          setCurrentItem(record);
          form.setFieldsValue({
            name: record.objectDetailName,
            priceForAmount: record.priceForAmount,
            priceForJin: record.priceForJin,
            priceForBox: record.priceForBox
          });
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
          onSearch={handleSearch}
          style={{ width: 200 }}
        />

        {/* 数据表格 */}
        <Table 
          columns={columns} 
          dataSource={priceData}
          rowKey="detailObjectId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Space>

      {/* 编辑价格弹窗 */}
      <Modal
        title="编辑价格"
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
            name="priceForAmount"
            label="价格(个)"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item
            name="priceForJin"
            label="价格(斤)"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item
            name="priceForBox"
            label="价格(箱)"
            rules={[{ required: true, message: '请输入价格' }]}
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