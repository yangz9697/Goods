import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { addUser, pageUser, updateUser, deleteUser } from '../../api/customer';
import dayjs from 'dayjs';

const { Search } = Input;
const { TextArea } = Input;

export interface CustomerType {
  userId: number;
  name: string;
  mobile: string;
  remark: string;
  favorite: string;
  updateTime: number;
  updater: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [currentCustomer, setCurrentCustomer] = useState<CustomerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 获取客户列表
  const fetchCustomerList = async (page: number, size: number, name: string = '') => {
    setLoading(true);
    try {
      const response = await pageUser({
        currentPage: page,
        pageSize: size,
        filters: {
          name,
          mobile: ''
        }
      });

      if (response.success) {
        const items = response.data.items.map(item => ({
          userId: item.id,
          name: item.name,
          mobile: item.mobile,
          remark: item.remark,
          favorite: item.favorite,
          updateTime: item.updateTime,
          updater: item.updater
        }));

        setCustomers(items);
        setTotal(response.data.total);
      } else {
        message.error(response.displayMsg || '获取客户列表失败');
      }
    } catch (error) {
      message.error('获取客户列表失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 搜索功能
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
    fetchCustomerList(1, pageSize, value);
  };

  // 在组件加载时获取数据
  useEffect(() => {
    fetchCustomerList(currentPage, pageSize, searchText);
  }, [currentPage, pageSize]);

  // 处理添加/编辑
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (modalType === 'add') {
        const response = await addUser({
          name: values.name,
          mobile: values.phone,
          remark: values.remark || '',
          favorite: values.preference || ''
        });

        if (response.success) {
          message.success('添加成功');
          fetchCustomerList(currentPage, pageSize, searchText);
          setModalVisible(false);
          form.resetFields();
        } else {
          message.error(response.displayMsg || '添加失败');
        }
      } else {
        // 编辑客户
        if (!currentCustomer) return;
        
        const response = await updateUser({
          id: currentCustomer.userId,
          name: values.name,
          mobile: values.phone,
          remark: values.remark || '',
          favorite: values.preference || ''
        });

        if (response.success) {
          message.success('编辑成功');
          fetchCustomerList(currentPage, pageSize, searchText);
          setModalVisible(false);
          form.resetFields();
        } else {
          message.error(response.displayMsg || '编辑失败');
        }
      }
    } catch (error) {
      message.error(modalType === 'add' ? '添加失败' : '编辑失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除客户
  const handleDelete = (record: CustomerType) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除客户"${record.name}"吗？`,
      onOk: async () => {
        try {
          const response = await deleteUser(record.userId);
          
          if (response.success) {
            message.success('删除成功');
            fetchCustomerList(currentPage, pageSize, searchText);
          } else {
            message.error(response.displayMsg || '删除失败');
          }
        } catch (error) {
          message.error('删除失败：' + (error as Error).message);
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
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '偏好',
      dataIndex: 'favorite',
      key: 'favorite',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作人',
      dataIndex: 'updater',
      key: 'updater',
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
              form.setFieldsValue({
                name: record.name,
                phone: record.mobile,
                remark: record.remark,
                preference: record.favorite
              });
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
        <Space>
          <Search
            placeholder="请输入客户姓名"
            onSearch={handleSearch}
            style={{ width: 200 }}
          />
          <Button 
            type="primary" 
            onClick={() => {
              setModalType('add');
              setCurrentCustomer(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            添加客户
          </Button>
        </Space>
        <Table 
          columns={columns} 
          dataSource={customers}
          rowKey="userId"
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
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Space>

      {/* 添加/编辑客户弹窗 */}
      <Modal
        title={modalType === 'add' ? '添加客户' : '编辑客户'}
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
              <Button type="primary" htmlType="submit" loading={loading}>
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