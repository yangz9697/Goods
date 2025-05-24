import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Table, Button, message, Space, Radio, Spin, Modal, Input, Select } from 'antd';
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

// 添加新的接口类型定义
interface TrendData {
  count: string;
  orderDate: string;
}

interface PriceData {
  price: string;
  orderDate: string;
}

interface TrendResponse {
  amountCountRank: TrendData[];
  jinCountRank: TrendData[];
  boxCountRank: TrendData[];
  heCountRank: TrendData[];
  priceRank: PriceData[];
}

interface UnitPriceData {
  price: string;
  orderDate: string;
}

interface UnitPriceResponse {
  amountUnitPriceRank: UnitPriceData[];
  jinUnitPriceRank: UnitPriceData[];
  boxUnitPriceRank: UnitPriceData[];
  heUnitPriceRank: UnitPriceData[];
}

const TrendCharts: React.FC<{ 
  record: ProductDetail; 
  visible: boolean; 
  onClose: () => void;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];  // 添加日期范围参数
}> = ({ 
  record, 
  visible, 
  onClose,
  dateRange
}) => {
  const [trendData, setTrendData] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<'amount' | 'jin' | 'box' | 'he'>('amount');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await dashboardApi.getProductTrend({
          objectDetailId: record.objectDetailId,
          startTime: dateRange[0].startOf('day').valueOf(),
          endTime: dateRange[1].endOf('day').valueOf(),
          tenant: localStorage.getItem('tenant') || undefined
        });

        if (response.success) {
          setTrendData(response.data);
        } else {
          message.error(response.displayMsg || '获取趋势数据失败');
        }
      } catch (error) {
        console.error('获取趋势数据失败:', error);
        message.error('获取趋势数据失败：' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      loadData();
    }
  }, [record.objectDetailId, visible, dateRange]);  // 添加 dateRange 依赖

  const getChartData = () => {
    if (!trendData) return [];
    
    const dataMap = {
      amount: trendData.amountCountRank,
      jin: trendData.jinCountRank,
      box: trendData.boxCountRank,
      he: trendData.heCountRank
    };

    return dataMap[unit].map(item => ({
      '销售日期': item.orderDate,
      '消耗量': parseFloat(item.count)
    }));
  };

  const getPriceData = () => {
    if (!trendData) return [];
    
    return trendData.priceRank.map(item => ({
      '销售日期': item.orderDate,
      '销售额': parseFloat(item.price)
    }));
  };

  return (
    <Modal
      title={`${record.objectDetailName}的销售数据`}
      open={visible}
      onCancel={onClose}
      width="100%"
      style={{ top: 20 }}
      bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
      footer={null}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>消耗量趋势</h3>
              <Radio.Group value={unit} onChange={e => setUnit(e.target.value)}>
                <Radio.Button value="amount">个</Radio.Button>
                <Radio.Button value="jin">斤</Radio.Button>
                <Radio.Button value="box">箱</Radio.Button>
                <Radio.Button value="he">盒</Radio.Button>
              </Radio.Group>
            </div>
            <div style={{ height: 300 }}>
              <Line
                data={getChartData()}
                xField="销售日期"
                yField="消耗量"
                smooth
                point={{
                  size: 5,
                  shape: 'diamond',
                }}
              />
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: 16 }}>销售额趋势</h3>
            <div style={{ height: 300 }}>
              <Line
                data={getPriceData()}
                xField="销售日期"
                yField="销售额"
                smooth
                point={{
                  size: 5,
                  shape: 'diamond',
                }}
              />
            </div>
          </div>
        </Space>
      </Spin>
    </Modal>
  );
};

const PriceTrendCharts: React.FC<{ 
  record: ProductDetail; 
  visible: boolean; 
  onClose: () => void;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];  // 添加日期范围参数
}> = ({ 
  record, 
  visible, 
  onClose,
  dateRange
}) => {
  const [priceData, setPriceData] = useState<UnitPriceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<'amount' | 'jin' | 'box' | 'he'>('amount');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await dashboardApi.getUnitPriceTrend({
          objectDetailId: record.objectDetailId,
          startTime: dateRange[0].startOf('day').valueOf(),
          endTime: dateRange[1].endOf('day').valueOf(),
          tenant: localStorage.getItem('tenant') || undefined
        });

        if (response.success) {
          setPriceData(response.data);
        } else {
          message.error(response.displayMsg || '获取历史价格数据失败');
        }
      } catch (error) {
        console.error('获取历史价格数据失败:', error);
        message.error('获取历史价格数据失败：' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      loadData();
    }
  }, [record.objectDetailId, visible, dateRange]);  // 添加 dateRange 依赖

  const getChartData = () => {
    if (!priceData) return [];
    
    const dataMap = {
      amount: priceData.amountUnitPriceRank,
      jin: priceData.jinUnitPriceRank,
      box: priceData.boxUnitPriceRank,
      he: priceData.heUnitPriceRank
    };

    return dataMap[unit].map(item => ({
      '销售日期': item.orderDate,
      '单价': parseFloat(item.price)
    }));
  };

  return (
    <Modal
      title={`${record.objectDetailName}的历史价格`}
      open={visible}
      onCancel={onClose}
      width="100%"
      style={{ top: 20 }}
      bodyStyle={{ height: '350px', overflow: 'auto' }}
      footer={null}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>历史价格趋势</h3>
              <Radio.Group value={unit} onChange={e => setUnit(e.target.value)}>
                <Radio.Button value="amount">个</Radio.Button>
                <Radio.Button value="jin">斤</Radio.Button>
                <Radio.Button value="box">箱</Radio.Button>
                <Radio.Button value="he">盒</Radio.Button>
              </Radio.Group>
            </div>
            <div style={{ height: 300 }}>
              <Line
                data={getChartData()}
                xField="销售日期"
                yField="单价"
                smooth
                point={{
                  size: 5,
                  shape: 'diamond',
                }}
              />
            </div>
          </div>
        </Space>
      </Spin>
    </Modal>
  );
};

const ProductConsumption: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'days'), dayjs()]);
  const [monthValue, setMonthValue] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductDetail[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ProductDetail | null>(null);
  const [trendVisible, setTrendVisible] = useState(false);
  const [priceVisible, setPriceVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchValue, setSearchValue] = useState('');  // 新增：用于存储实际的搜索值
  const [orderByUnitName, setOrderByUnitName] = useState<'个' | '斤' | '箱' | '盒'>('个');
  const [orderType, setOrderType] = useState<'asc' | 'desc'>('desc');

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

  const handleSearch = (value: string) => {
    setSearchValue(value);  // 只在搜索时更新实际的搜索值
  };

  const handleOrderByUnitNameChange = (value: '个' | '斤' | '箱' | '盒') => {
    setOrderByUnitName(value);
  };

  const handleOrderTypeChange = () => {
    setOrderType(orderType === 'desc' ? 'asc' : 'desc');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getProductDetail({
        startTime: dateRange[0].startOf('day').valueOf(),
        endTime: dateRange[1].endOf('day').valueOf(),
        tenant: localStorage.getItem('tenant') || undefined,
        objectDetailName: searchValue || undefined,  // 使用 searchValue 而不是 searchText
        orderByUnitName: orderByUnitName,
        orderType: orderType,
      });

      if (response.success) {
        setProductData(response.data);
      } else {
        message.error(response.displayMsg || '获取商品统计失败');
      }
    } catch (error) {
      console.error('获取商品统计失败:', error);
      message.error('获取商品统计失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, searchValue, orderByUnitName, orderType]);  // 使用 searchValue 作为依赖

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
      title: '消耗趋势',
      key: 'action',
      width: 100,
      render: (_: any, record: ProductDetail) => (
        <Button 
          type="link" 
          onClick={() => {
            setSelectedRecord(record);
            setTrendVisible(true);
          }}
        >
          查看
        </Button>
      ),
      onCell: () => ({ style: { padding: 0 } })
    },
    {
      title: '价格趋势',
      key: 'action',
      width: 100,
      render: (_: any, record: ProductDetail) => (
        <Button 
          type="link"
          onClick={() => {
            setSelectedRecord(record);
            setPriceVisible(true);
          }}
        >
          查看
        </Button>
      ),
      onCell: () => ({ style: { padding: 0 } })
    },
  ];

  return (
    <Card title="商品统计">
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
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
        <Input.Search
          placeholder="搜索商品名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 200 }}
          allowClear
          enterButton
        />
        <Select
          value={orderByUnitName}
          onChange={handleOrderByUnitNameChange}
          style={{ width: 120 }}
        >
          <Select.Option value="个">按个排序</Select.Option>
          <Select.Option value="斤">按斤排序</Select.Option>
          <Select.Option value="箱">按箱排序</Select.Option>
          <Select.Option value="盒">按盒排序</Select.Option>
        </Select>
        <Button
          type={orderType === 'desc' ? 'primary' : 'default'}
          onClick={handleOrderTypeChange}
        >
          {orderType === 'desc' ? '降序' : '升序'}
        </Button>
      </div>

      <Table 
        loading={loading}
        dataSource={productData}
        columns={columns}
        rowKey="objectDetailId"
        pagination={false}
      />

      {selectedRecord && (
        <>
          <TrendCharts
            record={selectedRecord}
            visible={trendVisible}
            onClose={() => {
              setTrendVisible(false);
              setSelectedRecord(null);
            }}
            dateRange={dateRange}  // 传递日期范围
          />
          <PriceTrendCharts
            record={selectedRecord}
            visible={priceVisible}
            onClose={() => {
              setPriceVisible(false);
              setSelectedRecord(null);
            }}
            dateRange={dateRange}  // 传递日期范围
          />
        </>
      )}
    </Card>
  );
};

export default ProductConsumption; 