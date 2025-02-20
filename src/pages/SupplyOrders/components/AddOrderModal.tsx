import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Form, DatePicker, Input, message, Select } from 'antd';
import { orderApi } from '@/api/orders';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';  // 导入中文语言包
import locale from 'antd/es/date-picker/locale/zh_CN';  // 导入 DatePicker 的中文配置
import { useNavigate } from 'react-router-dom';  // 添加导入
import { formatPhone } from '@/utils/format';  // 导入手机号脱敏工具函数

interface AddOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  defaultUserId?: number;
  defaultCustomer?: {
    userId: number;
    userName: string | null;
    mobile: string | null;
    label: string;
  };
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

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

const AddOrderModal: React.FC<AddOrderModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  defaultUserId,
  defaultCustomer
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<{ label: string; value: number }[]>([]);

  // 修改初始值设置
  useEffect(() => {
    if (visible) {
      if (defaultCustomer) {
        // 如果有默认客户信息，设置选项和表单值
        setUserOptions([{
          label: defaultCustomer.label,
          value: defaultCustomer.userId
        }]);
        form.setFieldsValue({
          userId: defaultCustomer.userId,
          deliveryDate: dayjs()
        });
      } else {
        form.setFieldsValue({
          userId: defaultUserId,
          deliveryDate: dayjs()
        });
      }
    }
  }, [visible, defaultUserId, defaultCustomer, form]);

  const handleSearchImpl = async (keyword: string) => {
    if (!keyword) {
      setUserOptions([]);
      return;
    }
    try {
      const res = await orderApi.selectUser(keyword);
      if (res.success) {
        const options = res.data.map(user => ({
          label: `${user.name} (${formatPhone(user.mobile)})`,
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
        orderSupplyDate: values.deliveryDate.format('YYYY-MM-DD'),
        remark: values.remark || ''
      });

      if (res.success) {
        message.success('添加供货单成功');
        // 先跳转到详情页
        navigate(`/supply-orders/detail/${res.data}`);  // API 直接返回 orderNo 字符串
        // 再执行其他清理操作
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
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="确定"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="userId"
          label="客户"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Select
            showSearch
            placeholder="请输入客户姓名或手机号搜索"
            filterOption={false}
            onSearch={handleSearch}
            options={userOptions}
            disabled={!!defaultCustomer}
          />
        </Form.Item>

        <Form.Item
          name="deliveryDate"
          label="供货日期"
          rules={[{ required: true, message: '请选择供货日期' }]}
          initialValue={dayjs()}  // 设置默认值为当天
        >
          <DatePicker 
            style={{ width: '100%' }}
            locale={locale}        // 添加中文配置
            format="YYYY-MM-DD"
            allowClear={false}     // 禁止清除日期
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