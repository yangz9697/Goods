import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Space, DatePicker, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { OrderModal } from '../../components/SupplyOrders/OrderModal';
import { queryObjectOrder, addObjectOrder } from '../../api/orders';
import dayjs from 'dayjs';

const { Search } = Input;

const SupplyOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Array<{
    userId: number;
    userName: string | null;
    mobile: string | null;
    orderInfoList: Array<{
      orderNo: string;
      orderStatus: 'wait' | 'processing' | 'completed';
      remark: string;
      isUrgent: boolean;
      updateTime: number;
    }>;
  }>>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 获取供货单列表
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await queryObjectOrder({
        startTime: selectedDate.startOf('day').valueOf(),
        endTime: selectedDate.endOf('day').valueOf()
      });

      if (response.success) {
        setCustomerOrders(response.data);
      } else {
        message.error(response.displayMsg || '获取供货单列表失败');
      }
    } catch (error) {
      message.error('获取供货单列表失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 当日期改变时重新获取数据
  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchOrders();
  };

  // 处理日期变化
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // 处理重置
  const handleReset = () => {
    setSelectedDate(dayjs());
    setSearchText('');
    fetchOrders();
  };

  // 处理新建供货单
  const handleAddOrder = async (values: any) => {
    try {
      const response = await addObjectOrder({
        orderSupplyDate: values.date.format('YYYY-MM-DD'),
        remark: values.remark || '',
        userId: Number(values.customerId)
      });

      if (response.success) {
        message.success('供货单创建成功');
        setAddModalVisible(false);
        // 刷新列表
        fetchOrders();
        // 跳转到新创建的订单详情页
        if (response.data?.orderNo) {
          navigate(`/supply-orders/order/${response.data.orderNo}`);
        }
      } else {
        message.error(response.displayMsg || '创建供货单失败');
      }
    } catch (error) {
      message.error('创建供货单失败：' + (error as Error).message);
    }
  };

  // 渲染客户卡片
  const renderCustomerCard = (customer: typeof customerOrders[0]) => (
    <Card
      title={customer.userName || '未命名客户'}
      extra={customer.mobile}
      hoverable
      onClick={() => navigate(`/supply-orders/customer/${customer.userId}?name=${encodeURIComponent(customer.userName || '')}&date=${selectedDate.format('YYYY-MM-DD')}`)}
    >
      <p>最近订单：{customer.orderInfoList.length}个</p>
      {customer.orderInfoList.slice(0, 2).map(order => (
        <div key={order.orderNo} style={{ marginBottom: 8 }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            fontSize: '12px',
            color: '#666'
          }}>
            <span>{order.orderNo}</span>
            <span>{order.isUrgent ? '加急' : '普通'}</span>
          </div>
          <div style={{ fontSize: '14px' }}>{order.remark || '无备注'}</div>
        </div>
      ))}
      {customer.orderInfoList.length > 2 && (
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>...</div>
      )}
    </Card>
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* 日期筛选和搜索 */}
      <Card>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            style={{ width: 200 }}
            allowClear={false}
          />
          <Search
            placeholder="搜索姓名或手机号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
            enterButton
          />
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" onClick={() => setAddModalVisible(true)}>
            新建供货单
          </Button>
        </Space>
      </Card>

      {/* 客户列表 */}
      <Row gutter={[16, 16]} style={{ opacity: isLoading ? 0.5 : 1 }}>
        {customerOrders.map(customer => (
          <Col key={customer.userId} xs={24} sm={12} md={8} lg={6}>
            {renderCustomerCard(customer)}
          </Col>
        ))}
      </Row>

      {/* 新建供货单弹窗 */}
      <OrderModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSubmit={handleAddOrder}
        selectedCustomer={null}
        defaultDate={selectedDate}
      />
    </Space>
  );
};

export default SupplyOrderList; 