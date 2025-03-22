import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Input, Select, Row, Col, Statistic, message } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/api/dashboard';
import locale from 'antd/es/date-picker/locale/zh_CN';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface PaymentData {
  userId: number;
  name: string;
  mobile: string;
  totalPrice: number;
  waitPayPrice: number;
  paySuccessPrice: number;
}

interface PaymentListProps {
  onUserSelect: (userId: string) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({ }) => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [searchText, setSearchText] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'all' | 'paySuccess' | 'waitPay'>('all');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    totalWaitPayPrice: number;
    userPayInfoList: PaymentData[];
  }>({
    totalWaitPayPrice: 0,
    userPayInfoList: []
  });

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getPaymentData({
        startTime: dateRange[0].startOf('day').valueOf(),
        endTime: dateRange[1].endOf('day').valueOf(),
        keyword: searchText || undefined,
        tenant: localStorage.getItem('tenant') || undefined,
        payStatus: paymentStatus === 'all' ? undefined : paymentStatus
      });

      if (response.success) {
        setPaymentData(response.data);
      } else {
        message.error(response.displayMsg || '获取付款数据失败');
      }
    } catch (error) {
      message.error('获取付款数据失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [dateRange, searchText, paymentStatus]);

  // 用户卡片列表
  const renderUserCards = () => {

    return (
      <Row gutter={[16, 16]}>
        {paymentData.userPayInfoList.map(user => (
          <Col span={8} key={user.userId}>
            <Card 
              size="small"
              className="user-card"
              onClick={() => {
                navigate(`/dashboard/payment?tab=detail&userId=${user.userId}`);
              }}
              style={{ cursor: 'pointer' }}
              hoverable
              loading={loading}
            >
              <div style={{ marginBottom: 8 }}>
                <strong>{user.name}</strong>
                <span style={{ marginLeft: 8, color: '#666' }}>{user.mobile}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                总金额：¥{user.totalPrice.toFixed(2)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#52c41a' }}>
                  已付：¥{user.paySuccessPrice.toFixed(2)}
                </span>
                <span style={{ color: '#f5222d', marginLeft: 16 }}>
                  待付：¥{user.waitPayPrice.toFixed(2)}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Card title="付款情况">
      <Row gutter={16}>
        <Col span={8}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!, dates[1]!]);
              }
            }}
            locale={locale}
            allowClear={false}
            ranges={{
              '最近7天': [dayjs().subtract(7, 'days'), dayjs()],
              '最近30天': [dayjs().subtract(30, 'days'), dayjs()],
              '本月': [dayjs().startOf('month'), dayjs()],
              '上月': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
            }}
          />
        </Col>
        <Col span={8}>
          <Search
            placeholder="搜索姓名/手机号"
            onSearch={setSearchText}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select
            style={{ width: '100%' }}
            value={paymentStatus}
            onChange={setPaymentStatus}
          >
            <Option value="all">全部</Option>
            <Option value="paySuccess">已结清</Option>
            <Option value="waitPay">待结清</Option>
          </Select>
        </Col>
      </Row>

      <div style={{ margin: '16px 0' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card bodyStyle={{ padding: '12px 24px' }} loading={loading}>
              <Statistic
                title="总待付金额"
                value={paymentData.totalWaitPayPrice}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {renderUserCards()}
    </Card>
  );
};

export default PaymentList; 