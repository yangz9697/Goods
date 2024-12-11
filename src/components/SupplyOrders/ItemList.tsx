import React from 'react';
import { Table, AutoComplete, InputNumber, Select, Input, Button } from 'antd';
import type { OrderItem } from '../../types/order';

interface ItemListProps {
  items: OrderItem[];
  defaultUnit: 'box' | 'jin' | 'piece';
  scaleWeight: number;
  onItemChange: (id: string, updates: Partial<OrderItem>) => void;
  onItemDelete: (id: string) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  defaultUnit,
  scaleWeight,
  onItemChange,
  onItemDelete
}) => {
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: OrderItem) => (
        <AutoComplete
          value={record.name}
          placeholder="搜索商品"
          onChange={(value) => onItemChange(record.id, { name: value })}
          // TODO: 实现商品搜索功能
        />
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_: any, record: OrderItem) => (
        <InputNumber
          value={record.quantity}
          placeholder="库存: 0"
          onChange={(value) => onItemChange(record.id, { quantity: value || 0 })}
          onClick={() => {
            if (scaleWeight > 0) {
              onItemChange(record.id, { quantity: scaleWeight });
            }
          }}
        />
      )
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: (_: any, record: OrderItem) => (
        <Select
          defaultValue={defaultUnit}
          value={record.unit}
          onChange={(value) => onItemChange(record.id, { unit: value })}
        >
          <Select.Option value="box">箱</Select.Option>
          <Select.Option value="jin">斤</Select.Option>
          <Select.Option value="piece">个</Select.Option>
        </Select>
      )
    },
    {
      title: '配送员',
      dataIndex: 'deliveryPerson',
      key: 'deliveryPerson',
      render: (_: any, record: OrderItem) => (
        <Select
          value={record.deliveryPerson}
          onChange={(value) => onItemChange(record.id, { deliveryPerson: value })}
        >
          {/* TODO: 根据权限显示配送员列表 */}
        </Select>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (_: any, record: OrderItem) => (
        <Input.TextArea
          value={record.remark}
          onChange={(e) => onItemChange(record.id, { remark: e.target.value })}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: OrderItem) => (
        <Button
          type="link"
          danger
          onClick={() => onItemDelete(record.id)}
        >
          删除
        </Button>
      )
    }
  ];

  return (
    <Table<OrderItem>
      columns={columns}
      dataSource={items}
      rowKey="id"
      pagination={false}
    />
  );
}; 