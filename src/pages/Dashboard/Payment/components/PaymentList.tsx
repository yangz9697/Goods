import React, { useState, useMemo } from 'react';
import { Card, DatePicker, Input, Select, Row, Col, Statistic } from 'antd';
import { mockPaymentData } from '@/mock/dashboard';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState(dayjs().year());
  const [searchText, setSearchText] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');

  // 计算总待付金额
  const totalUnpaidAmount = useMemo(() => {
    const filteredUsers = mockPaymentData.list.filter(user => {
      const matchSearch = searchText ? 
        user.name.includes(searchText) || user.mobile.includes(searchText) : true;
      const matchStatus = paymentStatus === 'all' ? true :
        paymentStatus === 'paid' ? user.unpaidAmount === 0 : user.unpaidAmount > 0;
      return matchSearch && matchStatus;
    });

    return filteredUsers.reduce((sum, user) => sum + user.unpaidAmount, 0);
  }, [searchText, paymentStatus]);

  // 用户卡片列表
  const renderUserCards = () => {
    const filteredUsers = mockPaymentData.list.filter(user => {
      const matchSearch = searchText ? 
        user.name.includes(searchText) || user.mobile.includes(searchText) : true;
      const matchStatus = paymentStatus === 'all' ? true :
        paymentStatus === 'paid' ? user.unpaidAmount === 0 : user.unpaidAmount > 0;
      return matchSearch && matchStatus;
    });

    return (
      <Row gutter={[16, 16]}>
        {filteredUsers.map(user => (
          <Col span={8} key={user.id}>
            <Card 
              size="small"
              className="user-card"
              onClick={() => {
                navigate(`/dashboard/payment?tab=detail&userId=${user.id}`);
              }}
              style={{ cursor: 'pointer' }}
              hoverable
            >
              <div style={{ marginBottom: 8 }}>
                <strong>{user.name}</strong>
                <span style={{ marginLeft: 8, color: '#666' }}>{user.mobile}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                总金额：¥{user.totalAmount.toFixed(2)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#52c41a' }}>
                  已付：¥{user.paidAmount.toFixed(2)}
                </span>
                <span style={{ color: '#f5222d', marginLeft: 16 }}>
                  待付：¥{user.unpaidAmount.toFixed(2)}
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
        <Col span={4}>
          <DatePicker
            picker="year"
            value={dayjs().year(year)}
            onChange={(date) => date && setYear(date.year())}
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
            <Option value="paid">已结清</Option>
            <Option value="unpaid">未结清</Option>
          </Select>
        </Col>
      </Row>

      <div style={{ margin: '16px 0' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card bodyStyle={{ padding: '12px 24px' }}>
              <Statistic
                title="总待付金额"
                value={totalUnpaidAmount}
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