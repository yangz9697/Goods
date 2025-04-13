import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Space, Button, message } from 'antd';
import { addObject } from '@/api/objectDetail';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

interface CreateObjectModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const CreateObjectModal: React.FC<CreateObjectModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const { amountForBox, jinForBox, name, unit, quantity } = values;
      
      // 根据选择的单位和数量,计算其他单位的数量
      let amount = 0, jin = 0, box = 0;
      
      switch (unit) {
        case 'piece':
          amount = quantity;
          box = quantity / amountForBox;
          jin = box * jinForBox;
          break;
        case 'jin':
          jin = quantity;
          box = quantity / jinForBox;
          amount = box * amountForBox;
          break;
        case 'box':
          box = quantity;
          jin = quantity * jinForBox;
          amount = quantity * amountForBox;
          break;
      }

      const requestData = {
        amountForBox,
        jinForBox,
        objectDetailName: name,
        tenant: 'default',
        amount: Math.round(amount * 100) / 100,
        jin: Math.round(jin * 100) / 100,
        box: Math.round(box * 100) / 100
      };

      const response = await addObject(requestData);

      if (response.success) {
        message.success('添加商品成功');
        onCancel();
        form.resetFields();
        onSuccess?.();
        
        Modal.confirm({
          title: '提醒',
          content: '商品添加成功，请及时设置商品价格',
          okText: '去设置',
          cancelText: '稍后设置',
          onOk() {
            navigate('/pricing');
          }
        });
      } else {
        message.error(response.displayMsg || '添加失败');
      }
    } catch (error) {
      message.error('添加商品失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="添加商品"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="name"
          label="商品名称"
          rules={[{ required: true, message: '请输入商品名称' }]}
        >
          <Input placeholder="请输入商品名称" />
        </Form.Item>

        <Form.Item
          name="jinForBox"
          label="每箱斤数"
          rules={[{ required: true, message: '请输入每箱斤数' }]}
        >
          <InputNumber 
            min={0} 
            precision={1}
            step={0.1}
            style={{ width: '100%' }} 
            placeholder="请输入每箱斤数"
          />
        </Form.Item>

        <Form.Item
          name="amountForBox"
          label="每箱个数"
          rules={[{ required: true, message: '请输入每箱个数' }]}
        >
          <InputNumber 
            min={0} 
            precision={1}
            step={0.1}
            style={{ width: '100%' }} 
            placeholder="请输入每箱个数"
          />
        </Form.Item>

        <Form.Item label="初始库存">
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              name="quantity"
              noStyle
              rules={[{ required: true, message: '请输入初始库存数量' }]}
            >
              <InputNumber 
                min={0} 
                precision={1}
                step={0.1}
                style={{ width: '100%' }} 
                placeholder="请输入初始库存数量"
              />
            </Form.Item>
            <Form.Item
              name="unit"
              noStyle
              initialValue="piece"
              rules={[{ required: true, message: '请选择库存单位' }]}
            >
              <Select style={{ width: 120 }}>
                <Option value="piece">个</Option>
                <Option value="jin">斤</Option>
                <Option value="box">箱</Option>
              </Select>
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              确认添加
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateObjectModal; 