import React from 'react';
import { Modal, Form, DatePicker, AutoComplete, Space, Button } from 'antd';
import dayjs from 'dayjs';
import type { CustomerType } from '../../types/customer';

interface OrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  selectedCustomer: CustomerType | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  selectedCustomer
}) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="新建供货单"
      visible={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form
        form={form}
        onFinish={onSubmit}
        initialValues={{
          date: dayjs(),
          customerId: selectedCustomer?.id,
          customerName: selectedCustomer?.name,
          customerPhone: selectedCustomer?.phone,
        }}
      >
        <Form.Item
          name="date"
          label="日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item
          name="customerId"
          label="客户"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <AutoComplete
            disabled={!!selectedCustomer}
            placeholder="搜索客户姓名或手机号"
            // TODO: 实现客户搜索功能
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              确认
            </Button>
            <Button onClick={onCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}; 