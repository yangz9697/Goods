import React, { useState } from 'react';
import { Space, Button, Table, Tag, Tooltip, message } from 'antd';
import type { OrderType, OrderFilters } from '../../types/order';
import { getStatusColor, getStatusText } from '../../utils/status';
import { formatPhone } from '../../utils/format';
import { OrderModal } from './OrderModal';
import { addObjectOrder } from '../../api/orders';
import dayjs from 'dayjs';

interface OrderListProps {
  orders: OrderType[];
  selectedOrders: string[];
  filters: OrderFilters;
  onFiltersChange: (filters: Partial<OrderFilters>) => void;
  onOrderSelect: (selectedRowKeys: string[]) => void;
  onOrderEdit: (order: OrderType) => void;
  onOrderDelete: (id: string) => void;
  onPrint: (orderIds: string[]) => void;
  onExport: (orderIds: string[]) => void;
  selectedCustomer?: {
    id: string;
    name: string;
  } | null;
  onSuccess?: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  selectedOrders,
  onOrderSelect,
  onOrderEdit,
  onOrderDelete,
  onPrint,
  onExport,
  selectedCustomer,
  onSuccess
}) => {
  const [addModalVisible, setAddModalVisible] = useState(false);

  const handleAddOrder = async (values: {
    orderSupplyDate: string;
    remark: string;
    userId: number;
  }) => {
    try {
      const response = await addObjectOrder(values);
      if (response.success) {
        message.success('添加成功');
        setAddModalVisible(false);
        onSuccess?.();
      } else {
        message.error(response.displayMsg || '添加失败');
      }
    } catch (error) {
      message.error('添加失败: ' + (error as Error).message);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* 操作按钮 */}
      <Space>
        <Button type="primary" onClick={() => setAddModalVisible(true)}>
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

      <OrderModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSubmit={handleAddOrder}
        selectedCustomer={selectedCustomer}
        defaultDate={dayjs()}
      />
    </Space>
  );
}; 