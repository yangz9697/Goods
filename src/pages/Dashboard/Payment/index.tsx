import React from 'react';
import { Tabs } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PaymentList from './components/PaymentList';
import PaymentDetail from './components/PaymentDetail';
import MonthlyOrders from './components/MonthlyOrders';

const DashboardPayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'list';
  const userId = searchParams.get('userId');
  const month = searchParams.get('month');

  const items = [
    {
      key: 'list',
      label: '付款列表',
      children: <PaymentList />,
    },
    {
      key: 'detail',
      label: '付款详情',
      children: <PaymentDetail userId={userId} onMonthClick={(month) => {
        navigate(`/dashboard/payment?tab=monthly&userId=${userId}&month=${month}`);
      }} />,
      disabled: true  // 禁用手动切换
    },
    {
      key: 'monthly',
      label: '月度订单列表',
      children: <MonthlyOrders userId={userId} month={month} />,
      disabled: true  // 禁用手动切换
    },
  ];

  const handleTabChange = (key: string) => {
    // 只允许切换到付款列表
    if (key === 'list') {
      navigate('/dashboard/payment?tab=list');
    }
  };

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