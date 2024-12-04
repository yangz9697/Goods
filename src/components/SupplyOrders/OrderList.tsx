import React from 'react';
import { Space, Button, DatePicker, Input, Table, Tag, Tooltip } from 'antd';
import type { OrderType, OrderFilters } from '../../types/order';
import { getStatusColor, getStatusText } from '../../utils/status';
import { formatPhone } from '../../utils/format';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface OrderListProps {
  orders: OrderType[];
  selectedOrders: string[];
  filters: OrderFilters;
  onFiltersChange: (filters: Partial<OrderFilters>) => void;
  onOrderSelect: (selectedRowKeys: string[]) => void;
  onOrderEdit: (order: OrderType) => void;
  onOrderDelete: (id: string) => void;
  onAddOrder: () => void;
  onPrint: (orderIds: string[]) => void;
  onExport: (orderIds: string[]) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  selectedOrders,
  filters,
  onFiltersChange,
  onOrderSelect,
  onOrderEdit,
  onOrderDelete,
  onAddOrder,
  onPrint,
  onExport
}) => {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* 筛选器 */}
      <Space>
        <RangePicker
          value={filters.dateRange}
          onChange={(dates) => onFiltersChange({
            dateRange: dates ? [dates[0], dates[1]] : [null, null]
          })}
          allowClear
        />
        <Search
          placeholder="客户姓名"
          value={filters.searchText}
          onChange={e => onFiltersChange({ searchText: e.target.value })}
          style={{ width: 200 }}
        />
        <Search
          placeholder="手机号"
          value={filters.searchPhone}
          onChange={e => onFiltersChange({ searchPhone: e.target.value })}
          style={{ width: 200 }}
        />
        <Button onClick={() => onFiltersChange({
          dateRange: [null, null],
          searchText: '',
          searchPhone: ''
        })}>
          重置
        </Button>
        <Button type="primary" onClick={onAddOrder}>
          添加供货单
        </Button>
      </Space>

      {/* 订单列表 */}
      <Table
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedOrders,
          onChange: (selectedRowKeys) => onOrderSelect(selectedRowKeys as string[])
        }}
        columns={[
          {
            title: '订单号',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
          },
          {
            title: '姓名',
            dataIndex: 'customerName',
            key: 'customerName',
          },
          {
            title: '手机号',
            dataIndex: 'customerPhone',
            key: 'customerPhone',
            render: (phone: string) => formatPhone(phone)
          },
          {
            title: '配货状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: OrderType['status']) => (
              <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
            )
          },
          {
            title: '下单时间',
            dataIndex: 'createTime',
            key: 'createTime',
          },
          {
            title: '货品',
            dataIndex: 'items',
            key: 'items',
            render: (items: OrderType['items']) => {
              const text = items.map(item => 
                `${item.name} ${item.quantity}${item.unit === 'box' ? '箱' : item.unit === 'jin' ? '斤' : '个'}`
              ).join('，');
              return (
                <Tooltip title={text}>
                  <div style={{ 
                    maxWidth: 200, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {text}
                  </div>
                </Tooltip>
              );
            }
          },
          {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record: OrderType) => (
              <Space>
                <Button 
                  type="link" 
                  onClick={() => onOrderEdit(record)}
                >
                  编辑
                </Button>
                {record.status !== 'settled' && (
                  <Button 
                    type="link" 
                    danger 
                    onClick={() => onOrderDelete(record.id)}
                  >
                    删除
                  </Button>
                )}
              </Space>
            )
          }
        ]}
        dataSource={orders}
        rowKey="id"
        footer={() => (
          <Space>
            <Button onClick={() => onPrint(selectedOrders)}>打印</Button>
            <Button onClick={() => onExport(selectedOrders)}>导出</Button>
          </Space>
        )}
      />
    </Space>
  );
}; 