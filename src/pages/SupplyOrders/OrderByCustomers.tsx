import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Space, Input, Button, message, Tag, Modal, Form } from 'antd';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { orderApi } from '@/api/orders';
import dayjs from 'dayjs';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import AddOrderModal from './components/AddOrderModal';
import { formatPhone } from '@/utils/format';
import { OrderStatusMap } from '@/types/order';
import { OrderInfo } from '@/api/orders';

interface ContextType {
  selectedDate: dayjs.Dayjs;
  dateChanged: string | null;
}

interface CustomerOrder {
  userId: number;
  userName: string | null;
  mobile: string | null;
  orderInfoList: OrderInfo[];
}

const SupplyOrderList: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDate, dateChanged } = useOutletContext<ContextType>();
  const [form] = Form.useForm();
  const [customerOrders, setCustomerOrders] = useState<Array<{
    userId: number;
    userName: string | null;
    mobile: string | null;
    orderInfoList: OrderInfo[];
  }>>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    userId: number;
    userName: string | null;
    mobile: string | null;
    label: string;
  } | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<CustomerOrder | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // 添加一个标记首次加载的 ref
  const isFirstLoad = useRef(true);

  // 获取供货单列表
  const fetchData = useCallback(async (keyword: string = '') => {
    setLoading(true);
    try {
      const response = await orderApi.queryObjectOrder({
        startTime: selectedDate.startOf('day').valueOf(),
        endTime: selectedDate.endOf('day').valueOf(),
        keyWord: keyword || undefined
      });

      if (response.success) {
        setCustomerOrders(response.data);
      } else {
        message.error(response.displayMsg || '获取供货单列表失败');
      }
    } catch (error) {
      message.error('获取供货单列表失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isFirstLoad.current) {
      fetchData(searchText);
      isFirstLoad.current = false;
    }
  }, [fetchData]);

  // 监听日期变化
  useEffect(() => {
    fetchData(searchText);
  }, [selectedDate, dateChanged]);

  const handleSearch = () => {
    fetchData(searchText);
  };

  const handleReset = () => {
    form.setFieldsValue({
      keyword: '',
      dateRange: dayjs()
    });
    setSearchText('');
    fetchData('');
  };

  const handleOrderListClick = (customer: CustomerOrder) => {
    // 如果只有一个订单，直接跳转到订单详情
    if (customer.orderInfoList.length === 1) {
      navigate(`/supply-orders/detail/${customer.orderInfoList[0].orderNo}`);
      return;
    }
    // 否则展开订单列表
    setExpandedCustomer(expandedCustomer?.userId === customer.userId ? null : customer);
  };

  // 表头和数据行的通用样式
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '100px 70px 1fr 50px',  // 减小订单号和状态列宽，让备注列占据更多空间
    gap: '8px',
    padding: '8px 4px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center'
  };

  // 订单号列的样式
  const orderNoStyle = {
    display: 'flex', 
    alignItems: 'center',
    minWidth: 0,
    fontSize: '12px'  // 减小字体大小
  };

  // 加急标签的样式
  const urgentTagStyle = {
    marginRight: 2,
    padding: '0 2px',
    fontSize: '12px',
    lineHeight: '16px',
    transform: 'scale(0.9)'  // 稍微缩小标签
  };

  // 文本溢出的通用样式
  const ellipsisStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '13px',  // 增加字体大小
    lineHeight: '1.5'  // 增加行高
  };

  // 表头样式
  const headerStyle = {
    ...gridStyle,
    fontSize: '13px',
    color: '#666',
    fontWeight: 500  // 加粗表头
  };

  // 添加卡片头部颜色判断函数
  const getCardHeaderStyle = (customer: CustomerOrder) => {
    if (!customer.orderInfoList || customer.orderInfoList.length === 0) {
      return { backgroundColor: '#f5f5f5' };  // 没有订单时显示灰色
    }
    
    const hasUrgentOrder = customer.orderInfoList.some(order => order.isUrgent);
    if (hasUrgentOrder) {
      return { backgroundColor: '#fff1f0' };  // 有加急订单时显示红色背景
    }
    
    return { backgroundColor: '#ffffff' };  // 有普通订单时显示白色
  };

  // 修改渲染客户卡片的函数
  const renderCustomerCard = (customer: CustomerOrder) => (
    <div 
      style={{ 
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s',
        height: '100%'
      }}
      onClick={() => handleOrderListClick(customer)}
    >
      {/* 卡片头部 */}
      <div style={{ 
        ...getCardHeaderStyle(customer),
        padding: '16px 24px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <span style={{ fontWeight: 'bold' }}>
              {customer.userName || '未命名客户'}
            </span>
            <span style={{ color: '#666' }}>
              {formatPhone(customer.mobile || '')}
            </span>
          </Space>
          {customer.orderInfoList.slice(0, 2).map(order => (
            <div key={order.orderNo} style={{ width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: order.totalObjectCount > 0 ? '4px' : 0
              }}>
                {order.totalObjectCount > 0 && (
                  <>
                    <span>{order.orderNo}</span>
                    <span>{order.deliveryCount}/{order.totalObjectCount}</span>
                  </>
                )}
              </div>
              {order.totalObjectCount > 0 && (
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(order.deliveryCount / order.totalObjectCount) * 100}%`,
                    height: '100%',
                    backgroundColor: '#1890ff',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}
            </div>
          ))}
        </Space>
      </div>

      {/* 卡片内容 */}
      <div style={{ padding: '16px 24px' }}>
        {/* 订单列表 */}
        <div style={{ marginBottom: 16 }}>
          {/* 表头 */}
          <div style={headerStyle}>
            <span>订单号</span>
            <span>状态</span>
            <span>备注</span>
            <span>操作</span>
          </div>
          
          {customer.orderInfoList.slice(0, 2).map(order => (
            <div key={order.orderNo} style={gridStyle}>
              <span style={orderNoStyle}>
                {order.isUrgent && (
                  <Tag color="red" style={urgentTagStyle}>急</Tag>
                )}
                <span style={ellipsisStyle}>
                  {order.orderNo}
                </span>
              </span>
              <span style={ellipsisStyle}>{OrderStatusMap[order.orderStatus]}</span>
              <span style={{
                ...ellipsisStyle,
                color: '#666'  // 备注文字颜色调淡
              }}>{order.remark || '无备注'}</span>
              <div onClick={e => e.stopPropagation()}>
                {order.isUrgent ? (
                  <Button 
                    type="link" 
                    size="small"
                    onClick={async () => {
                      try {
                        const response = await orderApi.cancelUrgentOrder(order.orderNo);
                        if (response.success) {
                          message.success('取消加急成功');
                          fetchData(searchText);
                          // 更新弹窗内的数据
                          if (expandedCustomer) {
                            setExpandedCustomer({
                              ...expandedCustomer,
                              orderInfoList: expandedCustomer.orderInfoList.map(o => 
                                o.orderNo === order.orderNo 
                                  ? { ...o, isUrgent: false } 
                                  : o
                              )
                            });
                          }
                        } else {
                          message.error(response.displayMsg || '取消加急失败');
                        }
                      } catch (error) {
                        message.error('取消加急失败：' + (error as Error).message);
                      }
                    }}
                  >
                    取消加急
                  </Button>
                ) : (
                  <Button 
                    type="link" 
                    size="small"
                    onClick={async () => {
                      try {
                        const response = await orderApi.updateOrderUrgent({
                          orderNo: order.orderNo,
                          isUrgent: true
                        });
                        if (response.success) {
                          message.success('设置加急成功');
                          fetchData(searchText);
                          // 更新弹窗内的数据
                          if (expandedCustomer) {
                            setExpandedCustomer({
                              ...expandedCustomer,
                              orderInfoList: expandedCustomer.orderInfoList.map(o => 
                                o.orderNo === order.orderNo 
                                  ? { ...o, isUrgent: true } 
                                  : o
                              )
                            });
                          }
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
            e.stopPropagation();
            setIsAddModalVisible(true);
            setSelectedCustomer({
              userId: customer.userId,
              userName: customer.userName,
              mobile: customer.mobile,
              label: `${customer.userName || '未命名客户'} (${formatPhone(customer.mobile || '')})`
            });
          }}
        >
          新建供货单
        </Button>
      </div>
    </div>
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16 }}
        preserve={false}
      >
        <Form.Item name="keyword">
          <Input
            placeholder="搜索姓名或手机号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
            >
              添加供货单
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 客户列表 */}
      <Row gutter={[16, 16]} style={{ opacity: loading ? 0.5 : 1 }}>
        {customerOrders.map(customer => (
          <Col key={customer.userId} xs={24} sm={24} md={12} lg={8}>
            {renderCustomerCard(customer)}
          </Col>
        ))}
      </Row>

      <AddOrderModal
        visible={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          setSelectedCustomer(null);
        }}
        onSuccess={() => {
          setIsAddModalVisible(false);
          setSelectedCustomer(null);
          fetchData(searchText);
        }}
        defaultCustomer={selectedCustomer || undefined}  // 使用 undefined 而不是 null
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
              gridTemplateColumns: '130px 70px 1fr 50px',  // 保持与卡片中的列宽一致
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
                  gridTemplateColumns: '130px 70px 1fr 50px',
                  gap: '8px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  alignItems: 'center'
                }}
                onClick={() => {
                  navigate(`/supply-orders/detail/${order.orderNo}`);  // 直接导航到订单详情
                  setExpandedCustomer(null);  // 关闭弹窗
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {order.isUrgent && (
                    <Tag color="red" style={{ marginRight: 8 }}>加急</Tag>
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.orderNo}
                  </span>
                </span>
                <span>{OrderStatusMap[order.orderStatus]}</span>
                <span style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{order.remark || '无备注'}</span>
                <div onClick={e => e.stopPropagation()}>  {/* 阻止冒泡，避免触发行点击 */}
                  {order.isUrgent ? (
                    <Button 
                      type="link" 
                      size="small"
                      onClick={async () => {
                        try {
                          const response = await orderApi.cancelUrgentOrder(order.orderNo);
                          if (response.success) {
                            message.success('取消加急成功');
                            fetchData(searchText);
                            // 更新弹窗内的数据
                            if (expandedCustomer) {
                              setExpandedCustomer({
                                ...expandedCustomer,
                                orderInfoList: expandedCustomer.orderInfoList.map(o => 
                                  o.orderNo === order.orderNo 
                                    ? { ...o, isUrgent: false } 
                                    : o
                                )
                              });
                            }
                          } else {
                            message.error(response.displayMsg || '取消加急失败');
                          }
                        } catch (error) {
                          message.error('取消加急失败：' + (error as Error).message);
                        }
                      }}
                    >
                      取消加急
                    </Button>
                  ) : (
                    <Button 
                      type="link" 
                      size="small"
                      onClick={async () => {
                        try {
                          const response = await orderApi.updateOrderUrgent({
                            orderNo: order.orderNo,
                            isUrgent: true
                          });
                          if (response.success) {
                            message.success('设置加急成功');
                            fetchData(searchText);
                            // 更新弹窗内的数据
                            if (expandedCustomer) {
                              setExpandedCustomer({
                                ...expandedCustomer,
                                orderInfoList: expandedCustomer.orderInfoList.map(o => 
                                  o.orderNo === order.orderNo 
                                    ? { ...o, isUrgent: true } 
                                    : o
                                )
                              });
                            }
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