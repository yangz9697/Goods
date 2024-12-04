import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

export interface CustomerType {
  id: string;
  name: string;
  phone: string;
  remark?: string;
  preference?: string;
  updateTime: string;
}

export const mockCustomers: CustomerType[] = [
  {
    id: '1',
    name: '张三',
    phone: '13800138000',
    remark: '重要客户',
    preference: '喜欢新鲜蔬菜',
    updateTime: '2024-03-14 10:00:00'
  }
];

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [currentCustomer, setCurrentCustomer] = useState<CustomerType | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // 加载模拟数据
    setCustomers(mockCustomers);
  }, []);

  // 处理添加/编辑
  const handleSubmit = async (values: any) => {
    try {
      if (modalType === 'add') {
        // 添加新客户
        const newCustomer: CustomerType = {
          id: String(Date.now()),
          ...values,
          updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
        setCustomers([...customers, newCustomer]);
        message.success('添加成功');
      } else {
        // 编辑客户
        if (!currentCustomer) return;
        const updatedCustomer = {
          ...currentCustomer,
          ...values,
          updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
        setCustomers(customers.map(item => 
          item.id === currentCustomer.id ? updatedCustomer : item
        ));
        message.success('编辑成功');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(modalType === 'add' ? '添加失败' : '编辑失败');
    }
  };

  // 处理删除
  const handleDelete = (record: CustomerType) => {
    // TODO: 检查客户是否被其他地方引用
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除客户"${record.name}"吗？删除后无法恢复。`,
      onOk: async () => {
        try {
          // TODO: 检查客户是否被引用
          setCustomers(customers.filter(item => item.id !== record.id));
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '偏好',
      dataIndex: 'preference',
      key: 'preference',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CustomerType) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              setModalType('edit');
              setCurrentCustomer(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button 
          type="primary" 
          onClick={() => {
            setModalType('add');
            setCurrentCustomer(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          添加
        </Button>
        <Table 
          columns={columns} 
          dataSource={customers}
          rowKey="id"
        />
      </Space>

      {/* 添加/编辑客户弹窗 */}
      <Modal
        title={modalType === 'add' ? '添加用户' : '编辑用户'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form 
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="preference"
            label="偏好"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers; 