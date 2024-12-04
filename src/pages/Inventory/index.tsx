import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, InputNumber, message, Descriptions } from 'antd';
import type { InventoryItem, InventoryLog, UnitType } from '../../types/inventory';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

// 模拟数据
const mockInventoryData: InventoryItem[] = [
  {
    id: '1',
    name: '大白菜',
    boxQuantity: 10,
    jinQuantity: 200,
    pieceQuantity: 0,
    jinPerBox: 20,
    piecePerBox: 0,
    updateTime: '2024-03-14 10:00:00',
    operator: '张三'
  },
  {
    id: '2',
    name: '土豆',
    boxQuantity: 5,
    jinQuantity: 150,
    pieceQuantity: 0,
    jinPerBox: 30,
    piecePerBox: 0,
    updateTime: '2024-03-14 11:00:00',
    operator: '李四'
  }
];

const mockLogs: InventoryLog[] = [];

const Inventory: React.FC = () => {
  // 状态管理
  const [searchText, setSearchText] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'reduce'>('add');
  const [adjustUnit, setAdjustUnit] = useState<UnitType>('box');
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    // 加载模拟数据
    setInventoryData(mockInventoryData);
  }, []);

  // 搜索功能
  const filteredData = inventoryData.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 添加新商品
  const handleAdd = async (values: any) => {
    try {
      // 检查名称是否重复
      if (inventoryData.some(item => item.name === values.name)) {
        message.error(`${values.name}菜品已存在`);
        return;
      }

      // 计算各单位数量
      let boxQuantity = 0;
      let jinQuantity = 0;
      let pieceQuantity = 0;

      switch (values.unit) {
        case 'box':
          boxQuantity = values.quantity;
          jinQuantity = values.quantity * values.jinPerBox;
          pieceQuantity = values.quantity * values.piecePerBox;
          break;
        case 'jin':
          jinQuantity = values.quantity;
          boxQuantity = Math.floor(values.quantity / values.jinPerBox);
          pieceQuantity = boxQuantity * values.piecePerBox;
          break;
        case 'piece':
          pieceQuantity = values.quantity;
          boxQuantity = Math.floor(values.quantity / values.piecePerBox);
          jinQuantity = boxQuantity * values.jinPerBox;
          break;
      }

      const newItem: InventoryItem = {
        id: String(Date.now()),
        name: values.name,
        boxQuantity,
        jinQuantity,
        pieceQuantity,
        jinPerBox: values.jinPerBox,
        piecePerBox: values.piecePerBox,
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator: '当前用户'
      };

      // 添加操作日志
      mockLogs.push({
        id: String(Date.now()),
        itemId: newItem.id,
        itemName: newItem.name,
        operationType: 'new_item',
        quantity: values.quantity,
        unit: values.unit,
        boxQuantity: newItem.boxQuantity,
        jinQuantity: newItem.jinQuantity,
        pieceQuantity: newItem.pieceQuantity,
        jinPerBox: newItem.jinPerBox,
        piecePerBox: newItem.piecePerBox,
        remark: '新增商品',
        operateTime: newItem.updateTime,
        operator: newItem.operator
      });

      setInventoryData([...inventoryData, newItem]);
      message.success('添加成功');
      setAddModalVisible(false);
      form.resetFields();

      // 提示添加价格
      Modal.confirm({
        title: '提示',
        content: '商品添加成功，是否立即添加价格？',
        onOk: () => {
          // TODO: 跳转到价格管理页面
        }
      });
    } catch (error) {
      message.error('添加失败');
    }
  };

  // 调整库存
  const handleAdjustInventory = async (values: any) => {
    try {
      if (!currentItem) return;

      const updatedItem = { ...currentItem };
      const quantity = values.quantity * (adjustType === 'reduce' ? -1 : 1);

      // 检查是否会导致负库存
      let newBoxQuantity = updatedItem.boxQuantity;
      let newJinQuantity = updatedItem.jinQuantity;
      let newPieceQuantity = updatedItem.pieceQuantity;

      switch (adjustUnit) {
        case 'box':
          newBoxQuantity += quantity;
          newJinQuantity += quantity * updatedItem.jinPerBox;
          if (updatedItem.piecePerBox) {
            newPieceQuantity += quantity * updatedItem.piecePerBox;
          }
          break;
        case 'jin':
          newJinQuantity += quantity;
          newBoxQuantity = Math.floor(newJinQuantity / updatedItem.jinPerBox);
          if (updatedItem.piecePerBox) {
            newPieceQuantity = newBoxQuantity * updatedItem.piecePerBox;
          }
          break;
        case 'piece':
          newPieceQuantity += quantity;
          newBoxQuantity = Math.floor(newPieceQuantity / updatedItem.piecePerBox);
          newJinQuantity = newBoxQuantity * updatedItem.jinPerBox;
          break;
      }

      // 检查负库存
      if (newBoxQuantity < 0 || newJinQuantity < 0 || newPieceQuantity < 0) {
        message.error('库存不足，无法减少');
        return;
      }

      updatedItem.boxQuantity = newBoxQuantity;
      updatedItem.jinQuantity = newJinQuantity;
      updatedItem.pieceQuantity = newPieceQuantity;
      updatedItem.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
      updatedItem.operator = '当前用户';

      // 添加操作日志
      mockLogs.push({
        id: String(Date.now()),
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        operationType: adjustType === 'add' ? 'add_inventory' : 'reduce_inventory',
        quantity: values.quantity,
        unit: adjustUnit,
        boxQuantity: updatedItem.boxQuantity,
        jinQuantity: updatedItem.jinQuantity,
        pieceQuantity: updatedItem.pieceQuantity,
        jinPerBox: updatedItem.jinPerBox,
        piecePerBox: updatedItem.piecePerBox,
        remark: values.remark,
        operateTime: updatedItem.updateTime,
        operator: updatedItem.operator
      });

      setInventoryData(inventoryData.map(item => 
        item.id === currentItem.id ? updatedItem : item
      ));

      message.success('库存调整成功');
      setAdjustModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('库存调整失败');
    }
  };

  // 编辑商品
  const handleEdit = async (values: any) => {
    try {
      if (!currentItem) return;

      // 检查名称是否与其他商品重复
      if (values.name !== currentItem.name && 
          inventoryData.some(item => item.name === values.name)) {
        message.error(`${values.name}菜品已存在`);
        return;
      }

      // 重新计算库存数量
      const boxQuantity = currentItem.boxQuantity;
      const jinQuantity = boxQuantity * values.jinPerBox;
      const pieceQuantity = boxQuantity * values.piecePerBox;

      const updatedItem = {
        ...currentItem,
        name: values.name,
        jinPerBox: values.jinPerBox,
        piecePerBox: values.piecePerBox,
        jinQuantity,
        pieceQuantity,
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator: '当前用户'
      };

      // 添加操作日志
      mockLogs.push({
        id: String(Date.now()),
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        operationType: 'edit_item',
        quantity: 0,
        unit: 'box',
        boxQuantity: updatedItem.boxQuantity,
        jinQuantity: updatedItem.jinQuantity,
        pieceQuantity: updatedItem.pieceQuantity,
        jinPerBox: updatedItem.jinPerBox,
        piecePerBox: updatedItem.piecePerBox,
        remark: values.remark || '编辑商品信息',
        operateTime: updatedItem.updateTime,
        operator: updatedItem.operator
      });

      setInventoryData(inventoryData.map(item => 
        item.id === currentItem.id ? updatedItem : item
      ));

      message.success('编辑成功');
      setEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('编辑失败');
    }
  };

  // 删除商品
  const handleDelete = (item: InventoryItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除${item.name}吗？删除后该商品将无法在其他页面被选择。`,
      onOk: async () => {
        try {
          // 添加操作日志
          mockLogs.push({
            id: String(Date.now()),
            itemId: item.id,
            itemName: item.name,
            operationType: 'delete_item',
            quantity: 0,
            unit: 'box',
            boxQuantity: item.boxQuantity,
            jinQuantity: item.jinQuantity,
            pieceQuantity: item.pieceQuantity,
            jinPerBox: item.jinPerBox,
            piecePerBox: item.piecePerBox,
            remark: '删除商品',
            operateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            operator: '当前用户' // TODO: 替换为实际登录用户
          });

          setInventoryData(inventoryData.filter(i => i.id !== item.id));
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '数量(箱)',
      dataIndex: 'boxQuantity',
      key: 'boxQuantity',
      render: (text: number, record: InventoryItem) => (
        <Space>
          {text}
          <Button.Group size="small">
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('add');
              setAdjustUnit('box');
              setAdjustModalVisible(true);
            }}>+</Button>
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('reduce');
              setAdjustUnit('box');
              setAdjustModalVisible(true);
            }}>-</Button>
          </Button.Group>
        </Space>
      ),
    },
    {
      title: '数量(斤)',
      dataIndex: 'jinQuantity',
      key: 'jinQuantity',
      render: (text: number, record: InventoryItem) => (
        <Space>
          {text}
          <Button.Group size="small">
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('add');
              setAdjustUnit('jin');
              setAdjustModalVisible(true);
            }}>+</Button>
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('reduce');
              setAdjustUnit('jin');
              setAdjustModalVisible(true);
            }}>-</Button>
          </Button.Group>
        </Space>
      ),
    },
    {
      title: '数量(个)',
      dataIndex: 'pieceQuantity',
      key: 'pieceQuantity',
      render: (text: number, record: InventoryItem) => (
        <Space>
          {text}
          <Button.Group size="small">
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('add');
              setAdjustUnit('piece');
              setAdjustModalVisible(true);
            }}>+</Button>
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('reduce');
              setAdjustUnit('piece');
              setAdjustModalVisible(true);
            }}>-</Button>
          </Button.Group>
        </Space>
      ),
    },
    {
      title: '单位(斤/箱)',
      dataIndex: 'jinPerBox',
      key: 'jinPerBox',
    },
    {
      title: '单位(个/箱)',
      dataIndex: 'piecePerBox',
      key: 'piecePerBox',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InventoryItem) => (
        <Space>
          <Button type="link" onClick={() => {
            setCurrentItem(record);
            setDetailModalVisible(true);
          }}>详情</Button>
          <Button type="link" onClick={() => {
            setCurrentItem(record);
            form.setFieldsValue(record);
            setEditModalVisible(true);
          }}>编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Search
            placeholder="请输入商品名称"
            onSearch={value => setSearchText(value)}
            style={{ width: 200 }}
          />
          <Button type="primary" onClick={() => setAddModalVisible(true)}>
            添加
          </Button>
        </Space>
        <Table 
          columns={columns} 
          dataSource={filteredData}
          rowKey="id"
        />
      </Space>

      {/* 添加商品弹窗 */}
      <Modal
        title="添加菜品库存"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAdd}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="jinPerBox"
            label="单位(斤/箱)"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="piecePerBox"
            label="单位(个/箱)"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请选择单位' }]}
          >
            <Select>
              <Option value="box">箱</Option>
              <Option value="jin">斤</Option>
              <Option value="piece">个</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => setAddModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 调整库存弹窗 */}
      <Modal
        title={`${adjustType === 'add' ? '添加' : '减少'}库存`}
        visible={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAdjustInventory}>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注原因"
            rules={[{ required: true, message: '请输入备注原因' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => setAdjustModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="库存详情"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
      >
        {currentItem && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="名称">{currentItem.name}</Descriptions.Item>
            <Descriptions.Item label="数量(箱)">{currentItem.boxQuantity}</Descriptions.Item>
            <Descriptions.Item label="数量(斤)">{currentItem.jinQuantity}</Descriptions.Item>
            <Descriptions.Item label="数量(个)">{currentItem.pieceQuantity}</Descriptions.Item>
            <Descriptions.Item label="单位(斤/箱)">{currentItem.jinPerBox}</Descriptions.Item>
            <Descriptions.Item label="单位(个/箱)">{currentItem.piecePerBox}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{currentItem.updateTime}</Descriptions.Item>
            <Descriptions.Item label="操作人">{currentItem.operator}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑菜品库存"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleEdit}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="jinPerBox"
            label="单位(斤/箱)"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="piecePerBox"
            label="单位(个/箱)"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory; 