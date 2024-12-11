import request from './request';

// 使用统一的请求实例
export const someOrderApi = async () => {
  const response = await request.get('/some/endpoint');
  return response.data;
}; 