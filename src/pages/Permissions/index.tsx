import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Modal, Form, Input, Select } from 'antd';
import { accountApi, AccountItem } from '@/api/account';
import { authApi } from '@/api/auth';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const Permissions: React.FC = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  
  // 如果不是管理员或经理，重定向到首页
  useEffect(() => {
    if (role !== 'admin' && role !== 'manager' && role !== 'managerLeader') {
      message.error('没有访问权限');
      navigate('/');
    }
  }, [role, navigate]);

  // 如果不是管理员或经理，不渲染内容
  if (role !== 'admin' && role !== 'manager' && role !== 'managerLeader') {
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [roleList, setRoleList] = useState<{ role: string; roleName: string }[]>([]);
  const [tenantList, setTenantList] = useState<{ tenant: string; tenantName: string }[]>([]);
  const [form] = Form.useForm();
  const currentRole = localStorage.getItem('role');
  const currentTenant = localStorage.getItem('tenant');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editingUser, setEditingUser] = useState<AccountItem | null>(null);

  const fetchAccounts = async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await accountApi.pageAccount({
        currentPage: page,
        pageSize: size,
        filters: {}
      });
      if (res.success) {
        setAccounts(res.data.items);
        setTotal(res.data.total);
      } else {
        message.error(res.displayMsg || '获取账户列表失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleList = async () => {
    try {
      const res = await accountApi.getRoleList();
      if (res.success) {
        setRoleList(res.data);
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const fetchTenantList = async () => {
    try {
      const res = await authApi.getTenantList();
      if (res.success) {
        setTenantList(res.data);
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  useEffect(() => {
    fetchAccounts(currentPage, pageSize);
    fetchRoleList();
    if (currentRole === 'admin') {
      fetchTenantList();
    }
  }, [currentPage, pageSize, currentRole]);

  const handleAddAccount = async (values: any) => {
    try {
      const params = {
        ...values,
        tenant: currentRole === 'admin' ? values.tenant : currentTenant
      };
      
      const res = await accountApi.addAccount(params);
      if (res.success) {
        message.success('添加账户成功');
        setIsModalVisible(false);
        form.resetFields();
        fetchAccounts(currentPage, pageSize);
      } else {
        message.error(res.displayMsg || '添加账户失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleResetPassword = async (username: string) => {
    try {
      const response = await accountApi.resetPassword({ username });
      if (response.success) {
        message.success('重置密码成功');
      } else {
        message.error(response.displayMsg || '重置密码失败');
      }
    } catch (error) {
      message.error('重置密码失败：' + (error as Error).message);
    }
  };

  const handleEditRole = async (values: { role: string }) => {
    if (!editingUser) return;
    
    try {
      const response = await accountApi.updateRole({
        username: editingUser.username,
        role: values.role
      });
      
      if (response.success) {
        message.success('更新角色成功');
        setIsEditModalVisible(false);
        fetchAccounts(currentPage, pageSize);
      } else {
        message.error(response.displayMsg || '更新角色失败');
      }
    } catch (error) {
      message.error('更新角色失败：' + (error as Error).message);
    }
  };

  const handleDeleteUser = async (record: AccountItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户"${record.name}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await accountApi.deleteAccount(record.id);
          
          if (response.success) {
            message.success('删除用户成功');
            fetchAccounts(currentPage, pageSize);
          } else {
            message.error(response.displayMsg || '删除用户失败');
          }
        } catch (error) {
          message.error('删除用户失败：' + (error as Error).message);
        }
      }
    });
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap = {
          admin: 'red',
          manager: 'blue',
          employee: 'green',
          managerLeader: 'purple'
        };
        const roleNameMap = {
          admin: '超级管理员',
          manager: '管理员',
          employee: '普通员工',
          managerLeader: '高级管理员'
        };
        return (
          <Tag color={colorMap[role as keyof typeof colorMap]}>
            {roleNameMap[role as keyof typeof roleNameMap]}
          </Tag>
        );
      },
    },
    {
      title: '所属门店',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AccountItem) => (
        <Space size="middle">
          <Button 
            type="primary" 
            onClick={() => {
              setEditingUser(record);
              editForm.setFieldsValue({ role: record.role });
              setIsEditModalVisible(true);
            }}
          >
            编辑权限
          </Button>
          <Button onClick={() => handleResetPassword(record.username)}>
            重置密码
          </Button>
          {role === 'admin' && (
            <Button 
              type="link" 
              danger
              onClick={() => handleDeleteUser(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
      onCell: () => ({ style: { padding: 0 } })
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>权限管理</h2>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          添加用户
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={accounts}
        rowKey="username"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          }
        }}
      />

      <Modal
        title="添加用户"
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddAccount}
        >
          <Form.Item
            name="username"
            label="账户名称"
            rules={[{ required: true, message: '请输入账户名称' }]}
          >
            <Input placeholder="请输入账户名称" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roleList.map(item => (
                <Option key={item.role} value={item.role}>
                  {item.roleName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {currentRole === 'admin' && (
            <Form.Item
              name="tenant"
              label="所属门店"
              rules={[{ required: true, message: '请选择所属门店' }]}
            >
              <Select placeholder="请选择所属门店">
                {tenantList.map(item => (
                  <Option key={item.tenant} value={item.tenant}>{item.tenantName}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="编辑权限"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditRole}
        >
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roleList.map(item => (
                <Option key={item.role} value={item.role}>
                  {item.roleName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Permissions; 