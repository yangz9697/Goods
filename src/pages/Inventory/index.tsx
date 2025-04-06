import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, InputNumber, message, Tooltip } from 'antd';
import type { InventoryItem, UnitType } from '../../types/inventory';
import type { ObjectOpLog } from '../../types/objectDetail';
import dayjs from 'dayjs';
import { addObject, pageObjectDetail, deleteObject, updateObjectInventory, queryObjectOpLog, updateObjectUnitAndPrice, UpdateObjectUnitAndPriceRequest } from '../../api/objectDetail';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

const Inventory: React.FC = () => {
  const navigate = useNavigate();

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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [opLogs, setOpLogs] = useState<ObjectOpLog[]>([]);
  const [editValues, setEditValues] = useState({
    jinPerBox: 0,
    piecePerBox: 0
  });

  // 搜索功能
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1); // 重置页码到第一页
    fetchObjectList(1, pageSize, value); // 传入搜索关键字
  };

  // 获取商品列表
  const fetchObjectList = async (page: number, size: number, searchKey: string = '') => {
    setLoading(true);
    try {
      const response = await pageObjectDetail({
        currentPage: page,
        pageSize: size,
        filters: {
          objectDetailName: searchKey
        }
      });

      if (response.data) {
        const items: InventoryItem[] = response.data.items.map(item => ({
          id: String(item.objectDetailId),
          name: item.objectDetailName,
          boxQuantity: item.box,
          jinQuantity: item.jin,
          pieceQuantity: item.amount,
          jinPerBox: item.jinForBox,
          piecePerBox: item.amountForBox,
          updateTime: dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss'),
          operator: item.updater
        }));

        setInventoryData(items);
        setTotal(response.data.total);
      } else {
        message.error('获取商品列表失败');
      }
    } catch (error) {
      message.error('获取商品列表失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 在组件加载时获取数据
  useEffect(() => {
    fetchObjectList(currentPage, pageSize, searchText);
  }, [currentPage, pageSize]);

  // 添加新商品
  const handleAdd = async (values: any) => {
    setLoading(true);
    try {
      const { amountForBox, jinForBox, name, unit, quantity } = values;
      
      // 根据选择的单位和数量,计算其他单位的数量
      let amount = 0, jin = 0, box = 0;
      
      switch (unit) {
        case 'piece':
          amount = quantity;
          box = quantity / amountForBox;
          jin = box * jinForBox;
          break;
        case 'jin':
          jin = quantity;
          box = quantity / jinForBox;
          amount = box * amountForBox;
          break;
        case 'box':
          box = quantity;
          jin = quantity * jinForBox;
          amount = quantity * amountForBox;
          break;
      }

      const requestData = {
        amountForBox,
        jinForBox,
        objectDetailName: name,
        tenant: 'default',
        amount: Math.round(amount * 100) / 100,
        jin: Math.round(jin * 100) / 100,
        box: Math.round(box * 100) / 100
      };

      const response = await addObject(requestData);

      if (response.success) {
        message.success('添加商品成功');
        setAddModalVisible(false);
        form.resetFields();
        fetchObjectList(currentPage, pageSize);
        
        Modal.confirm({
          title: '提醒',
          content: '商品添加成功，请及时设置商品价格',
          okText: '去设置',
          cancelText: '稍后设置',
          onOk() {
            navigate('/pricing');
          }
        });
      } else {
        message.error(response.displayMsg || '添加失败');
      }
    } catch (error) {
      message.error('添加商品失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 调整库存
  const handleAdjustInventory = async (values: any) => {
    try {
      if (!currentItem) return;

      const quantity = values.quantity * (adjustType === 'reduce' ? -1 : 1);
      
      // 准备请求数据
      const requestData: any = {
        detailObjectId: Number(currentItem.id),
        remark: values.remark || ''  // 确保即使没有备注也传空字符串
      };

      // 根据调整单位设置对应的数量
      switch (adjustUnit) {
        case 'box':
          requestData.box = quantity;
          break;
        case 'jin':
          requestData.jin = quantity;
          break;
        case 'piece':
          requestData.amount = quantity;
          break;
      }
      
      setLoading(true);  // 添加loading状态
      const response = await updateObjectInventory(requestData);

      if (response.success) {
        message.success('库存调整成功');
        setAdjustModalVisible(false);
        form.resetFields();
        fetchObjectList(currentPage, pageSize, searchText);  // 刷新列表
      } else {
        message.error(response.displayMsg || '库存调整失败');
      }
    } catch (error) {
      message.error('库存调整失败：' + (error as Error).message);
    } finally {
      setLoading(false);  // 清除loading状态
    }
  };

  // 编辑商品
  const handleEdit = async () => {
    try {
      if (!currentItem) return;

      const requestData: UpdateObjectUnitAndPriceRequest = {
        objectDetailId: Number(currentItem.id),
        amount: editValues.piecePerBox,
        jin: editValues.jinPerBox
      };

      const response = await updateObjectUnitAndPrice(requestData);

      if (response.data) {
        message.success('编辑成功');
        setEditModalVisible(false);
        fetchObjectList(currentPage, pageSize, searchText);
      } else {
        message.error(response.displayMsg || '编辑失败');
      }
    } catch (error) {
      message.error('编辑失败：' + (error as Error).message);
    }
  };

  // 删除商品
  const handleDelete = (item: InventoryItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除${item.name}吗？删除后该商品将无法在其他页面选择。`,
      onOk: async () => {
        try {
          const response = await deleteObject(Number(item.id));
          
          if (response.success) {
            message.success('删除成功');
            fetchObjectList(currentPage, pageSize, searchText);
          } else {
            message.error(response.displayMsg || '删除失败');
          }
        } catch (error) {
          message.error('删除失败：' + (error as Error).message);
        }
      },
      okText: '确定',
      cancelText: '取消'
    });
  };

  // 获取操作记录
  const fetchOpLogs = async (id: number) => {
    try {
      const response = await queryObjectOpLog(id);
      if (response.success) {
        setOpLogs(response.data);
      } else {
        message.error(response.displayMsg || '获取操作记录失败');
      }
    } catch (error) {
      message.error('获取操作记录失败：' + (error as Error).message);
    }
  };

  // 修改打开详情弹窗的理函数
  const handleShowDetail = (record: InventoryItem) => {
    setCurrentItem(record);
    setDetailModalVisible(true);
    fetchOpLogs(Number(record.id));
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      // width: 120,  // 设置固定宽度
      // ellipsis: {  // 配置省略
      //   showTitle: false,  // 禁用默认的 title 提示
      // },
      render: (name: string) => (
        <div style={{ minWidth: '60px' }}>
          <Tooltip placement="topLeft" title={name}>
            <span>{name}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '数量(箱)',
      dataIndex: 'boxQuantity',
      key: 'boxQuantity',
      render: (text: number, record: InventoryItem) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{text}</span>
          <Button.Group size="small">
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('add');
              setAdjustUnit('box');
              form.resetFields();
              setAdjustModalVisible(true);
            }}>+</Button>
            <Button onClick={() => {
              setCurrentItem(record);
              setAdjustType('reduce');
              setAdjustUnit('box');
              setAdjustModalVisible(true);
            }}>-</Button>
          </Button.Group>
        </div>
      ),
    },
    {
      title: '数量(斤)',
      dataIndex: 'jinQuantity',
      key: 'jinQuantity',
      render: (text: number, record: InventoryItem) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>{text}</span>
            <span style={{ color: '#666', fontSize: '12px' }}>
              ({record.jinPerBox} 斤/箱)
            </span>
          </Space>
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
        </div>
      ),
    },
    {
      title: '数量(个)',
      dataIndex: 'pieceQuantity',
      key: 'pieceQuantity',
      render: (text: number, record: InventoryItem) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>{text}</span>
            <span style={{ color: '#666', fontSize: '12px' }}>
              ({record.piecePerBox} 个/箱)
            </span>
          </Space>
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
        </div>
      ),
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
        <div style={{ padding: 0 }}>
          <Space>
            <Button type="link" onClick={() => handleShowDetail(record)}>详情</Button>
            <Button type="link" onClick={() => {
              setCurrentItem(record);
              setEditValues({ jinPerBox: record.jinPerBox, piecePerBox: record.piecePerBox });
              setEditModalVisible(true);
            }}>编辑</Button>
            <Button type="link" danger onClick={() => handleDelete(record)}>
              删除
            </Button>
          </Space>
        </div>
      ),
      onCell: () => ({ style: { padding: 0 } })
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Search
            placeholder="请输入商品名称"
            onSearch={handleSearch}
            style={{ width: 200 }}
          />
          <Button type="primary" onClick={() => setAddModalVisible(true)}>
            添加商品
          </Button>
        </Space>
        <Table 
          columns={columns} 
          dataSource={inventoryData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            showQuickJumper: true,
            locale: {
              items_per_page: '条/页',
              jump_to: '跳至',
              jump_to_confirm: '确定',
              page: '页'
            }
          }}
        />

        {/* 添加商品弹窗 */}
        <Modal
          title="添加商品"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            onFinish={handleAdd}
            layout="vertical"
            preserve={false}
          >
            <Form.Item
              name="name"
              label="商品名称"
              rules={[{ required: true, message: '请输入商品名称' }]}
            >
              <Input placeholder="请输入商品名称" />
            </Form.Item>

            <Form.Item
              name="jinForBox"
              label="每箱斤数"
              rules={[{ required: true, message: '请输入每箱斤数' }]}
            >
              <InputNumber 
                min={0} 
                precision={1}
                step={0.1}
                style={{ width: '100%' }} 
                placeholder="请输入每箱斤数"
              />
            </Form.Item>

            <Form.Item
              name="amountForBox"
              label="每箱个数"
              rules={[{ required: true, message: '请输入每箱个数' }]}
            >
              <InputNumber 
                min={0} 
                precision={1}
                step={0.1}
                style={{ width: '100%' }} 
                placeholder="请输入每箱个数"
              />
            </Form.Item>

            <Form.Item label="初始库存">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="quantity"
                  noStyle
                  rules={[{ required: true, message: '请输入初始库存数量' }]}
                >
                  <InputNumber 
                    min={0} 
                    precision={1}
                    step={0.1}
                    style={{ width: '100%' }} 
                    placeholder="请输入初始库存数量"
                  />
                </Form.Item>
                <Form.Item
                  name="unit"
                  noStyle
                  initialValue="piece"
                  rules={[{ required: true, message: '请选择库存单位' }]}
                >
                  <Select style={{ width: 120 }}>
                    <Option value="piece">个</Option>
                    <Option value="jin">斤</Option>
                    <Option value="box">箱</Option>
                  </Select>
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setAddModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认添加
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 调整库存弹窗 */}
        <Modal
          title={`${adjustType === 'add' ? '添加' : '减少'}库存`}
          open={adjustModalVisible}
          onCancel={() => {
            setAdjustModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form 
            form={form} 
            onFinish={handleAdjustInventory}
            preserve={false}
          >
            <Form.Item
              name="quantity"
              label="数量"
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber 
                min={0} 
                precision={1}
                step={0.1}
              />
            </Form.Item>
            <Form.Item
              name="remark"
              label="备注原因"
            >
              <Input.TextArea placeholder="请输入备注原因（选填）" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认
                </Button>
                <Button onClick={() => {
                  setAdjustModalVisible(false);
                  form.resetFields();
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 详情弹窗 */}
        <Modal
          title="库存详情"
          open={detailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false);
            setOpLogs([]);
          }}
          width={800}
          footer={null}
        >
          {currentItem && (
            <Table
              dataSource={opLogs}
              rowKey={(record) => `${record.objectDetailId}-${record.opType}-${record.operatorTime}`}
              pagination={false}
              columns={[
                {
                  title: '操作名称',
                  dataIndex: 'opName',
                  key: 'opName',
                },
                {
                  title: '操作内容',
                  dataIndex: 'content',
                  key: 'content',
                },
                {
                  title: '备注',
                  dataIndex: 'userRemark',
                  key: 'userRemark',
                },
                {
                  title: '操作人',
                  dataIndex: 'operator',
                  key: 'operator',
                },
                {
                  title: '操作时间',
                  dataIndex: 'operatorTime',
                  key: 'operatorTime',
                  render: (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
                }
              ]}
            />
          )}
        </Modal>

        {/* 编辑弹窗 */}
        <Modal
          title="编辑菜品"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditValues({ jinPerBox: 0, piecePerBox: 0 });
          }}
          okText="确定"
          cancelText="取消"
          onOk={handleEdit}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>名称</div>
            <Input disabled value={currentItem?.name} />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>单位(斤/箱)</div>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={editValues.jinPerBox}
              onChange={(value) => setEditValues(prev => ({ ...prev, jinPerBox: value || 0 }))}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>单位(个/箱)</div>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={editValues.piecePerBox}
              onChange={(value) => setEditValues(prev => ({ ...prev, piecePerBox: value || 0 }))}
            />
          </div>
        </Modal>
      </Space>
    </div>
  );
};

export default Inventory; 