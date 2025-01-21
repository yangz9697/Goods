import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import './index.less';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 添加已登录检查
  React.useEffect(() => {
    const accountId = localStorage.getItem('accountId');
    if (accountId) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const res = await authApi.login(values);
      if (res.success) {
        // 存储所有需要的用户信息
        localStorage.setItem('accountId', res.data.accountId.toString());
        localStorage.setItem('name', res.data.name);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('tenant', res.data.tenant);
        localStorage.setItem('username', res.data.username);
        
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(res.displayMsg || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('登录失败，请检查网络连接');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>登录</h2>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入账户名称' }
            ]}
          >
            <Input placeholder="请输入账户名称" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login; 