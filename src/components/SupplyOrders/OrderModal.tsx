import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, Input, Select, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

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
      setLoading(true);
      await onSubmit({
        orderSupplyDate: values.date.format('YYYY-MM-DD'),
        remark: values.remark || '',
        userId: values.userId
      });
      form.resetFields();
    } catch (error) {
      message.error('提交失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
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
        <Form.Item
          label="客户ID"
          name="userId"
          hidden={!!selectedCustomer}
          rules={[{ required: true, message: '请输入客户ID' }]}
        >
          <Input disabled={!!selectedCustomer} />
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