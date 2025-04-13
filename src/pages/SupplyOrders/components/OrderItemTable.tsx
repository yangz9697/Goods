import React, { useState, useEffect, useRef } from 'react';
import { Table, InputNumber, Input, Select, Space, Tag, Button, message, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ObjectOption } from '@/types/order';
import { orderObjectApi } from '@/api/orderObject';
import CreateObjectModal from '@/components/CreateObjectModal';
import { ScaleService } from '@/services/ScaleService';

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
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [emptyRow, setEmptyRow] = useState<TableOrderItem>({
    id: 'empty',
    name: '',
    unit: '斤',
    price: 0,
    unitPrice: 0,
    remark: '',
    objectDetailId: 0,
    count: 0,
    remarkCount: '',
    planCount: undefined,
    deliveryName: undefined
  });
  const [newItems, setNewItems] = useState<TableOrderItem[]>([]);
  const [remarkValues, setRemarkValues] = useState<Record<string | number, string>>({});
  const [deliveryValues, setDeliveryValues] = useState<Record<string | number, string>>({});
  const [priceValues, setPriceValues] = useState<Record<string | number, number>>({});
  const [remarkInputValues, setRemarkInputValues] = useState<Record<string | number, string>>({});
  const [countValues, setCountValues] = useState<Record<string | number, number>>({});
  const [showButtonMap, setShowButtonMap] = useState<Record<string | number, boolean>>({});
  const scaleServiceRef = useRef<ScaleService | null>(null);
  const [isScaleConnected, setIsScaleConnected] = useState(false);

  useEffect(() => {
    return () => {
      // 组件卸载时断开电子秤连接
      if (scaleServiceRef.current) {
        scaleServiceRef.current.disconnect();
      }
    };
  }, []);

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

  const handleObjectSelect = async (value: number, option: any) => {
    try {
      await onAdd({
        objectDetailId: value,
        objectDetailName: option.label,
        count: 0,
        unitName: type === 'bulk' ? '箱' : '斤',
        price: 0,
        remark: ''
      });
      // 添加成功后重置空行
      setEmptyRow({
        ...emptyRow,
        id: `empty-${Date.now()}` // 更新 id 触发重新渲染
      });
    } catch (error) {
      message.error('添加商品失败：' + (error as Error).message);
    }
  };

  // 处理报单数量的输入
  const handleRemarkCountChange = (record: TableOrderItem, value: string) => {
    // 如果值没有变化，直接返回
    if (value === record.remarkCount) {
      return;
    }

    let newValue = value;
    
    // 如果输入的是数字
    if (/^\d*\.?\d*$/.test(value)) {
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

  const handleScaleButtonClick = async (record: TableOrderItem) => {
    const key = record.objectDetailId || record.id;
    
    if (!scaleServiceRef.current) {
      scaleServiceRef.current = new ScaleService();
    }

    if (!isScaleConnected) {
      const connected = await scaleServiceRef.current.connect();
      if (!connected) {
        message.error('连接电子秤失败');
        return;
      }
      setIsScaleConnected(true);
    }

    try {
      await scaleServiceRef.current.startReading((weight) => {
        if (weight !== null) {
          setCountValues(prev => ({
            ...prev,
            [key]: weight
          }));
          onEdit({
            objectDetailId: record.objectDetailId,
            count: weight,
            price: record.price,
            remark: record.remark,
            deliveryName: record.deliveryName,
            unitName: record.unit
          });
        }
      });
    } catch (error) {
      message.error('读取电子秤数据失败');
      // 如果读取失败，重置串口连接
      await ScaleService.reset();
      setIsScaleConnected(false);
    }
  };

  // 添加重置串口的方法
  const handleResetScale = async () => {
    await ScaleService.reset();
    setIsScaleConnected(false);
    message.success('已重置电子秤连接');
  };

  const getColumns = (): ColumnsType<TableOrderItem> => {
    const baseColumns: ColumnsType<TableOrderItem> = [
      {
        title: '货品',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        render: (_, record: TableOrderItem) => {
          // 如果是已有记录，显示名称
          if (record.objectDetailId !== 0) {
            return record.name;
          }
          
          // 如果是空行，显示搜索选择框
          return (
            <Space.Compact style={{ width: '100%' }}>
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="搜索选择货品"
                filterOption={false}
                onSearch={searchObjects}
                onChange={(value, option) => handleObjectSelect(value, option)}
                options={searchOptions.map(opt => ({
                  label: opt.objectDetailName,
                  value: opt.objectDetailId
                }))}
                notFoundContent={
                  <div style={{ padding: '8px 0', fontSize: '12px', textAlign: 'center' }}>
                    <div style={{ marginBottom: 8 }}>未找到相关货品</div>
                    <Button type="link" onClick={() => setCreateModalVisible(true)} style={{ fontSize: '12px', padding: 0 }}>
                      点击创建新货品
                    </Button>
                  </div>
                }
              />
            </Space.Compact>
          );
        }
      },
      {
        title: '报单数量',
        dataIndex: 'remarkCount',
        key: 'remarkCount',
        width: 120,
        render: (_, record) => {
          const key = record.objectDetailId || record.id;
          const inputValue = remarkInputValues[key] ?? record.remarkCount;

          return (
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ width: 120 }}
              value={inputValue}
              onFocus={() => {
                if (record.remarkCount && !record.remarkCount.endsWith('+')) {
                  setRemarkInputValues(prev => ({
                    ...prev,
                    [key]: record.remarkCount + '+'
                  }));
                }
              }}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.+]/g, '');
                const parts = value.split('.');
                const cleanValue = parts.length > 2 
                  ? `${parts[0]}.${parts.slice(1).join('')}`
                  : value;
                const finalValue = cleanValue.replace(/\++/g, '+');
                setRemarkInputValues(prev => ({
                  ...prev,
                  [key]: finalValue
                }));
              }}
              onBlur={() => {
                const value = remarkInputValues[key];
                setRemarkInputValues(prev => {
                  const updated = { ...prev };
                  delete updated[key];
                  return updated;
                });
                if (value !== record.remarkCount) {
                  handleRemarkCountChange(record, value || '');
                }
              }}
            />
          );
        },
      },
      {
        title: '实际数量',
        dataIndex: 'count',
        key: 'count',
        width: 120,
        render: (_, record) => {
          const key = record.objectDetailId || record.id;
          const currentValue = countValues[key] ?? record.count;
          const showButton = showButtonMap[key] || false;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.1}
                precision={1}
                value={currentValue}
                onChange={(value) => {
                  setCountValues(prev => ({
                    ...prev,
                    [key]: value || 0
                  }));
                }}
                onFocus={(e) => {
                  e.target.select();
                  setShowButtonMap(prev => ({
                    ...prev,
                    [key]: true
                  }));
                }}
                onBlur={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setCountValues(prev => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                  });
                  if (newValue !== record.count) {
                    onEdit({
                      objectDetailId: record.objectDetailId,
                      count: newValue,
                      price: record.price,
                      remark: record.remark,
                      deliveryName: record.deliveryName,
                      unitName: record.unit
                    });
                  }
                  setShowButtonMap(prev => ({
                    ...prev,
                    [key]: false
                  }));
                }}
                placeholder="请输入数量"
              />
              {showButton && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button
                    type="link"
                    size="small"
                    style={{
                      padding: '0 4px',
                      height: '22px',
                      lineHeight: '22px'
                    }}
                    onClick={() => handleScaleButtonClick(record)}
                  >
                    代入
                  </Button>
                  {isScaleConnected && (
                    <Button
                      type="link"
                      size="small"
                      danger
                      style={{
                        padding: '0 4px',
                        height: '22px',
                        lineHeight: '22px'
                      }}
                      onClick={handleResetScale}
                    >
                      重置
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
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
        width: 100,
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
        width: 100,
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
      {
        title: '单价',
        dataIndex: 'price',
        key: 'price',
        width: 100,
        render: (_, record) => {
          const key = record.objectDetailId || record.id;
          const currentValue = priceValues[key] ?? record.price;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <InputNumber
                value={currentValue}
                min={0}
                precision={2}
                style={{ width: '100%' }}
                onChange={(value) => {
                  setPriceValues(prev => ({
                    ...prev,
                    [key]: value || 0
                  }));
                }}
                onBlur={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setPriceValues(prev => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                  });
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
              <Tag color="blue" style={{ margin: 0, alignSelf: 'flex-start' }}>今日价: {record.unitPrice}</Tag>
            </div>
          );
        },
      },
    ];

    if (isAdmin) {
      baseColumns.push(
        {
          title: '金额',
          dataIndex: 'totalPrice',
          key: 'totalPrice',
          width: 80,
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
      width: 80,
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
    <div style={{ height: '100%', width: '100%' }}>
      <Table
        columns={getColumns()}
        dataSource={[...items, emptyRow, ...newItems]}
        rowKey="id"
        pagination={false}
        scroll={{ y: '100%' }}
        style={{ height: '100%' }}
        sticky
      />
      <CreateObjectModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          // 清空搜索框，触发重新搜索
          setSearchOptions([]);
        }}
      />
    </div>
  );
}; 