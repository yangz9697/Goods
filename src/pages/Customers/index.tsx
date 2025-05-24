import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { addUser, pageUser, updateUser, deleteUser } from '../../api/customer';
import dayjs from 'dayjs';

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
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [form] = Form.useForm();

  // 获取客户列表
  const fetchCustomerList = async (page: number, size: number, name: string = '', mobile: string = '') => {
    setLoading(true);
    try {
      const response = await pageUser({
        currentPage: page,
        pageSize: size,
        filters: {
          name,
          mobile
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
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomerList(1, pageSize, searchName, searchPhone);
  };

  // 在组件加载时获取数据
  useEffect(() => {
    fetchCustomerList(currentPage, pageSize, searchName, searchPhone);
  }, [currentPage, pageSize]);

  // 处理添加/编辑
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (modalType === 'add') {
        const response = await addUser({
          name: values.name,
          mobile: values.phone,
          remark: values.remark || ''
        });

        if (response.success) {
          message.success('添加成功');
          fetchCustomerList(currentPage, pageSize, searchName, searchPhone);
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
          remark: values.remark || ''
        });

        if (response.success) {
          message.success('编辑成功');
          fetchCustomerList(currentPage, pageSize, searchName, searchPhone);
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
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteUser(record.userId);
          
          if (response.success) {
            message.success('删除成功');
            fetchCustomerList(currentPage, pageSize, searchName, searchPhone);
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
      onCell: () => ({ style: { padding: 0 } }),
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
                remark: record.remark
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
          <Input
            placeholder="请输入客户姓名"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Input
            placeholder="请输入手机号"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
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
        okText="确定"
        cancelText="取消"
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
              { required: true, message: '请输入手机号' }
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