import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, Input, message, AutoComplete } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { selectUser } from '../../api/orders';

interface OrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    orderSupplyDate: string;
    remark: string;
    userId: number;
  }) => Promise<void>;
  selectedCustomer?: {
    id: string;
    name: string;
  } | null;
  defaultDate?: Dayjs;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  selectedCustomer,
  defaultDate = dayjs()
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{
    label: string;
    value: string;
    userId: number;
  }>>([]);

  useEffect(() => {
    if (visible && selectedCustomer) {
      form.setFieldsValue({
        userId: Number(selectedCustomer.id),
        customerName: selectedCustomer.name
      });
    }
  }, [visible, selectedCustomer, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Form validation error:', error);
      message.error((error as Error).message || '提交失败');
    }
  };

  const handleSearch = async (value: string) => {
    if (!value) {
      setOptions([]);
      return;
    }

    try {
      const response = await selectUser(value);
      if (response.success) {
        const newOptions = response.data.map(user => ({
          label: `${user.name} (${user.mobile})${user.favorite ? ` - ${user.favorite}` : ''}`,
          value: user.name,
          userId: user.id
        }));
        setOptions(newOptions);
      }
    } catch (error) {
      message.error('搜索客户失败：' + (error as Error).message);
    }
  };

  const handleSelect = (value: string, option: any) => {
    console.log('Selected option:', option);
    form.setFieldsValue({
      userId: Number(option.userId),
      customerName: option.value,
      date: form.getFieldValue('date') || defaultDate
    });
  };

  return (
    <Modal
      title="新建供货单"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          date: defaultDate
        }}
      >
        {!selectedCustomer && (
          <Form.Item
            label="搜索客户"
            required
          >
            <AutoComplete
              options={options}
              onSearch={handleSearch}
              onSelect={handleSelect}
              placeholder="输入姓名或手机号搜索"
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        <Form.Item
          name="userId"
          hidden
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="客户名称"
          name="customerName"
          hidden={!!selectedCustomer}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="供货日期"
          name="date"
          rules={[{ required: true, message: '请选择供货日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="备注"
          name="remark"
        >
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 