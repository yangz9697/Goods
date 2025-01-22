import React, { useState } from 'react';
import { Table, InputNumber, Input, Select, Space, Tag, Button, Popconfirm, Row, Col, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { NewOrderItem, ObjectOption } from '@/types/order';
import { orderObjectApi } from '@/api/orderObject';

interface OrderItemTableProps {
  items: NewOrderItem[];
  type: 'all' | 'bulk';
  isAdmin: boolean;
  deliveryUsers: { label: string; value: string }[];
  onEdit: (values: {
    objectDetailId: number;
    count: number;
    price: number;
    remark: string;
    deliveryName?: string;
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

export const OrderItemTable: React.FC<OrderItemTableProps> = ({
  items,
  type,
  isAdmin,
  deliveryUsers,
  onEdit,
  onDelete,
  onAdd
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchOptions, setSearchOptions] = useState<ObjectOption[]>([]);
  const [newItem, setNewItem] = useState<NewOrderItem>(() => ({
    id: 'new-item',
    name: '',
    quantity: 0,
    unit: type === 'bulk' ? '箱' : '斤',
    price: 0,
    unitPrice: 0,
    remark: '',
    deliveryName: undefined,
    objectDetailId: 0
  }));

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

  const fetchInventory = async (objectDetailId: number) => {
    try {
      const response = await orderObjectApi.getObjectInventory(objectDetailId, '斤');
      if (response.success) {
        setNewItem(prev => ({
          ...prev,
          inventory: response.data === null ? 0 : response.data
        }));
      }
    } catch (error) {
      message.error('获取库存失败：' + (error as Error).message);
    }
  };

  const getColumns = (): ColumnsType<NewOrderItem> => {
    const baseColumns: ColumnsType<NewOrderItem> = [
      {
        title: '商品名称',
        dataIndex: 'name',
        key: 'name',
        render: (_, record) => {
          if (record.id === 'new-item') {
            return (
              <Select
                showSearch
                placeholder="输入商品名称搜索"
                style={{ width: '100%' }}
                filterOption={false}
                onSearch={searchObjects}
                onChange={(_, option: any) => {
                  const selectedItem = option.data;
                  setNewItem({
                    ...newItem,
                    name: selectedItem.objectDetailName,
                    objectDetailId: selectedItem.objectDetailId,
                  });
                  fetchInventory(selectedItem.objectDetailId);
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
          if (record.id === 'new-item') {
            return (
              <Space>
                <InputNumber
                  value={record.quantity}
                  onChange={(value) => {
                    setNewItem(prev => ({
                      ...prev,
                      quantity: value || 0
                    }));
                  }}
                  onBlur={() => {
                    if (record.objectDetailId && record.quantity > 0) {
                      onAdd({
                        objectDetailId: record.objectDetailId,
                        objectDetailName: record.name,
                        count: record.quantity,
                        unitName: record.unit,
                        price: 0,
                        remark: record.remark
                      });
                      setIsAdding(false);
                      setNewItem({
                        id: 'new-item',
                        name: '',
                        quantity: 0,
                        unit: type === 'bulk' ? '箱' : '斤',
                        price: 0,
                        unitPrice: 0,
                        remark: '',
                        deliveryName: undefined,
                        objectDetailId: 0
                      });
                    }
                  }}
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
                    remark: record.remark
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
                  remark: newValue
                });
              }
            }}
          />
        ),
      },
    ];

    // 只在全部视图中显示配货员列
    if (type === 'all') {
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
                deliveryName: value
              });
            }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        ),
      });
    }

    // 管理员可见的额外列
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
                      deliveryName: record.deliveryName
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
      render: (_, record) => (
        <Popconfirm
          title="确定要删除这个货品吗？"
          onConfirm={() => onDelete(record.objectDetailId)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    });

    return baseColumns;
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <>
      <Table
        dataSource={[...items, ...(isAdding ? [newItem] : [])]}
        rowKey="id"
        pagination={false}
        columns={getColumns()}
      />
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => setIsAdding(true)}
        style={{ marginTop: 16 }}
        disabled={isAdding}
      >
        添加{type === 'bulk' ? '大货' : '货品'}
      </Button>
    </>
  );
}; 