import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Table, InputNumber, Input, Select, Space, Button, message, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ObjectOption } from '@/types/order';
import { orderObjectApi } from '@/api/orderObject';
import { addObject } from '@/api/objectDetail';
import CreateObjectModal from '@/components/CreateObjectModal';
import dayjs from 'dayjs';

interface TableOrderItem {
  rowId?: string;
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
  count: number | undefined;         // 实际数量
  isEmptyRow?: boolean;  // 是否是空行
  jinPerBox?: number;    // 斤/箱
  amountPerBox?: number;  // 个/箱
  deliverUpdateTime?: number;
}

interface OrderItemTableProps {
  items: TableOrderItem[];
  type: 'all' | 'bulk';
  isAdmin: boolean;
  deliveryUsers: { label: string; value: string }[];
  weight: string;
  onEdit: (values: {
    id: string;
    objectDetailId: number;
    count?: number | undefined;
    price?: number;
    totalPrice?: number;
    remark?: string;
    deliveryName?: string;
    unitName?: string;
    remarkCount?: string;
    planCount?: number;
  }) => void;
  onDelete: (id: string) => void;
  onAdd: (values: {
    objectDetailId: number;
    objectDetailName: string;
    count: number;
    unitName: string;
    price: number;
    remark: string;
  }) => Promise<string>;
}

// 修改单位选项的定义
const UNIT_OPTIONS = [
  { label: '个', value: '个' },
  { label: '斤', value: '斤' },
  { label: '盒', value: '盒' },
  { label: '箱', value: '箱' }
];

export interface OrderItemTableRef {
  scrollToLastDeliveryItem: () => void;
}

export const OrderItemTable = forwardRef<OrderItemTableRef, OrderItemTableProps>(({
  items,
  type,
  isAdmin,
  deliveryUsers,
  weight,
  onEdit,
  onDelete,
  onAdd
}, ref) => {
  const [searchOptions, setSearchOptions] = useState<ObjectOption[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [emptyRow, setEmptyRow] = useState<TableOrderItem>({
    rowId: 'empty',
    id: '',
    name: '',
    unit: '斤',
    price: 0,
    unitPrice: 0,
    remark: '',
    objectDetailId: 0,
    count: 0,
    remarkCount: '',
    planCount: undefined,
    deliveryName: undefined,
    isEmptyRow: true
  });
  const [remarkValues, setRemarkValues] = useState<Record<string | number, string>>({});
  const [deliveryValues, setDeliveryValues] = useState<Record<string | number, string>>({});
  const [priceValues, setPriceValues] = useState<Record<string | number, number>>({});
  const [totalPriceValues, setTotalPriceValues] = useState<Record<string | number, number>>({});
  const [remarkInputValues, setRemarkInputValues] = useState<Record<string | number, string>>({});
  const [countValues, setCountValues] = useState<Record<string | number, number | undefined>>({});
  const [showButtonMap, setShowButtonMap] = useState<Record<string | number, boolean>>({});
  const [activeInputKey, setActiveInputKey] = useState<string | number | null>(null);
  const isSelectingOptionRef = useRef(false);
  const tableRef = useRef<any>(null);

  useEffect(() => {
    // 延迟执行，等待表格渲染完成
    setTimeout(() => {
      // 滚动到底部
      const tableBody = document.querySelector('.ant-table-body');
      if (tableBody) {
        tableBody.scrollTop = tableBody.scrollHeight;
      }
      
      // 聚焦到最后一行的货品搜索框
      const lastRow = document.querySelector('.ant-table-row:last-child .ant-select-selector');
      if (lastRow) {
        (lastRow as HTMLElement).click();
      }
    }, 100);
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
    const hasContent = record.id;
    hasContent && onDelete(record.id);
  };

  const handleObjectSelect = async (value: number, option: any) => {
    try {
      const newId = await onAdd({
        objectDetailId: value,
        objectDetailName: option.label,
        count: 0,
        unitName: type === 'bulk' ? '箱' : '斤',
        price: 0,
        remark: ''
      });
      // 添加成功后重置空行和搜索选项
      setEmptyRow({
        rowId: `empty-${Date.now()}`, // 更新 id 触发重新渲染
        id: '',
        name: '',
        unit: '斤',
        price: 0,
        unitPrice: 0,
        remark: '',
        objectDetailId: 0,
        count: 0,
        remarkCount: '',
        planCount: undefined,
        deliveryName: undefined,
        isEmptyRow: true
      });

      // 延迟执行，等待新行渲染完成
      setTimeout(() => {
        // 找到 rowId 匹配的行，并聚焦到该行的报单数量输入框
        const rows = document.querySelectorAll('.ant-table-row');
        for (const row of rows) {
          const dataRowKey = row.getAttribute('data-row-key');

          if (dataRowKey === newId) {
            const remarkCountInput = row.querySelector('.ant-input');
            if (remarkCountInput) {
              (remarkCountInput as HTMLElement).focus();
              break;
            }
          }
        }
      }, 100);
    } catch (error) {
      message.error('添加商品失败：' + (error as Error).message);
    }
  };

  const handleObjectBlur = async (value: string) => {
    if (!value) return;
    
    // 检查是否已经存在这个货品
    const existingOption = searchOptions.find(opt => opt.objectDetailName === value);
    if (existingOption) {
      await handleObjectSelect(existingOption.objectDetailId, { label: value });
      return;
    }

    // 显示确认弹窗
    Modal.confirm({
      title: '确认创建',
      content: '仓库无此商品，是否继续创建？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 使用 addObject 创建新货品，设置默认值
          const createRes = await addObject({
            objectDetailName: value,
            amountForBox: 1,  // 默认每箱1个
            jinForBox: 1,     // 默认每箱1斤
            he: 1,             // 默认每箱1盒
            box: 1, 
            jin: 1,
            amount: 1,
            isTemp: true
          });

          if (createRes.success) {
            // 重新搜索获取新创建的货品
            const searchRes = await orderObjectApi.selectObjectByName(value);
            if (searchRes.success && searchRes.data && searchRes.data.length > 0) {
              const newObject = searchRes.data[0];
              await handleObjectSelect(newObject.objectDetailId, { label: value });
            }
          } else {
            message.error(createRes.displayMsg || '创建货品失败');
          }
        } catch (error) {
          message.error('创建货品失败：' + (error as Error).message);
        }
      }
    });
  };

  // 处理报单数量的输入
  const handleRemarkCountChange = async (record: TableOrderItem, value: string) => {
    // 如果值没有变化，直接返回
    if (value === record.remarkCount) {
      return;
    }

    let newValue = value;

    // 计算报单总数
    const planCount = parseFloat(newValue
      .split('+')
      .filter(Boolean)
      .map(num => Number(num) || 0)
      .reduce((sum, num) => sum + num, 0)
      .toFixed(1));

    try {
      const checkRes = await orderObjectApi.checkObjectDetailInventory({
        count: planCount,
        id: record.id,
        unitName: record.unit
      });

      if (checkRes.success) {
        if (checkRes.data < 0) {
          // 库存为负，弹窗提示
          Modal.confirm({
            title: '库存警告',
            content: `${record.name} 库存将变为负数 (${checkRes.data})，是否继续填写？`,
            okText: '确认',
            cancelText: '取消',
            onOk: () => {
              // 用户确认，调用 onEdit
              onEdit({
                id: record.id,
                objectDetailId: record.objectDetailId,
                remarkCount: newValue,
                planCount,
                count: planCount,
                // price: record.price,
                // remark: record.remark,
                // unitName: record.unit
              });
            },
            onCancel: () => {
              // 用户取消，不做任何操作
            }
          });
        } else {
          // 库存不为负，直接调用 onEdit
          onEdit({
            id: record.id,
            objectDetailId: record.objectDetailId,
            remarkCount: newValue,
            planCount,
            count: planCount,
            // price: record.price,
            // remark: record.remark,
            // unitName: record.unit
          });
        }
      } else {
        // 接口调用失败，提示错误信息但仍然允许修改
        message.error(checkRes.displayMsg || '检查库存失败');
        onEdit({
          id: record.id,
          objectDetailId: record.objectDetailId,
          remarkCount: newValue,
          planCount,
          count: planCount,
          // price: record.price,
          // remark: record.remark,
          // unitName: record.unit
        });
      }
    } catch (error) {
      message.error('检查库存发生错误：' + (error as Error).message);
      // 发生错误时也允许修改
      onEdit({
        id: record.id,
        objectDetailId: record.objectDetailId,
        remarkCount: newValue,
        planCount,
        count: planCount,
        // price: record.price,
        // remark: record.remark,
        // unitName: record.unit
      });
    }
  };

  const handleInputFocus = (key: string | number) => {
    setActiveInputKey(key);
    setShowButtonMap(prev => ({
      ...prev,
      [key]: true
    }));
    // 选中输入框内容
    setTimeout(() => {
      const input = document.activeElement as HTMLInputElement;
      if (input) {
        input.select();
      }
    }, 0);
  };

  const handleInputBlur = async (key: string | number, record: TableOrderItem) => {
    // 更新表单数据
    const newValue = countValues[key] ?? record.count;
    // 确保 newValue 是一个有效的数字，否则不进行库存检查和更新
    if (typeof newValue !== 'number' || isNaN(newValue)) {
       // 清除本地状态
        setCountValues(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
        // 延迟隐藏按钮，给点击事件一个执行的机会
        setTimeout(() => {
          if (activeInputKey === key) {
            setActiveInputKey(null);
            setShowButtonMap(prev => ({
              ...prev,
              [key]: false
            }));
          }
        }, 200);
      return;
    }

    if (newValue !== record.count) {

      try {
        const checkRes = await orderObjectApi.checkObjectDetailInventory({
          count: newValue,
          id: record.id, // 假设 objectDetailId 对应接口的 id 参数
          unitName: record.unit
        });

        if (checkRes.success) {
          if (checkRes.data < 0) {
            // 库存为负，弹窗提示
            Modal.confirm({
              title: '库存警告',
              content: `${record.name} 库存将变为负数 (${checkRes.data})，是否继续填写？`,
              okText: '确认',
              cancelText: '取消',
              onOk: () => {
                // 用户确认，调用 onEdit
                onEdit({
                  id: record.id,
                  objectDetailId: record.objectDetailId,
                  count: newValue,
                  // price: record.price,
                  // remark: record.remark,
                  // deliveryName: record.deliveryName,
                  // unitName: record.unit
                });
                 // 清除本地状态只有在用户确认修改后进行
                setCountValues(prev => {
                  const updated = { ...prev };
                  delete updated[key];
                  return updated;
                });
              },
              onCancel: () => {
                // 用户取消，回滚输入框的值到原始值，并清除本地状态
                setCountValues(prev => {
                  const updated = { ...prev };
                  delete updated[key]; // 清除本地状态，让 InputNumber 回显 record.count
                  return updated;
                });
                // 不需要调用 onEdit
              }
            });
          } else {
            // 库存不为负，直接调用 onEdit
             onEdit({
                id: record.id,
                objectDetailId: record.objectDetailId,
                count: newValue,
                // price: record.price,
                // remark: record.remark,
                // deliveryName: record.deliveryName,
                // unitName: record.unit
              });
              // 清除本地状态
              setCountValues(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
              });
          }
        } else {
           // 接口调用失败，提示错误信息但仍然允许修改 (或者根据需求选择阻止修改)
           message.error(checkRes.displayMsg || '检查库存失败');
            onEdit({
              id: record.id,
              objectDetailId: record.objectDetailId,
              count: newValue,
              // price: record.price,
              // remark: record.remark,
              // deliveryName: record.deliveryName,
              // unitName: record.unit
            });
             // 清除本地状态
            setCountValues(prev => {
              const updated = { ...prev };
              delete updated[key];
              return updated;
            });
        }
       } catch (error) {
          message.error('检查库存发生错误：' + (error as Error).message);
          // 发生错误时也允许修改 (或者选择阻止)
          onEdit({
            id: record.id,
            objectDetailId: record.objectDetailId,
            count: newValue,
            // price: record.price,
            // remark: record.remark,
            // deliveryName: record.deliveryName,
            // unitName: record.unit
          });
           // 清除本地状态
          setCountValues(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
       }

    }

    // 延迟隐藏按钮，给点击事件一个执行的机会
    setTimeout(() => {
      if (activeInputKey === key) {
        setActiveInputKey(null);
        setShowButtonMap(prev => ({
          ...prev,
          [key]: false
        }));
      }
    }, 200);
  };

  const handleScaleButtonClick = async (record: TableOrderItem, clear: boolean = false) => {
    const key = record.id;
    
    if (clear) {
      setCountValues(prev => ({
        ...prev,
        [key]: undefined
      }));
      onEdit({
        id: record.id,
        objectDetailId: record.objectDetailId,
        count: undefined,
        // price: record.price,
        // remark: record.remark,
        // deliveryName: record.deliveryName,
        // unitName: record.unit
      });
      return;
    }

    // 使用传入的 weight 值更新输入框
    const weightValue = parseFloat(weight);
    if (!isNaN(weightValue)) {
      setCountValues(prev => ({
        ...prev,
        [key]: weightValue
      }));
      onEdit({
        id: record.id,
        objectDetailId: record.objectDetailId,
        count: weightValue,
        // price: record.price,
        // remark: record.remark,
        // deliveryName: record.deliveryName,
        // unitName: record.unit
      });
    }
  };

  const scrollToLastDeliveryItem = () => {
    if (!tableRef.current) return;
    
    const lastDeliveryItem = [...items]
      .reverse()
      .find(item => item.deliveryName);
      
    if (lastDeliveryItem) {
      const index = items.findIndex(item => item.id === lastDeliveryItem.id);
      if (index !== -1) {
        // 使用 Table 的 scrollTo 方法
        tableRef.current.scrollTo({
          index: index - 1, // 减去一行，因为 index 是从 0 开始的
          behavior: 'smooth'
        });
      }
    }
  };

  const getColumns = (): ColumnsType<TableOrderItem> => {
    const baseColumns: ColumnsType<TableOrderItem> = [
      {
        title: '货品',
        dataIndex: 'name',
        key: 'name',
        width: 150,
        onCell: (record) => ({
          style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            verticalAlign: record.isEmptyRow ? 'top' : 'middle'
          }
        }),
        render: (_, record: TableOrderItem) => {
          // 如果是已有记录，显示名称
          if (!record.isEmptyRow) {
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
                onChange={(value, option) => {
                  isSelectingOptionRef.current = true;
                  handleObjectSelect(value, option);
                }}
                onDropdownVisibleChange={(visible) => {
                  if (!visible) {
                    const inputValue = (document.activeElement as HTMLInputElement)?.value;
                    if (inputValue && 
                        !searchOptions.some(opt => opt.objectDetailName === inputValue) &&
                        !isSelectingOptionRef.current) {
                      handleObjectBlur(inputValue);
                    }
                    isSelectingOptionRef.current = false;
                  }
                }}
                options={searchOptions.map(opt => ({
                  label: opt.objectDetailName,
                  value: opt.objectDetailId
                }))}
                allowClear
                notFoundContent={
                  <div style={{ padding: '8px 0', fontSize: '12px', textAlign: 'center' }}>
                    <div style={{ marginBottom: 8 }}>未找到相关货品</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>失焦后将自动创建该货品</div>
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
        width: 200,
        onCell: () => ({
          style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            verticalAlign: 'top'
          }
        }),
        render: (_, record) => {
          const key = record.id;
          const inputValue = remarkInputValues[key] ?? record.remarkCount;

          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 3 }}
                value={inputValue}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // 找到最后一行的商品搜索框并聚焦
                    const lastRow = document.querySelector('.ant-table-row:last-child .ant-select-selector');
                    if (lastRow) {
                      (lastRow as HTMLElement).click();
                    }
                  }
                }}
                onFocus={() => {
                  // 延迟添加加号，避免影响光标位置
                  setTimeout(() => {
                    if (record.remarkCount && !record.remarkCount.endsWith('+')) {
                      setRemarkInputValues(prev => ({
                        ...prev,
                        [key]: record.remarkCount + '+'
                      }));
                    }
                  }, 50);
                }}
                onChange={(e) => {
                  // 先按加号分割
                  const parts = e.target.value.split('+');
                  // 对每个部分单独处理
                  const processedParts = parts.map(part => {
                    // 只允许数字和一个小数点
                    const cleanPart = part.replace(/[^0-9.]/g, '');
                    const dotParts = cleanPart.split('.');
                    return dotParts.length > 2 
                      ? `${dotParts[0]}.${dotParts.slice(1).join('')}`
                      : cleanPart;
                  });
                  // 重新组合，确保加号之间没有多余空格
                  const finalValue = processedParts.join('+').replace(/\++/g, '+');
                  setRemarkInputValues(prev => ({
                    ...prev,
                    [key]: finalValue
                  }));
                }}
                onBlur={() => {
                  console.log("!", remarkInputValues[key]);
                  const value = remarkInputValues[key];
                  // 如果值发生变化（包括清空），则更新
                  if (value !== record.remarkCount) {
                    handleRemarkCountChange(record, value);
                  }
                  // 在更新完成后清除本地状态
                  setTimeout(() => {
                    setRemarkInputValues(prev => {
                      const updated = { ...prev };
                      delete updated[key];
                      return updated;
                    });
                  }, 0);
                }}
              />
              {record.planCount !== undefined && record.remarkCount && (
                <span style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  总计: {record.planCount}
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: '实际数量',
        dataIndex: 'count',
        key: 'count',
        width: 80,
        onCell: () => ({
          style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            verticalAlign: 'top'
          }
        }),
        render: (_, record) => {
          const key = record.id;
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
                  handleInputFocus(key);
                  e.target.select();
                }}
                onBlur={() => handleInputBlur(key, record)}
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
        width: 90,
        onCell: () => ({
          style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            verticalAlign: 'top'
          }
        }),
        render: (_, record) => (
          type === 'bulk' ? (
            // 大货固定为箱
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Select
                value="箱"
                disabled
                style={{ width: '100%' }}
                options={[{ label: '箱', value: '箱' }]}
              />
              {record.jinPerBox && record.jinPerBox > 0 && (
                <span style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {record.jinPerBox}斤/箱
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Select
                value={record.unit}
                onChange={(value) => {
                  if (value !== record.unit) {
                    onEdit({
                      id: record.id,
                      objectDetailId: record.objectDetailId,
                      // count: record.count,
                      // price: record.price,
                      // remark: record.remark,
                      // deliveryName: record.deliveryName,
                      unitName: value
                    });
                  }
                }}
                options={UNIT_OPTIONS}
                style={{ width: '100%' }}
              >
                <Select.Option value="斤">斤</Select.Option>
                <Select.Option value="箱">箱</Select.Option>
              </Select>
              {record.unit === '箱' && (
                <span style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                  {record.jinPerBox || 0}斤/箱、
                  {record.amountPerBox || 0}个/箱
                </span>
              )}
            </div>
          )
        ),
      },
      {
        title: '配货员',
        dataIndex: 'deliveryName',
        key: 'deliveryName',
        width: 120,
        onCell: () => ({
          style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            verticalAlign: 'top'
          }
        }),
        render: (_, record) => {
          const key = record.id;
          const currentValue = deliveryValues[key] ?? record.deliveryName;

          const handleDeliveryChange = (value: string | undefined) => {
            // 如果当前已有配货员，且选择了新的配货员，则显示确认提示
            if (record.deliveryName && value && value !== record.deliveryName) {
              Modal.confirm({
                title: '确认修改',
                content: `${record.name}已配货，是否需要继续修改？`,
                okText: '确认',
                cancelText: '取消',
                onOk: () => {
                  // 更新本地状态
                  setDeliveryValues(prev => ({
                    ...prev,
                    [key]: value || ''
                  }));
                  // 调用 onEdit
                  onEdit({
                    id: record.id,
                    objectDetailId: record.objectDetailId,
                    // count: record.count,
                    // price: record.price,
                    // remark: record.remark,
                    deliveryName: value,
                    // unitName: record.unit
                  });
                }
              });
            } else {
              // 更新本地状态
              setDeliveryValues(prev => ({
                ...prev,
                [key]: value || ''
              }));
              // 直接调用 onEdit
              onEdit({
                id: record.id,
                objectDetailId: record.objectDetailId,
                // count: record.count,
                // price: record.price,
                // remark: record.remark,
                deliveryName: value,
                // unitName: record.unit
              });
            }
          };

          return (
            <div>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="选择配货员"
                value={currentValue}
                options={deliveryUsers}
                onChange={handleDeliveryChange}
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
              {record.deliverUpdateTime && (
                <div style={{ 
                  fontSize: '10px', 
                  color: '#999',
                  marginTop: '2px'
                }}>
                  {dayjs(record.deliverUpdateTime).format('YYYY-MM-DD HH:mm:ss')}
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 100,
        onCell: () => ({
          style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            verticalAlign: 'top'
          }
        }),
        render: (_, record) => {
          const key = record.id;
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
                    id: record.id,
                    objectDetailId: record.objectDetailId,
                    // count: record.count,
                    // price: record.price,
                    remark: newValue,
                    // unitName: record.unit
                  });
                }
              }}
            />
          );
        }
      }
    ];

    // 管理员可见的列
    if (isAdmin) {
      baseColumns.push(
        {
          title: '单价',
          dataIndex: 'price',
          key: 'price',
          width: 100,
          onCell: () => ({
            style: {
              paddingTop: '8px',
              paddingBottom: '8px',
              verticalAlign: 'top'
            }
          }),
          render: (_, record) => {
            const key = record.id;
            const currentValue = priceValues[key] ?? record.price;

            return (
              <div style={{ display: 'flex', flexDirection: 'column'}}>
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
                        id: record.id,
                        objectDetailId: record.objectDetailId,
                        // count: record.count,
                        price: newValue,
                        // remark: record.remark,
                        // deliveryName: record.deliveryName,
                        // unitName: record.unit
                      });
                    }
                  }}
                />
                {!record.isEmptyRow && (
                  <span style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    当日价: <span style={{ color: '#0099CC' }}>{record.unitPrice ? '¥':''}{record.unitPrice}</span>
                  </span>
                )}
              </div>
            );
          },
        },
        {
          title: '金额',
          dataIndex: 'totalPrice',
          key: 'totalPrice',
          width: 100,
          onCell: () => ({
            style: {
              paddingTop: '8px',
              paddingBottom: '8px',
              verticalAlign: 'top'
            }
          }),
          render: (_, record: any) => {
            const key = record.id;
            const currentValue = totalPriceValues[key] ?? record.totalPrice;

            return (
              <InputNumber
                value={currentValue}
                min={0}
                precision={2}
                style={{ width: '100%' }}
                onChange={(value) => {
                  setTotalPriceValues(prev => ({
                    ...prev,
                    [key]: value || 0
                  }));
                }}
                onBlur={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setTotalPriceValues(prev => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                  });
                  if (newValue !== record.totalPrice) {
                    onEdit({
                      id: record.id,
                      objectDetailId: record.objectDetailId,
                      // count: record.count,
                      // price: record.price,
                      totalPrice: newValue,
                      // remark: record.remark,
                      // deliveryName: record.deliveryName,
                      // unitName: record.unit
                    });
                  }
                }}
              />
            );
          },
        }
      );
    }

    // 操作列
    baseColumns.push({
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      onCell: () => ({
        style: {
          paddingTop: '8px',
          paddingBottom: '8px',
          verticalAlign: 'middle',
          padding: 0
        }
      }),
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
      }
    });

    return baseColumns;
  };

  useImperativeHandle(ref, () => ({
    scrollToLastDeliveryItem
  }));

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Table
        ref={tableRef}
        columns={getColumns()}
        dataSource={[
          ...items.map(item => ({ ...item, rowId: item.id })),
          { ...emptyRow, rowId: emptyRow.rowId }
        ]}
        rowKey="rowId"
        pagination={false}
        scroll={{ y: '100%' }}
        style={{ height: '100%' }}
        sticky
        size="small"
      />
      <CreateObjectModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          setSearchOptions([]);
        }}
      />
    </div>
  );
}); 