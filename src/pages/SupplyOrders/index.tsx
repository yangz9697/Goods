import React from 'react';
import { Tabs, Space, Typography, Tag } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

const { Title } = Typography;

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

const SupplyOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 判断当前是否在详情页
  const isDetailPage = location.pathname.includes('/detail/');

  const handleTabChange = (key: string) => {
    navigate(key);
  };

  return (
    <div>
      {/* 只在非详情页显示日期 */}
      {!isDetailPage && (
        <Space align="center" style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {dayjs().format('YYYY年MM月DD日')}
              <Tag color="red" style={{ marginLeft: 8 }}>今天</Tag>
            </div>
          </Title>
        </Space>
      )}

      <Tabs
        activeKey={location.pathname.split('/')[2] || ''}
        onChange={handleTabChange}
        items={[
          {
            label: '按客户查看',
            key: '',
          },
          {
            label: '供货单列表',
            key: 'list',
          }
        ]}
      />
      <Outlet />
    </div>
  );
};

export default SupplyOrders; 