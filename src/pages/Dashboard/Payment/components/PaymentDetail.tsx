import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, DatePicker, message, Row, Col, Statistic } from 'antd';
import { dashboardApi } from '@/api/dashboard';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { PaymentDetailInfo } from '@/api/dashboard';

interface PaymentDetailProps {
  userId: string | null;
  onMonthClick: (record: { startTime: number; endTime: number }) => void;
}

interface PaymentDetailData {
  userId: number;
  name: string;
  mobile: string;
  totalPrice: number;
  totalWaitPayPrice: number;
  totalPaySuccessPrice: number;
  payDetailInfoList: PaymentDetailInfo[];
}

const PaymentDetail: React.FC<PaymentDetailProps> = ({ userId, onMonthClick }) => {
  const [year, setYear] = useState(dayjs().year());
  const [loading, setLoading] = useState(false);
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetailData | null>(null);

  const fetchPaymentDetail = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const startTime = dayjs().year(year).startOf('year').valueOf();
      const endTime = dayjs().year(year).endOf('year').valueOf();

      const response = await dashboardApi.getUserPaymentDetail({
        startTime,
        endTime,
        userId: parseInt(userId)
      });

      if (response.success) {
        const data = response.data;
        setPaymentDetail({
          userId: data.userId,
          name: data.name,
          mobile: data.mobile,
          totalPrice: data.totalPrice,
          totalWaitPayPrice: data.totalWaitPayPrice,
          totalPaySuccessPrice: data.totalPaySuccessPrice,
          payDetailInfoList: data.payDetailInfoList
        });
      } else {
        message.error(response.displayMsg || '获取付款详情失败');
      }
    } catch (error) {
      message.error('获取付款详情失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const memoizedFetchPaymentDetail = useCallback(fetchPaymentDetail, [userId, year]);

  useEffect(() => {
    memoizedFetchPaymentDetail();
  }, [memoizedFetchPaymentDetail]);

  if (!userId || !paymentDetail) {
    return <Card>请从付款列表选择用户查看详情</Card>;
  }

  const columns = [
    {
      title: '月份',
      dataIndex: 'dateDesc',
      key: 'dateDesc',
    },
    {
      title: '已付金额',
      dataIndex: 'paySuccessPrice',
      key: 'paySuccessPrice',
      render: (amount: string) => `¥${amount}`,
    },
    {
      title: '待付金额',
      dataIndex: 'waitPayPrice',
      key: 'waitPayPrice',
      render: (amount: string) => `¥${amount}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => {
        return (
          <Button 
            type="link"
            onClick={() => onMonthClick(record)}
          >
            查看订单
          </Button>
        );
      },
      onCell: () => ({ style: { padding: 0 } })
    },
  ];

  return (
    <Card 
      title={`${paymentDetail.name} - 付款详情`}
      extra={
        <DatePicker
          picker="year"
          value={dayjs().year(year)}
          onChange={(date) => date && setYear(date.year())}
          locale={locale}
        />
      }
      loading={loading}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card bodyStyle={{ padding: '12px 24px' }}>
            <Statistic
              title="总金额"
              value={paymentDetail.totalPrice}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '12px 24px' }}>
            <Statistic
              title="已付金额"
              value={paymentDetail.totalPaySuccessPrice}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bodyStyle={{ padding: '12px 24px' }}>
            <Statistic
              title="待付金额"
              value={paymentDetail.totalWaitPayPrice}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={paymentDetail.payDetailInfoList}
        rowKey="dateDesc"
        pagination={false}
      />
    </Card>
  );
};

export default PaymentDetail; 