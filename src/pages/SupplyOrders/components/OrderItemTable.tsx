import React, { useState } from 'react';
import { Table, InputNumber, Input, Select, Space, Tag, Button, message, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ObjectOption } from '@/types/order';
import { orderObjectApi } from '@/api/orderObject';

interface TableOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  unitPrice: number;
  remark: string;
  deliveryName?: string;
  objectDetailId: number;
  totalPrice?: number;
  inventory?: number;
  orderNo?: string;
  userName?: string;
  mobile?: string;
  orderStatusCode?: string;
  orderStatusName?: string;
  createTime?: number;
  updateTime?: number;
}

interface OrderItemTableProps {
  items: TableOrderItem[];
  type: 'all' | 'bulk';
  isAdmin: boolean;
  deliveryUsers: { label: string; value: string }[];
  onEdit: (values: {
    objectDetailId: number;
    count: number;
    price: number;
    remark: string;
    deliveryName?: string;
    unitName: string;
  }) => void;
  onDelete: (objectDetailId: number) => void;
  onAdd: (values: {
    objectDetailId: number;
    objectDetailName: string;
    count: number;
    unitName: string;
    price: number;
    remark: string;
  }) => void;
}

// 修改单位选项的定义
const UNIT_OPTIONS = [
  { label: '个', value: '个' },
  { label: '斤', value: '斤' },
  { label: '箱', value: '箱' }
];

export const OrderItemTable: React.FC<OrderItemTableProps> = ({
  items,
  type,
  isAdmin,
  deliveryUsers,
  onEdit,
  onDelete,
  onAdd
}) => {
  const [searchOptions, setSearchOptions] = useState<ObjectOption[]>([]);
  const [newItems, setNewItems] = useState<TableOrderItem[]>([]);

  const searchObjects = async (keyword: string) => {
    if (!keyword) {
      setSearchOptions([]);
      return;
    }
    try {
      const response = await orderObjectApi.selectObjectByName(keyword);
      if (response.success) {
        setSearchOptions(response.data || []);
      } else {
        message.error(response.displayMsg || '搜索商品失败');
      }
    } catch (error) {
      message.error('搜索商品失败：' + (error as Error).message);
    }
  };

  const fetchInventory = async (objectDetailId: number, itemId: string) => {
    try {
      const response = await orderObjectApi.getObjectInventory(objectDetailId, '斤');
      if (response.success) {
        setNewItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, inventory: response.data === null ? 0 : response.data }
            : item
        ));
      }
    } catch (error) {
      message.error('获取库存失败：' + (error as Error).message);
    }
  };

  const handleAddNewRow = () => {
    const newItemId = `new-${Date.now()}`;
    setNewItems(prev => [...prev, {
      id: newItemId,
      name: '',
      quantity: 0,
      unit: '个',
      price: 0,
      unitPrice: 0,
      remark: '',
      objectDetailId: 0
    }]);
  };

  const handleDeleteRow = (record: TableOrderItem) => {
    const isNewItem = record.id.toString().startsWith('new-');
    const hasContent = record.objectDetailId && record.quantity > 0;

    if (isNewItem || !hasContent) {
      if (isNewItem) {
        setNewItems(prev => prev.filter(item => item.id !== record.id));
      } else {
        onDelete(record.objectDetailId);
      }
    } else {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除${record.name}吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: () => onDelete(record.objectDetailId)
      });
    }
  };

  const handleQuantityBlur = (record: TableOrderItem) => {
    if (record.id.toString().startsWith('new-') && record.objectDetailId && record.quantity > 0) {
      onAdd({
        objectDetailId: record.objectDetailId,
        objectDetailName: record.name,
        count: record.quantity,
        unitName: record.unit,
        price: record.price,
        remark: record.remark
      });
      setNewItems(prev => prev.filter(item => item.id !== record.id));
    }
  };

  const getColumns = (): ColumnsType<TableOrderItem> => {
    const baseColumns: ColumnsType<TableOrderItem> = [
      {
        title: '商品名称',
        dataIndex: 'name',
        key: 'name',
        render: (_, record) => {
          if (record.id.toString().startsWith('new-')) {
            return (
              <Select
                showSearch
                placeholder="输入商品名称搜索"
                style={{ width: '100%' }}
                filterOption={false}
                onSearch={searchObjects}
                onChange={(_, option: any) => {
                  const selectedItem = option.data;
                  setNewItems(prev => prev.map(item => 
                    item.id === record.id 
                      ? {
                          ...item,
                          name: selectedItem.objectDetailName,
                          objectDetailId: selectedItem.objectDetailId,
                        }
                      : item
                  ));
                  fetchInventory(selectedItem.objectDetailId, record.id);
                }}
                options={searchOptions.map(item => ({
                  label: item.objectDetailName,
                  value: item.objectDetailId,
                  data: item
                }))}
              />
            );
          }
          return record.name;
        }
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        render: (_, record) => {
          const isNewItem = record.id.toString().startsWith('new-');
          if (isNewItem) {
            return (
              <Space>
                <InputNumber
                  value={record.quantity}
                  onChange={(value) => {
                    setNewItems(prev => prev.map(item => 
                      item.id === record.id 
                        ? { ...item, quantity: value || 0 }
                        : item
                    ));
                  }}
                  onBlur={() => handleQuantityBlur(record)}
                />
                {record.inventory !== undefined && (
                  <Tag color="blue">
                    库存: {record.inventory} {record.unit}
                  </Tag>
                )}
              </Space>
            );
          }
          return (
            <InputNumber
              defaultValue={record.quantity}
              onBlur={(e) => {
                const newValue = Number(e.target.value);
                if (newValue !== record.quantity) {
                  onEdit({
                    objectDetailId: record.objectDetailId,
                    count: newValue,
                    price: record.price,
                    remark: record.remark,
                    unitName: record.unit
                  });
                }
              }}
            />
          );
        }
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        render: (_, record) => {
          return (
            <Select
              value={record.unit}
              style={{ width: '100%' }}
              onChange={(value) => {
                if (record.id === 'new') {
                  setNewItems(prev => prev.map(item => ({
                    ...item,
                    unit: value
                  })));
                } else {
                  onEdit({
                    objectDetailId: record.objectDetailId,
                    count: record.quantity,
                    price: record.price,
                    remark: record.remark,
                    deliveryName: record.deliveryName,
                    unitName: value
                  });
                }
              }}
              options={UNIT_OPTIONS}
            />
          );
        }
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        render: (_, record) => (
          <Input
            defaultValue={record.remark}
            onBlur={(e) => {
              const newValue = e.target.value;
              if (newValue !== record.remark) {
                onEdit({
                  objectDetailId: record.objectDetailId,
                  count: record.quantity,
                  price: record.price,
                  remark: newValue,
                  unitName: record.unit
                });
              }
            }}
          />
        ),
      },
    ];

    baseColumns.push({
      title: '配货员',
      dataIndex: 'deliveryName',
      key: 'deliveryName',
      render: (_, record) => (
        <Select
          allowClear
          showSearch
          style={{ width: '100%' }}
          placeholder="选择配货员"
          defaultValue={record.deliveryName}
          options={deliveryUsers}
          onChange={(value) => {
            onEdit({
              objectDetailId: record.objectDetailId,
              count: record.quantity,
              price: record.price,
              remark: record.remark,
              deliveryName: value,
              unitName: record.unit
            });
          }}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    });

    if (isAdmin) {
      baseColumns.push(
        {
          title: '单价',
          dataIndex: 'price',
          key: 'price',
          render: (_, record) => (
            <Space>
              <InputNumber
                defaultValue={record.price}
                min={0}
                precision={2}
                style={{ width: 100 }}
                onBlur={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (newValue !== record.price) {
                    onEdit({
                      objectDetailId: record.objectDetailId,
                      count: record.quantity,
                      price: newValue,
                      remark: record.remark,
                      deliveryName: record.deliveryName,
                      unitName: record.unit
                    });
                  }
                }}
              />
              <Tag color="blue">今日价: {record.unitPrice}</Tag>
            </Space>
          ),
        },
        {
          title: '金额',
          dataIndex: 'totalPrice',
          key: 'totalPrice',
          render: (_, record: any) => (
            <span>{record.totalPrice?.toFixed(2) || '-'}</span>
          ),
        }
      );
    }

    baseColumns.push({
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      onCell: () => ({ style: { padding: 0 } }),
      render: (_, record) => {
        return (
          <Button 
            type="link" 
            danger
            onClick={() => handleDeleteRow(record)}
          >
            删除
          </Button>
        );
      },
    });

    return baseColumns;
  };

  return (
    <>
      <Table
        dataSource={[...items, ...newItems]}
        rowKey="id"
        pagination={false}
        columns={getColumns()}
      />
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={handleAddNewRow}
        style={{ marginTop: 16 }}
      >
        添加{type === 'bulk' ? '大货' : '货品'}
      </Button>
    </>
  );
}; 