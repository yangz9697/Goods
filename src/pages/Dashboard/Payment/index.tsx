import React, { useState, useEffect } from 'react';
import { Tabs, Card } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PaymentList from './components/PaymentList';
import PaymentDetail from './components/PaymentDetail';
import MonthlyOrders from './components/MonthlyOrders';

const DashboardPayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'list';
  const userId = searchParams.get('userId');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(userId);
  const [selectedMonth, setSelectedMonth] = useState<{ startTime: number; endTime: number } | null>(null);

  useEffect(() => {
    setSelectedUserId(userId);
  }, [userId]);

  const handleTabChange = (key: string) => {
    if (key === 'list') {
      setSelectedUserId(null);
      setSelectedMonth(null);
      navigate('/dashboard/payment?tab=list');
    } else if (key === 'detail' && selectedUserId) {
      setSelectedMonth(null);
      navigate(`/dashboard/payment?tab=detail&userId=${selectedUserId}`);
    }
  };

  const items = [
    {
      key: 'list',
      label: '付款列表',
      children: (
        <PaymentList 
          onUserSelect={(id) => {
            setSelectedUserId(id);
            navigate(`/dashboard/payment?tab=detail&userId=${id}`);
          }}
        />
      ),
    },
    {
      key: 'detail',
      label: '付款详情',
      children: selectedUserId ? (
        <PaymentDetail 
          userId={selectedUserId}
          onMonthClick={(record) => {
            setSelectedMonth(record);
            navigate(`/dashboard/payment?tab=monthly&userId=${selectedUserId}`);
          }}
        />
      ) : (
        <Card>请从付款列表选择用户查看详情</Card>
      ),
      disabled: !selectedUserId
    },
    {
      key: 'monthly',
      label: '月度订单列表',
      children: selectedMonth && selectedUserId ? (
        <MonthlyOrders 
          userId={selectedUserId}
          startTime={selectedMonth.startTime}
          endTime={selectedMonth.endTime}
        />
      ) : null,
      disabled: !selectedMonth || !selectedUserId
    }
  ];

  return (
    <div style={{ padding: '0 12px' }}>
      <Tabs 
        activeKey={activeTab} 
        items={items}
        onChange={handleTabChange}
      />
    </div>
  );
};

export default DashboardPayment; 