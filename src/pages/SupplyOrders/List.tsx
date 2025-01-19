import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Space, DatePicker, Input, Button, message, Tag, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { OrderModal } from '../../components/SupplyOrders/OrderModal';
import { queryObjectOrder, addObjectOrder, updateOrderUrgent } from '../../api/orders';
import dayjs from 'dayjs';

const { Search } = Input;

interface QueryObjectOrderRequest {
  startTime: number;
  endTime: number;
  keyWord?: string;
}

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
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<typeof customerOrders[0] | null>(null);

  // 获取供货单列表
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await queryObjectOrder({
        startTime: selectedDate.startOf('day').valueOf(),
        endTime: selectedDate.endOf('day').valueOf(),
        keyWord: searchText || undefined
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
    if (!values.userId) {
      message.error('请选择客户');
      return;
    }

    try {
      const response = await addObjectOrder({
        orderSupplyDate: (values.date || selectedDate).format('YYYY-MM-DD'),
        remark: values.remark || '',
        userId: Number(values.userId)
      });

      if (response?.success) {
        message.success('供货单创建成功');
        setAddModalVisible(false);
        setSelectedCustomer(null);
        fetchOrders();
        if (response.data?.orderNo) {
          navigate(`/supply-orders/order/${response.data.orderNo}`);
        }
      } else {
        message.error(response?.displayMsg || '创建供货单失败');
      }
    } catch (error) {
      message.error('创建供货单失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 渲染客户卡片
  const renderCustomerCard = (customer: typeof customerOrders[0]) => (
    <Card
      title={
        <Space>
          <span>{customer.userName || '未命名客户'}</span>
          <span style={{ color: '#666' }}>{customer.mobile}</span>
        </Space>
      }
      hoverable
      onClick={() => {
        // 如果只有一个订单，直接进入订单详情
        if (customer.orderInfoList.length === 1) {
          navigate(`/supply-orders/order/${customer.orderInfoList[0].orderNo}`);
        } else if (customer.orderInfoList.length > 1) {
          // 如果有多个订单，展开订单列表
          setExpandedCustomer(customer);
        }
      }}
    >
      {/* 订单列表 */}
      <div style={{ marginBottom: 16 }}>
        {/* 表头 */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 2fr auto',
          gap: '8px',
          padding: '8px 0',
          borderBottom: '1px solid #f0f0f0',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>订单号</span>
          <span>状态</span>
          <span>备注</span>
          <span>操作</span>
        </div>
        
        {/* 订单数据 */}
        {customer.orderInfoList.slice(0, 2).map(order => (
          <div key={order.orderNo} style={{ 
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 2fr auto',
            gap: '8px',
            padding: '8px 0',
            borderBottom: '1px solid #f0f0f0',
            alignItems: 'center'
          }}>
            <span>
              {order.isUrgent && (
                <Tag color="red" style={{ marginRight: 8 }}>加急</Tag>
              )}
              {order.orderNo}
            </span>
            <span>{order.orderStatus}</span>
            <span style={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>{order.remark || '无备注'}</span>
            <div>
              {!order.isUrgent && (
                <Button 
                  type="link" 
                  size="small"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const response = await updateOrderUrgent({
                        orderNo: order.orderNo,
                        isUrgent: true
                      });
                      
                      if (response.success) {
                        message.success('设置加急成功');
                        fetchOrders();
                      } else {
                        message.error(response.displayMsg || '设置加急失败');
                      }
                    } catch (error) {
                      message.error('设置加急失败：' + (error as Error).message);
                    }
                  }}
                >
                  加急
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* 如果有更多订单，显示省略号 */}
        {customer.orderInfoList.length > 2 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '8px 0',
            color: '#999',
            fontSize: '12px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            ···
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <Button 
        type="dashed" 
        block
        onClick={(e) => {
          e.stopPropagation();  // 阻止卡片点击事件
          setAddModalVisible(true);
          // 传入当前客户信息到 OrderModal
          const selectedCustomer = {
            id: String(customer.userId),
            name: customer.userName || '',
            phone: customer.mobile || ''
          };
          setSelectedCustomer(selectedCustomer);  // 需要添加这个状态
        }}
      >
        新建供货单
      </Button>
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
        onCancel={() => {
          setAddModalVisible(false);
          setSelectedCustomer(null);  // 关闭时清空选中的客户
        }}
        onSubmit={handleAddOrder}
        selectedCustomer={selectedCustomer}  // 传入选中的客户
        defaultDate={selectedDate}
      />

      {/* 订单列表弹窗 */}
      <Modal
        title={`${expandedCustomer?.userName || '未命名客户'}的订单列表`}
        open={!!expandedCustomer}
        onCancel={() => setExpandedCustomer(null)}
        footer={null}
        width={800}
      >
        {expandedCustomer && (
          <div>
            {/* 表头 */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 2fr auto',
              gap: '8px',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              fontWeight: 'bold'
            }}>
              <span>订单号</span>
              <span>状态</span>
              <span>备注</span>
              <span>操作</span>
            </div>
            
            {/* 订单列表 */}
            {expandedCustomer.orderInfoList.map(order => (
              <div 
                key={order.orderNo} 
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 2fr auto',
                  gap: '8px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  alignItems: 'center',
                  ':hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
                onClick={() => {
                  navigate(`/supply-orders/order/${order.orderNo}`);
                  setExpandedCustomer(null);
                }}
              >
                <span>
                  {order.isUrgent && (
                    <Tag color="red" style={{ marginRight: 8 }}>加急</Tag>
                  )}
                  {order.orderNo}
                </span>
                <span>{order.orderStatus}</span>
                <span style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{order.remark || '无备注'}</span>
                <div onClick={e => e.stopPropagation()}>
                  {!order.isUrgent && (
                    <Button 
                      type="link" 
                      size="small"
                      onClick={async () => {
                        try {
                          const response = await updateOrderUrgent({
                            orderNo: order.orderNo,
                            isUrgent: true
                          });
                          
                          if (response.success) {
                            message.success('设置加急成功');
                            fetchOrders();
                          } else {
                            message.error(response.displayMsg || '设置加急失败');
                          }
                        } catch (error) {
                          message.error('设置加急失败：' + (error as Error).message);
                        }
                      }}
                    >
                      加急
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Space>
  );
};

export default SupplyOrderList; 