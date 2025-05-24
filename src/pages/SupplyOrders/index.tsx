import React, { useState } from 'react';
import { Tabs, ConfigProvider } from 'antd';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';
import './index.less';


// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

// 本地存储的 key
const SUPPLY_ORDER_DATE_KEY = 'supply_order_date';

// interface ContextType {
//   selectedDate: dayjs.Dayjs;
//   dateChanged: string | null;
//   handleDateChange: (date: dayjs.Dayjs | null) => void;
//   isToday: boolean;
//   getDisabledDate: (current: dayjs.Dayjs) => boolean;
// }

const SupplyOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = localStorage.getItem('role');
  
  // 从本地存储获取日期，如果没有则使用当天
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(() => {
    const savedDate = localStorage.getItem(SUPPLY_ORDER_DATE_KEY);
    return savedDate ? dayjs(savedDate) : dayjs();
  });

  // 当日期变化时，保存到本地存储
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      // 保存到本地存储
      localStorage.setItem(SUPPLY_ORDER_DATE_KEY, date.format('YYYY-MM-DD'));
      // 更新 URL 参数
      searchParams.set('date', date.format('YYYY-MM-DD'));
      setSearchParams(searchParams);
      // 添加一个 timestamp 参数来触发子组件重新搜索
      searchParams.set('timestamp', Date.now().toString());
      setSearchParams(searchParams);
    }
  };

  // 判断当前是否在详情页
  const isDetailPage = location.pathname.includes('/detail/');

  // 根据路径判断当前激活的 tab
  const getActiveKey = () => {
    if (location.pathname.includes('/list')) {
      return 'list';
    }
    return 'customers';
  };

  const handleTabChange = (key: string) => {
    if (key === 'list') {
      navigate('/supply-orders/list');
    } else {
      navigate('/supply-orders');
    }
  };

  const isToday = selectedDate.isSame(dayjs(), 'day');

  // 计算最早可选日期
  const getDisabledDate = (current: dayjs.Dayjs) => {
    if (role === 'admin') {
      return false; // 管理员可以选择任意日期
    }
    // 非管理员用户最早只能选择前天
    return current && current < dayjs().subtract(1, 'day').startOf('day');
  };

  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f5f5f5'  // 添加整体背景色
    }}>
      {!isDetailPage && (
        <ConfigProvider locale={zhCN}>
          <div style={{ 
            background: '#fff',
            padding: '16px 24px 0',
          }}>
            <Tabs
              activeKey={getActiveKey()}
              onChange={handleTabChange}
              items={[
                {
                  key: 'customers',
                  label: '按客户查看',
                },
                {
                  key: 'list',
                  label: '供货单列表',
                }
              ]}
            />
          </div>
        </ConfigProvider>
      )}

      <Outlet context={{ 
        selectedDate, 
        dateChanged: searchParams.get('timestamp'),
        handleDateChange,
        isToday,
        getDisabledDate
      }} />
    </div>
  );
};

export default SupplyOrders; 