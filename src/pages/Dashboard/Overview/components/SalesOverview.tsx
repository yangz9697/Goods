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
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);

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
    data: salesData?.salesRankList || [],
    xField: 'saleDate',
    yField: 'salePrice',
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    height: 260,
  };

  // 货品销售柱状图配置
  const columnConfig = {
    data: salesData?.objectPriceList || [],
    xField: 'objectDetailName',
    yField: 'price',
    height: 260,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
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

      {/* 销售趋势和货品销售统计并排 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title="销售趋势" 
            bodyStyle={{ padding: '12px 0' }}
            headStyle={{ padding: '0 12px' }}
            loading={loading}
          >
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="货品销售统计" 
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