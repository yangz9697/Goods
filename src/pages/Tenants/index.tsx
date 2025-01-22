import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space, message, Modal, Form, Popconfirm } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { tenantApi, TenantItem } from '@/api/tenant';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Search } = Input;

const Tenants: React.FC = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  
  // 如果不是管理员，重定向到首页
  useEffect(() => {
    if (role !== 'admin') {
      message.error('没有访问权限');
      navigate('/');
    }
  }, [role, navigate]);

  // 如果不是管理员，不渲染内容
  if (role !== 'admin') {
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchTenants = async (page: number, size: number, name: string = '') => {
    setLoading(true);
    try {
      const res = await tenantApi.pageTenant({
        currentPage: page,
        pageSize: size,
        filters: {
          tenantName: name
        }
      });
      if (res.success) {
        setTenants(res.data.items);
        setTotal(res.data.total);
      } else {
        message.error(res.displayMsg || '获取门店列表失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(currentPage, pageSize, searchText);
  }, [currentPage, pageSize]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
    fetchTenants(1, pageSize, value);
  };

  const handleAdd = async (values: { tenantName: string; remark?: string }) => {
    try {
      const res = await tenantApi.addTenant(values);
      if (res.success) {
        message.success('新增门店成功');
        setIsModalVisible(false);
        form.resetFields();
        fetchTenants(currentPage, pageSize, searchText);
      } else {
        message.error(res.displayMsg || '新增门店失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleDelete = async (tenant: string) => {
    try {
      const res = await tenantApi.deleteTenant({ tenant });
      if (res.success) {
        message.success('删除门店成功');
        fetchTenants(currentPage, pageSize, searchText);
      } else {
        message.error(res.displayMsg || '删除门店失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const columns = [
    {
      title: '门店编码',
      dataIndex: 'tenant',
      key: 'tenant',
    },
    {
      title: '门店名称',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: '更新人',
      dataIndex: 'updater',
      key: 'updater',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TenantItem) => (
        <Space size="middle">
          <Popconfirm
            title="确定要删除该门店吗？"
            onConfirm={() => handleDelete(record.tenant)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>门店管理</h2>
        <Space>
          <Search
            placeholder="请输入门店名称"
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            新增门店
          </Button>
        </Space>
      </div>
      <Table 
        columns={columns} 
        dataSource={tenants}
        rowKey="id"
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
        title="新增门店"
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdd}
        >
          <Form.Item
            name="tenantName"
            label="门店名称"
            rules={[{ required: true, message: '请输入门店名称' }]}
          >
            <Input placeholder="请输入门店名称" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tenants; 