import React, { useState } from 'react';
import { Card, DatePicker, Row, Col, Statistic } from 'antd';
import { Line, Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import { mockDashboardData } from '@/mock/dashboard';

const { RangePicker } = DatePicker;

const SalesOverview: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(6, 'days'),
    dayjs()
  ]);

  // 销售趋势图配置
  const lineConfig = {
    data: mockDashboardData.salesTrend,
    xField: 'date',
    yField: 'sales',
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    height: 260,
  };

  // 货品销售柱状图配置
  const columnConfig = {
    data: mockDashboardData.productSales,
    xField: 'category',
    yField: 'sales',
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
        />
      </div>

      {/* 销售总额 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card bodyStyle={{ padding: '12px 24px' }}>
            <Statistic
              title="销售总额"
              value={mockDashboardData.totalSales}
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
          >
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="货品销售统计" 
            bodyStyle={{ padding: '12px 0' }}
            headStyle={{ padding: '0 12px' }}
          >
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default SalesOverview; 