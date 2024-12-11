import axios from 'axios';

export const BASE_URL = 'http://139.224.63.0:8000';

// 创建axios实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'X-DOMAIN-ID': '1000',
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 确保每个请求都带上 X-DOMAIN-ID
    config.headers['X-DOMAIN-ID'] = '1000';
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