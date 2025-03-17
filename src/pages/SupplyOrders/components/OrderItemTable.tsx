import React, { useState } from 'react';
import { Table, InputNumber, Input, Select, Space, Tag, Button, message, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ObjectOption } from '@/types/order';
import { orderObjectApi } from '@/api/orderObject';

interface TableOrderItem {
  id: string;
  name: string;
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
  remarkCount?: string;  // 报单数量
  planCount?: number;    // 报单总数
  count: number;         // 实际数量
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
    remarkCount?: string;
    planCount?: number;
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

// 添加生成唯一ID的函数
const generateId = () => `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
  const [remarkValues, setRemarkValues] = useState<Record<string | number, string>>({});
  const [deliveryValues, setDeliveryValues] = useState<Record<string | number, string>>({});
  const [priceValues, setPriceValues] = useState<Record<string | number, number>>({});
  const [remarkInputValues, setRemarkInputValues] = useState<Record<string | number, string>>({});
  const [countValues, setCountValues] = useState<Record<string | number, number>>({});

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

  const handleAddNewRow = () => {
    const newItem: TableOrderItem = {
      id: generateId(),  // 使用 generateId 函数
      name: '',
      unit: type === 'bulk' ? '箱' : '',
      price: 0,
      unitPrice: 0,
      remark: '',
      deliveryName: undefined,
      objectDetailId: 0,
      totalPrice: 0,
      inventory: 0,
      count: 0
    };
    setNewItems(prev => [...prev, newItem]);
  };

  const handleDeleteRow = (record: TableOrderItem) => {
    const isNewItem = record.id.toString().startsWith('new-');
    const hasContent = record.objectDetailId && record.count > 0;

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

  const handleObjectSelect = async (value: number, option: any, record: TableOrderItem) => {
    // 当选择商品时添加货品
    try {
      await onAdd({
        objectDetailId: value,
        objectDetailName: option.label,
        count: record.count,
        unitName: type === 'bulk' ? '箱' : record.unit,
        price: record.price,
        remark: record.remark
      });
      // 添加成功后清除这条新建记录
      setNewItems(prev => prev.filter(item => item.id !== record.id));
    } catch (error) {
      message.error('添加商品失败：' + (error as Error).message);
    }
  };

  // 处理报单数量的输入
  const handleRemarkCountChange = (record: TableOrderItem, value: string) => {
    let newValue = value;
    
    // 如果输入的是数字
    if (/^\d+$/.test(value)) {
      if (record.remarkCount) {
        // 如果当前值已经包含加号，更新最后一个数字
        if (record.remarkCount.includes('+')) {
          const parts = record.remarkCount.split('+');
          parts[parts.length - 1] = value;
          newValue = parts.join('+');
        } else {
          // 如果当前值不包含加号，添加加号
          newValue = `${record.remarkCount}+${value}`;
        }
      } else {
        // 如果没有当前值，直接使用输入的数字
        newValue = value;
      }
    }

    // 计算报单总数
    const planCount = newValue
      .split('+')
      .filter(Boolean)
      .map(num => Number(num) || 0)
      .reduce((sum, num) => sum + num, 0);

    onEdit({
      objectDetailId: record.objectDetailId,
      remarkCount: newValue,
      planCount,
      count: planCount,
      price: record.price,
      remark: record.remark,
      unitName: record.unit
    });
  };

  const getColumns = (): ColumnsType<TableOrderItem> => {
    const baseColumns: ColumnsType<TableOrderItem> = [
      {
        title: '商品名称',
        dataIndex: 'name',
        key: 'name',
        render: (_, record) => {
          const isNewItem = record.id.toString().startsWith('new-');
          if (isNewItem) {
            return (
              <Select
                showSearch
                placeholder="搜索商品"
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                onSearch={searchObjects}
                onChange={(value, option) => handleObjectSelect(value, option, record)}
                notFoundContent={null}
                options={searchOptions.map(opt => ({
                  value: opt.objectDetailId,
                  label: opt.objectDetailName
                }))}
                style={{ width: '100%' }}
              />
            );
          }
          return record.name;
        }
      },
      {
        title: '报单数量',
        dataIndex: 'remarkCount',
        key: 'remarkCount',
        render: (_, record) => {
          const key = record.objectDetailId || record.id;
          const inputValue = remarkInputValues[key] ?? record.remarkCount;

          return (
            <Space>
              <Input
                style={{ width: 120 }}
                value={inputValue}
                onFocus={() => {
                  // 聚焦时，如果有值且不以加号结尾，添加加号
                  if (record.remarkCount && !record.remarkCount.endsWith('+')) {
                    setRemarkInputValues(prev => ({
                      ...prev,
                      [key]: record.remarkCount + '+'
                    }));
                  }
                }}
                onChange={(e) => {
                  // 只允许输入数字和加号
                  const value = e.target.value.replace(/[^0-9+]/g, '');
                  // 不允许连续的加号
                  const cleanValue = value.replace(/\++/g, '+');
                  setRemarkInputValues(prev => ({
                    ...prev,
                    [key]: cleanValue
                  }));
                }}
                onBlur={() => {
                  const value = remarkInputValues[key];
                  // 清除本地状态
                  setRemarkInputValues(prev => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                  });
                  // 更新到后端
                  if (value !== record.remarkCount) {
                    handleRemarkCountChange(record, value || '');
                  }
                }}
              />
              {record.planCount !== undefined && (
                <span>报单总数: {record.planCount}</span>
              )}
            </Space>
          );
        },
      },
      {
        title: '实际数量',
        dataIndex: 'count',
        key: 'count',
        render: (_, record) => {
          const key = record.objectDetailId || record.id;
          const inputValue = countValues[key] ?? record.count;

          return (
            <InputNumber
              value={inputValue}
              onChange={(value) => {
                setCountValues(prev => ({
                  ...prev,
                  [key]: value || 0
                }));
              }}
              onBlur={() => {
                const value = countValues[key];
                // 清除本地状态
                setCountValues(prev => {
                  const updated = { ...prev };
                  delete updated[key];
                  return updated;
                });
                // 更新到后端
                if (value !== record.count) {
                  onEdit({
                    objectDetailId: record.objectDetailId,
                    remarkCount: record.remarkCount,
                    planCount: record.planCount,
                    count: value || 0,
                    price: record.price,
                    remark: record.remark,
                    unitName: record.unit
                  });
                }
              }}
            />
          );
        },
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 120,
        render: (_, record) => (
          type === 'bulk' ? (
            // 大货固定为箱
            <Select
              value="箱"
              disabled
              style={{ width: '100%' }}
              options={[{ label: '箱', value: '箱' }]}
            />
          ) : (
            <Select
              value={record.unit}
              onChange={(value) => {
                if (value !== record.unit) {
                  onEdit({
                    objectDetailId: record.objectDetailId,
                    count: record.count,
                    price: record.price,
                    remark: record.remark,
                    deliveryName: record.deliveryName,
                    unitName: value
                  });
                }
              }}
              options={UNIT_OPTIONS}
              style={{ width: '100%' }}
            />
          )
        ),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 120,
        render: (_, record) => {
          const key = record.objectDetailId || record.id;
          const currentValue = remarkValues[key] ?? record.remark;

          return (
            <Input
              style={{ width: '100%' }}
              value={currentValue}
              onChange={(e) => {
                setRemarkValues(prev => ({
                  ...prev,
                  [key]: e.target.value
                }));
              }}
              onBlur={(e) => {
                const newValue = e.target.value;
                // 清除本地状态
                setRemarkValues(prev => {
                  const updated = { ...prev };
                  delete updated[key];
                  return updated;
                });
                // 只在值发生变化时才调用 onEdit
                if (newValue !== record.remark) {
                  onEdit({
                    objectDetailId: record.objectDetailId,
                    count: record.count,
                    price: record.price,
                    remark: newValue,
                    unitName: record.unit
                  });
                }
              }}
            />
          );
        },
      },
      {
        title: '配货员',
        dataIndex: 'deliveryName',
        key: 'deliveryName',
        render: (_, record) => {
          const key = record.objectDetailId || record.id;
          const currentValue = deliveryValues[key] ?? record.deliveryName;

          return (
            <Select
              allowClear
              showSearch
              style={{ width: '100%' }}
              placeholder="选择配货员"
              value={currentValue}
              options={deliveryUsers}
              onChange={(value) => {
                // 更新本地状态
                setDeliveryValues(prev => ({
                  ...prev,
                  [key]: value
                }));
                // 直接调用 onEdit，因为 Select 不需要失焦处理
                onEdit({
                  objectDetailId: record.objectDetailId,
                  count: record.count,
                  price: record.price,
                  remark: record.remark,
                  deliveryName: value,
                  unitName: record.unit
                });
              }}
              onBlur={() => {
                // 清除本地状态
                setDeliveryValues(prev => {
                  const updated = { ...prev };
                  delete updated[key];
                  return updated;
                });
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          );
        },
      },
    ];

    if (isAdmin) {
      baseColumns.push(
        {
          title: '单价',
          dataIndex: 'price',
          key: 'price',
          render: (_, record) => {
            const key = record.objectDetailId || record.id;
            const currentValue = priceValues[key] ?? record.price;

            return (
              <Space>
                <InputNumber
                  value={currentValue}
                  min={0}
                  precision={2}
                  style={{ width: 100 }}
                  onChange={(value) => {
                    // 更新本地状态
                    setPriceValues(prev => ({
                      ...prev,
                      [key]: value || 0
                    }));
                  }}
                  onBlur={(e) => {
                    const newValue = parseFloat(e.target.value);
                    // 清除本地状态
                    setPriceValues(prev => {
                      const updated = { ...prev };
                      delete updated[key];
                      return updated;
                    });
                    // 只在值发生变化时才调用 onEdit
                    if (newValue !== record.price) {
                      onEdit({
                        objectDetailId: record.objectDetailId,
                        count: record.count,
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
            );
          },
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
        rowKey="objectDetailId"
        columns={getColumns()}
        dataSource={[...items, ...newItems]}
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