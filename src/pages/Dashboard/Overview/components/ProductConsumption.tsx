import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Table, Row, Col, Button, message, Popover } from 'antd';
import { Line } from '@ant-design/plots';
import dayjs from 'dayjs';
import { dashboardApi } from '@/api/dashboard';
import locale from 'antd/es/date-picker/locale/zh_CN';

const { RangePicker } = DatePicker;

interface ProductDetail {
  objectDetailId: number;
  objectDetailName: string;
  unitName: string;
  totalCount: number;
  totalPrice: number;
  countRank: Array<{
    count: number;
    orderDate: string;
  }>;
  priceRank: Array<{
    price: number;
    orderDate: string;
  }>;
}

const ProductConsumption: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductDetail[]>([]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getProductDetail({
        startTime: dateRange[0].startOf('day').valueOf(),
        endTime: dateRange[1].endOf('day').valueOf(),
        unitName: '斤',
        tenant: localStorage.getItem('tenant') || undefined
      });

      if (response.success) {
        setProductData(response.data);
      } else {
        message.error(response.displayMsg || '获取商品消耗数据失败');
      }
    } catch (error) {
      message.error('获取商品消耗数据失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [dateRange]);

  // 图表配置
  const getChartConfig = (data: any[], xField: string, yField: string) => ({
    data: data.map(item => ({
      日期: item.orderDate,
      [yField]: item[xField]
    })),
    xField: '日期',
    yField,
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    height: 200,
    width: 400,  // 添加固定宽度
  });

  // 渲染图表内容
  const renderCharts = (product: ProductDetail) => (
    <div style={{ width: 850 }}>  {/* 设置固定宽度 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card 
            size="small" 
            title="消耗量趋势"
            bodyStyle={{ padding: '12px 0' }}
            headStyle={{ padding: '0 12px' }}
          >
            <Line {...getChartConfig(product.countRank, 'count', '数量')} />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            size="small" 
            title="销售额趋势"
            bodyStyle={{ padding: '12px 0' }}
            headStyle={{ padding: '0 12px' }}
          >
            <Line {...getChartConfig(product.priceRank, 'price','价格')} />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const columns = [
    {
      title: '商品名',
      dataIndex: 'objectDetailName',
      key: 'objectDetailName',
    },
    {
      title: '单位',
      dataIndex: 'unitName',
      key: 'unitName',
      width: 100,
    },
    {
      title: '消耗量',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 120,
    },
    {
      title: '销售金额',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '详情',
      key: 'action',
      width: 100,
      render: (_: any, record: ProductDetail) => (
        <Popover
          content={renderCharts(record)}
          title={`${record.objectDetailName}的详细数据`}
          trigger="click"
          placement="right"
          overlayStyle={{ maxWidth: 'none' }}  // 允许 Popover 内容超出默认宽度
        >
          <Button type="link">
            查看趋势
          </Button>
        </Popover>
      ),
      onCell: () => ({ style: { padding: 0 } })
    },
  ];

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

      <Table 
        loading={loading}
        dataSource={productData}
        columns={columns}
        rowKey="objectDetailId"
        pagination={false}
      />
    </Card>
  );
};

export default ProductConsumption; 