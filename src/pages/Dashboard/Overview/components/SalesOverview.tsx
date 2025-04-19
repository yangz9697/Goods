import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Row, Col, Statistic, message } from 'antd';
import { Line, Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import { dashboardApi } from '@/api/dashboard';
import locale from 'antd/es/date-picker/locale/zh_CN';

const { RangePicker } = DatePicker;

interface SalesData {
  totalPrice: number;
  salesRankList: Array<{
    saleDate: string;
    salePrice: number;
  }>;
  objectPriceList: Array<{
    objectDetailName: string;
    objectDetailId: number;
    price: number;
  }>;
}

const SalesOverview: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [monthValue, setMonthValue] = useState<dayjs.Dayjs | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    setMonthValue(date);
    if (date) {
      // 当选择月份时，设置日期范围为该月的第一天到最后一天
      setDateRange([
        date.startOf('month'),
        date.endOf('month')
      ]);
    }
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates) {
      setDateRange([dates[0]!, dates[1]!]);
      // 如果日期范围跨越了月份，清空月份选择
      if (!dates[0]?.isSame(dates[1], 'month')) {
        setMonthValue(null);
      }
    }
  };

  const fetchSalesData = async (startTime: number, endTime: number) => {
    setLoading(true);
    try {
      const response = await dashboardApi.getSalesData({
        startTime,
        endTime,
        tenant: localStorage.getItem('tenant') || undefined
      });

      if (response.success) {
        setSalesData(response.data);
      } else {
        message.error(response.displayMsg || '获取销售数据失败');
      }
    } catch (error) {
      message.error('获取销售数据失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData(
      dateRange[0].startOf('day').valueOf(),
      dateRange[1].endOf('day').valueOf()
    );
  }, [dateRange]);

  // 销售趋势图配置
  const lineConfig = {
    data: salesData?.salesRankList?.map(item => ({
      销售日期: item.saleDate,
      销售概况: item.salePrice
    })),
    xField: '销售日期',
    yField: '销售概况',
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    height: 150,
  };

  // 货品销售柱状图配置
  const columnConfig = {
    data: salesData?.objectPriceList?.map(item => ({
      货品: item.objectDetailName,
      销售额: item.price
    })),
    xField: '货品',
    yField: '销售额',
    height: 150,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
  };

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <RangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          locale={locale}
          allowClear={false}
          ranges={{
            '昨天': [dayjs().subtract(1, 'days'), dayjs().subtract(1, 'days')],
            '最近7天': [dayjs().subtract(7, 'days'), dayjs()],
            '最近30天': [dayjs().subtract(30, 'days'), dayjs()],
            '本月': [dayjs().startOf('month'), dayjs()],
            '上月': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
          }}
        />
        <DatePicker
          value={monthValue}
          onChange={handleMonthChange}
          picker="month"
          placeholder="选择月份"
          allowClear
          format="YYYY年MM月"
          locale={locale}
        />
      </div>

      {/* 销售总额 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card bodyStyle={{ padding: '12px 24px' }} loading={loading}>
            <Statistic
              title="销售总额"
              value={salesData?.totalPrice || 0}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      {/* 销售趋势 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title="销售趋势" 
            bodyStyle={{ padding: '12px 0' }}
            headStyle={{ padding: '0 12px' }}
            loading={loading}
          >
            <Line {...lineConfig} />
          </Card>
        </Col>
      </Row>

      {/* 货品销售统计 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title="货品金额统计" 
            bodyStyle={{ padding: '12px 0' }}
            headStyle={{ padding: '0 12px' }}
            loading={loading}
          >
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default SalesOverview; 