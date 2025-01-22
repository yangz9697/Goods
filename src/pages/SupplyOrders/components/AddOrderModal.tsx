import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Form, DatePicker, Input, message, Select } from 'antd';
import { orderApi } from '@/api/orders';

interface AddOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  defaultUserId?: number;
}

const { TextArea } = Input;

// 自定义 debounce hook
const useDebounce = (fn: Function, delay: number) => {
  const timer = React.useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);
};

const AddOrderModal: React.FC<AddOrderModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  defaultUserId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (visible && defaultUserId) {
      form.setFieldsValue({ userId: defaultUserId });
    }
  }, [visible, defaultUserId, form]);

  const handleSearchImpl = async (keyword: string) => {
    if (!keyword) {
      setUserOptions([]);
      return;
    }
    try {
      const res = await orderApi.selectUser(keyword);
      if (res.success) {
        const options = res.data.map(user => ({
          label: `${user.name} (${user.mobile})`,
          value: user.id
        }));
        setUserOptions(options);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    }
  };

  const handleSearch = useDebounce(handleSearchImpl, 300);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const res = await orderApi.addObjectOrder({
        userId: values.userId,
        orderSupplyDate: values.orderSupplyDate.format('YYYY-MM-DD'),
        remark: values.remark || ''
      });

      if (res.success) {
        message.success('添加供货单成功');
        form.resetFields();
        onSuccess();
      } else {
        message.error(res.displayMsg || '添加供货单失败');
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="添加供货单"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="userId"
          label="选择客户"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Select
            showSearch
            placeholder="请输入客户姓名或手机号搜索"
            filterOption={false}
            onSearch={handleSearch}
            options={userOptions}
          />
        </Form.Item>

        <Form.Item
          name="orderSupplyDate"
          label="供货日期"
          rules={[{ required: true, message: '请选择供货日期' }]}
        >
          <DatePicker 
            format="YYYY-MM-DD" 
            style={{ width: '100%' }} 
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea rows={4} placeholder="请输入备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddOrderModal; 