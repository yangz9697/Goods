import React, { useEffect, useState } from 'react';
import { Table, Space, Button, Tag, DatePicker, Input, message, Form, Popconfirm } from 'antd';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '@/api/orders';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AddOrderModal from './components/AddOrderModal';
import { OrderStatusCode } from '@/types/order';
import type { TableRowSelection } from 'antd/es/table/interface';
import { formatPhone } from '@/utils/format';

interface PageOrderItem {
  orderNo: string;
  userName: string;
  mobile: string;
  orderStatusCode: OrderStatusCode;
  orderStatusName: string;
  remark: string;
  createTime: number;
  updateTime: number;
}

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PageOrderItem[]>([]);
  console.log(orders);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 初始化表单默认值
  const initialValues = {
    dateRange: selectedDate,
    keyword: ''
  };

  const fetchOrders = async (page: number, size: number) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      
      const res = await orderApi.pageOrder({
        currentPage: page,
        pageSize: size,
        filters: {
          startTime: selectedDate.startOf('day').valueOf(),
          endTime: selectedDate.endOf('day').valueOf(),
          keyword: values.keyword
        }
      });
      if (res.success) {
        setOrders(res.data.items);
        setTotal(res.data.total);
      } else {
        message.error(res.displayMsg || '获取供货单列表失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderNo: string) => {
    try {
      const response = await orderApi.deleteOrder(orderNo);
      if (response.success) {
        message.success('删除供货单成功');
        fetchOrders(currentPage, pageSize);  // 重新获取列表
      } else {
        message.error(response.displayMsg || '删除供货单失败');
      }
    } catch (error) {
      message.error('删除供货单失败：' + (error as Error).message);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, pageSize);
  }, [currentPage, pageSize, selectedDate]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders(1, pageSize);
  };

  const handleReset = () => {
    form.resetFields();
    setSelectedDate(dayjs());
    setCurrentPage(1);
    fetchOrders(1, pageSize);
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      form.setFieldsValue({ dateRange: date });
    }
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size || 10);
    fetchOrders(page, size || 10);
  };

  const handleBatchPrint = async () => {
    if (selectedRowKeys.length > 10) {
      message.warning('一次最多只能打印10个供货单');
      return;
    }
    try {
      const blob = await orderApi.batchPrintOrderToPDF({
        orderNoList: selectedRowKeys
      });
      const url = window.URL.createObjectURL(blob);
      
      // 创建一个隐藏的 iframe
      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      document.body.appendChild(printFrame);
      
      printFrame.src = url;

      // 等待 iframe 加载完成后打印
      printFrame.onload = function() {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          // 打印对话框关闭后清理
          setTimeout(() => {
            document.body.removeChild(printFrame);
            window.URL.revokeObjectURL(url);
          }, 1000);
        } catch (error) {
          message.error('打印失败：' + (error as Error).message);
          document.body.removeChild(printFrame);
          window.URL.revokeObjectURL(url);
        }
      };
    } catch (error) {
      message.error('批量打印失败：' + (error as Error).message);
    }
  };

  const handleBatchExport = async () => {
    if (selectedRowKeys.length > 10) {
      message.warning('一次最多只能导出10个供货单');
      return;
    }
    try {
      const blob = await orderApi.batchExportOrderToExcel({
        orderNoList: selectedRowKeys
      });
      const url = window.URL.createObjectURL(blob);
      
      // 创建一个隐藏的 a 标签来下载文件
      const link = document.createElement('a');
      link.href = url;
      link.download = `供货单批量导出_${dayjs().format('YYYYMMDD')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      message.error('批量导出失败：' + (error as Error).message);
    }
  };

  const rowSelection: TableRowSelection<PageOrderItem> = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      // 限制选择数量
      if (selectedRowKeys.length > 10) {
        message.warning('一次最多只能选择10个供货单');
        // 只保留前10个选中项
        setSelectedRowKeys(selectedRowKeys.slice(0, 10) as string[]);
        return;
      }
      setSelectedRowKeys(selectedRowKeys as string[]);
    },
    getCheckboxProps: (record: PageOrderItem) => ({
      disabled: selectedRowKeys.length >= 10 && !selectedRowKeys.includes(record.orderNo)
    }),
    // 自定义全选框的属性
    checkStrictly: true,  // 不关联父子选择状态
    selections: [
      {
        key: 'SELECT_ALL',
        text: '全选当页',
        onSelect: (changeableRowKeys: React.Key[]) => {
          // 如果可选的行数超过10个，只选择前10个
          const rowKeys = changeableRowKeys.slice(0, 10);
          setSelectedRowKeys(rowKeys as string[]);
          if (changeableRowKeys.length > 10) {
            message.warning('已自动选择前10个供货单');
          }
        }
      },
      {
        key: 'SELECT_NONE',
        text: '取消选择',
        onSelect: () => {
          setSelectedRowKeys([]);
        }
      }
    ]
  };

  const columns = [
    {
      title: '供货单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户姓名',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '联系电话',
      dataIndex: 'mobile',
      key: 'mobile',
      render: (mobile: string) => formatPhone(mobile),
    },
    {
      title: '状态',
      dataIndex: 'orderStatusCode',
      key: 'orderStatusCode',
      render: (status: string, record: PageOrderItem) => {
        const colorMap = {
          wait: 'orange',
          processing: 'blue',
          completed: 'green'
        };
        return (
          <Tag color={colorMap[status as keyof typeof colorMap]}>
            {record.orderStatusName}
          </Tag>
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '下单时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: PageOrderItem) => (
        <Space size="middle">
          <Button 
            type="link"
            onClick={() => navigate(`/supply-orders/detail/${record.orderNo}`)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定要删除这个供货单吗？"
            onConfirm={() => handleDelete(record.orderNo)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      onCell: () => ({ style: { padding: 0 } })
    },
  ];

  return (
    <div>
      <Form
        form={form}
        initialValues={initialValues}
        layout="inline"
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="dateRange">
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            style={{ width: 200 }}
            allowClear={false}
          />
        </Form.Item>
        
        <Form.Item name="keyword">
          <Input
            placeholder="请输入客户姓名/手机号"
            style={{ width: 200 }}
            allowClear
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
            >
              添加供货单
            </Button>
            <Button
              onClick={handleBatchPrint}
              disabled={selectedRowKeys.length === 0}
            >
              批量打印
            </Button>
            <Button
              onClick={handleBatchExport}
              disabled={selectedRowKeys.length === 0}
            >
              批量导出
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table 
        rowSelection={rowSelection}
        columns={columns} 
        dataSource={orders}
        rowKey="orderNo"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          onChange: (page, size) => {
            setSelectedRowKeys([]);
            handlePageChange(page, size);
          },
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          locale: {
            items_per_page: '条/页',
            jump_to: '跳至',
            jump_to_confirm: '确定',
            page: '页',
            prev_page: '上一页',
            next_page: '下一页',
            prev_5: '向前 5 页',
            next_5: '向后 5 页'
          }
        }}
      />

      <AddOrderModal
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSuccess={() => {
          setIsAddModalVisible(false);
          fetchOrders(currentPage, pageSize);
        }}
      />
    </div>
  );
};

export default OrderList; 