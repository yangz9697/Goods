import React, { useState } from 'react';
import { Card, DatePicker, Table, Row, Col, Button } from 'antd';
import { Line } from '@ant-design/plots';
import dayjs from 'dayjs';
import { mockProductConsumption } from '@/mock/dashboard';

const { RangePicker } = DatePicker;

interface ProductDetail {
  id: number;
  name: string;
  dailyData: Array<{
    date: string;
    consumption: number;
    sales: number;
  }>;
}

const ProductConsumption: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(6, 'days'),
    dayjs()
  ]);
  const [expandedProduct, setExpandedProduct] = useState<ProductDetail | null>(null);

  const columns = [
    {
      title: '商品名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      render: (unit: string) => (
        <span>{unit}</span>
      ),
    },
    {
      title: '消耗',
      dataIndex: 'consumption',
      key: 'consumption',
      width: 120,
    },
    {
      title: '对标金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '详情',
      key: 'action',
      width: 100,
      render: (_: any, record: ProductDetail) => (
        <Button 
          type="link"
          onClick={() => setExpandedProduct(
            expandedProduct?.id === record.id ? null : record
          )}
        >
          {expandedProduct?.id === record.id ? '收起' : '展开'}
        </Button>
      ),
    },
  ];

  // 图表配置
  const getChartConfig = (data: any[], yField: string) => ({
    data,
    xField: 'date',
    yField,
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    height: 200,
  });

  return (
    <Card title="商品消耗统计">
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

      <Table 
        dataSource={mockProductConsumption.list}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      {expandedProduct && (
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card 
                size="small" 
                title="消耗量趋势"
                bodyStyle={{ padding: '12px 0' }}
                headStyle={{ padding: '0 12px' }}
              >
                <Line {...getChartConfig(expandedProduct.dailyData, 'consumption')} />
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                size="small" 
                title="销售额趋势"
                bodyStyle={{ padding: '12px 0' }}
                headStyle={{ padding: '0 12px' }}
              >
                <Line {...getChartConfig(expandedProduct.dailyData, 'sales')} />
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

export default ProductConsumption; 