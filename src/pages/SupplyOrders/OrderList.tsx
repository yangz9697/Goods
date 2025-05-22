import React, { useEffect, useState, useCallback } from 'react';
import { Table, Space, Button, Tag, Input, message, Form, Popconfirm, DatePicker } from 'antd';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { orderApi } from '@/api/orders';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AddOrderModal from './components/AddOrderModal';
import { OrderStatusCode } from '@/types/order';
import type { TableRowSelection } from 'antd/es/table/interface';
import { formatPhone } from '@/utils/format';
import { debounce } from 'lodash';

interface PageOrderItem {
  orderNo: string;
  userName: string;
  mobile: string;
  orderStatusCode: OrderStatusCode;
  orderStatusName: string;
  remark: string;
  createTime: number;
  updateTime: number;
  printTime?: number;
}

interface ContextType {
  selectedDate: dayjs.Dayjs;
  dateChanged: string | null;
  handleDateChange: (date: dayjs.Dayjs | null) => void;
  isToday: boolean;
  getDisabledDate: (current: dayjs.Dayjs) => boolean;
}

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDate, dateChanged, handleDateChange, isToday, getDisabledDate } = useOutletContext<ContextType>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PageOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [printLoading, setPrintLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // 初始化表单默认值
  const initialValues = {
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
    setCurrentPage(1);  // 重置页码
    fetchOrders(1, pageSize);
  }, [selectedDate, dateChanged]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders(1, pageSize);
  };

  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    fetchOrders(1, pageSize);
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size || 10);
    fetchOrders(page, size || 10);
  };

  // 使用防抖包装打印函数
  const debouncedPrint = useCallback(
    debounce(async () => {
      if (selectedRowKeys.length > 10) {
        message.warning('一次最多只能打印10个供货单');
        return;
      }
      setPrintLoading(true);
      try {
        const blob = await orderApi.batchPrintOrderToPDF({
          orderNoList: selectedRowKeys
        });
        
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
        
        printFrame.onload = () => {
          try {
            printFrame.contentWindow?.print();
            // 打印成功后刷新列表
            fetchOrders(currentPage, pageSize);
          } catch (error) {
            message.error('打印失败：' + (error as Error).message);
          }
        };

        printFrame.src = url;
      } catch (error) {
        message.error('批量打印失败：' + (error as Error).message);
      } finally {
        setPrintLoading(false);
      }
    }, 300),
    [selectedRowKeys, currentPage, pageSize]
  );

  // 使用防抖包装导出函数
  const debouncedExport = useCallback(
    debounce(async () => {
      if (selectedRowKeys.length > 10) {
        message.warning('一次最多只能导出10个供货单');
        return;
      }
      setExportLoading(true);
      try {
        const blob = await orderApi.batchExportOrderToExcel({
          orderNoList: selectedRowKeys
        });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `供货单批量导出_${dayjs().format('YYYYMMDD')}.zip`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        message.error('批量导出失败：' + (error as Error).message);
      } finally {
        setExportLoading(false);
      }
    }, 300),
    [selectedRowKeys]
  );

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
      title: '打印时间',
      dataIndex: 'printTime',
      key: 'printTime',
      render: (time: number | undefined) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
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
      <div style={{ 
        background: '#fff',
        padding: '16px 24px',
        marginBottom: '16px'
      }}>
        <Form
          form={form}
          initialValues={initialValues}
          layout="inline"
        >
          <Form.Item>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              allowClear={false}
              style={{
                fontSize: '14px',
                padding: '4px 11px',
                width: 'auto',
                minWidth: '200px'
              }}
              format="YYYY年MM月DD日"
              popupStyle={{
                fontSize: '14px'
              }}
              className="custom-datepicker"
              disabledDate={getDisabledDate}
            />
            {isToday && (
              <Tag 
                color="red" 
                style={{ 
                  fontSize: '16px',
                  padding: '4px 8px',
                  margin: 0,
                  marginLeft: '8px',
                  borderRadius: '4px'
                }}
              >
                今天
              </Tag>
            )}
          </Form.Item>

          <Form.Item name="keyword">
            <Input
              placeholder="搜索姓名或手机号"
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
                onClick={debouncedPrint}
                disabled={selectedRowKeys.length === 0}
                loading={printLoading}
              >
                批量打印
              </Button>
              <Button
                onClick={debouncedExport}
                disabled={selectedRowKeys.length === 0}
                loading={exportLoading}
              >
                批量导出
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

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