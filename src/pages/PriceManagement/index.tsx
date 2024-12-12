import React, { useState, useEffect } from 'react';
import { Table, Space, Input, message } from 'antd';
import type { ObjectPrice } from '../../types/objectDetail';
import { pageObjectPrice } from '../../api/objectDetail';
import dayjs from 'dayjs';

const { Search } = Input;

const PriceManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [priceData, setPriceData] = useState<ObjectPrice[]>([]);

  // 获取价格列表
  const fetchPriceList = async (page: number, size: number, searchKey: string = '') => {
    setLoading(true);
    try {
      const response = await pageObjectPrice({
        currentPage: page,
        pageSize: size,
        filters: {
          detailObjectName: searchKey
        }
      });

      if (response.data) {
        const items = response.data.items.map(item => ({
          ...item,
          updateTime: dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss')
        }));

        setPriceData(items.map(item => ({
          ...item,
          updateTime: new Date(item.updateTime).getTime()
        })));
        setTotal(response.data.total);
      } else {
        message.error('获取价格列表失败');
      }
    } catch (error) {
      message.error('获取价格列表失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 搜索功能
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
    fetchPriceList(1, pageSize, value);
  };

  // 在组件加载时获取数据
  useEffect(() => {
    fetchPriceList(currentPage, pageSize, searchText);
  }, [currentPage, pageSize]);

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'detailObjectName',
      key: 'detailObjectName',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作人',
      dataIndex: 'updater',
      key: 'updater',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, _record: ObjectPrice) => (
        <Space>
          <a onClick={() => {/* TODO: 实现编辑价格功能 */}}>编辑</a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Search
            placeholder="请输入商品名称"
            onSearch={handleSearch}
            style={{ width: 200 }}
          />
        </Space>
        <Table 
          columns={columns} 
          dataSource={priceData}
          rowKey="detailObjectId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Space>
    </div>
  );
};

export default PriceManagement; 