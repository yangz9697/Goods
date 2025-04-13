import axios from 'axios';

export const BASE_URL = import.meta.env.DEV 
  ? 'http://139.224.63.0:8000'  // 开发环境使用完整 URL
  : '/';  // 生产环境使用相对路径

// 创建axios实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 x-domain-id 头部
    const accountId = localStorage.getItem('accountId');
    if (accountId) {
      config.headers['x-domain-id'] = accountId;
    } else {
      // 临时写死的 domain-id，后续移除
      // config.headers['x-domain-id'] = '1737289376029';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default request; 