import React, { useState } from 'react';
import { Tabs, Tag, DatePicker, ConfigProvider } from 'antd';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';
import './index.less';


// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

// 本地存储的 key
const SUPPLY_ORDER_DATE_KEY = 'supply_order_date';

const SupplyOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  return (
    <div style={{ padding: '0 24px' }}>
      <ConfigProvider locale={zhCN}>
        {/* 只在非详情页显示日期选择器 */}
        {!isDetailPage && (
          <div style={{ 
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              allowClear={false}
              style={{
                fontSize: '18px',
                padding: '8px 16px',
                width: 'auto',
                minWidth: '200px'
              }}
              size="large"
              format="YYYY年MM月DD日"
              popupStyle={{
                fontSize: '14px'
              }}
              className="custom-datepicker"
            />
            {isToday && (
              <Tag 
                color="red" 
                style={{ 
                  fontSize: '16px',
                  padding: '4px 8px',
                  margin: 0,
                  borderRadius: '4px'
                }}
              >
                今天
              </Tag>
            )}
          </div>
        )}
      </ConfigProvider>

      {/* 只在非详情页显示 Tabs */}
      {!isDetailPage && (
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
      )}

      <Outlet context={{ selectedDate, dateChanged: searchParams.get('timestamp') }} />
    </div>
  );
};

export default SupplyOrders; 