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
  const [monthValue, setMonthValue] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductDetail[]>([]);

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

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getProductDetail({
        startTime: dateRange[0].startOf('day').valueOf(),
        endTime: dateRange[1].endOf('day').valueOf(),
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
    data: data?.map(item => ({
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
    width: 500,  // 添加固定宽度
  });

  // 渲染图表内容
  const renderCharts = (product: ProductDetail) => (
    <div style={{ width: 1000 }}>  {/* 设置固定宽度 */}
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
      title: '消耗量（个）',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: string) => `${amount}`,
    },
    {
      title: '消耗量（斤）',
      dataIndex: 'totalJin',
      key: 'totalJin',
      width: 120,
      render: (amount: string) => `${amount}`,
    },
    {
      title: '消耗量（箱）',
      dataIndex: 'totalBox',
      key: 'totalBox',
      width: 120,
      render: (amount: string) => `${amount}`,
    },
    {
      title: '消耗量（盒）',
      dataIndex: 'totalHe',
      key: 'totalHe',
      width: 120,
      render: (amount: string) => `${amount}`,
    },
    {
      title: '销售金额',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      render: (amount: string) => `¥${amount}`,
    },
    {
      title: '消耗量',
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
    {
      title: '历史价格',
      key: 'action',
      width: 100,
      render: (_: any, record: ProductDetail) => (
        // <Popover
        //   content={renderCharts(record)}
        //   title={`${record.objectDetailName}的详细数据`}
        //   trigger="click"
        //   placement="right"
        //   overlayStyle={{ maxWidth: 'none' }}  // 允许 Popover 内容超出默认宽度
        // >
        //   <Button type="link">
        //     查看趋势
        //   </Button>
        // </Popover>
        <Button type="link">
        查看趋势
      </Button>
      ),
      onCell: () => ({ style: { padding: 0 } })
    },
  ];

  return (
    <Card title="商品消耗统计">
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