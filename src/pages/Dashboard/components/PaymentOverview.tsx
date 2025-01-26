import React, { useState, useMemo } from 'react';
import { Card, DatePicker, Input, Select, Row, Col, Button, Modal, Table, Tag, message, Statistic } from 'antd';
import { mockPaymentData } from '@/mock/dashboard';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

interface PaymentDetail {
  id: number;
  name: string;
  mobile: string;
  monthlyDetails: Array<{
    month: number;
    paid: number;
    unpaid: number;
    orders: Array<{
      id: string;
      date: string;
      amount: number;
      status: string;
    }>;
  }>;
}

const PaymentOverview: React.FC = () => {
  const [year, setYear] = useState(dayjs().year());
  const [searchText, setSearchText] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PaymentDetail | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

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
            <Card size="small">
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
              <Button 
                type="link" 
                onClick={() => {
                  setSelectedUser(user);
                  setDetailVisible(true);
                }}
              >
                查看详情
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // 用户详情弹窗
  const renderDetailModal = () => {
    if (!selectedUser) return null;

    const columns = [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        render: (month: number) => `${month}月`,
      },
      {
        title: '已付金额',
        dataIndex: 'paid',
        key: 'paid',
        render: (amount: number) => `¥${amount.toFixed(2)}`,
      },
      {
        title: '待付金额',
        dataIndex: 'unpaid',
        key: 'unpaid',
        render: (amount: number) => `¥${amount.toFixed(2)}`,
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: any) => (
          <Button 
            type="link"
            onClick={() => setSelectedMonth(record.month)}
          >
            查看订单
          </Button>
        ),
      },
    ];

    return (
      <Modal
        title={`${selectedUser.name} - 付款详情`}
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedMonth(null);
          setSelectedOrders([]);
        }}
        width={800}
        footer={null}
      >
        <Table
          columns={columns}
          dataSource={selectedUser.monthlyDetails}
          rowKey="month"
          pagination={false}
        />

        {selectedMonth && (
          <Card title={`${selectedMonth}月订单列表`} style={{ marginTop: 16 }}>
            <Table
              rowSelection={{
                type: 'checkbox',
                onChange: (selectedRowKeys) => {
                  setSelectedOrders(selectedRowKeys as string[]);
                },
              }}
              columns={[
                {
                  title: '订单日期',
                  dataIndex: 'date',
                  key: 'date',
                },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount: number) => `¥${amount.toFixed(2)}`,
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={status === 'paid' ? 'green' : 'red'}>
                      {status === 'paid' ? '已付款' : '待付款'}
                    </Tag>
                  ),
                },
              ]}
              dataSource={selectedUser.monthlyDetails
                .find(d => d.month === selectedMonth)?.orders || []}
              rowKey="id"
              pagination={false}
              footer={() => (
                <div style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    disabled={selectedOrders.length === 0}
                    onClick={() => {
                      message.success('结算成功');
                      setSelectedOrders([]);
                    }}
                  >
                    批量结算
                  </Button>
                </div>
              )}
            />
          </Card>
        )}
      </Modal>
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
      {renderDetailModal()}
    </Card>
  );
};

export default PaymentOverview; 