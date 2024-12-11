import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  // ... 其他返回字段
}

export const authApi = {
  login: (data: LoginParams) => 
    request.post<LoginResult>('/auth/login', data),
    
  logout: () => 
    request.post('/auth/logout'),
    
  getCurrentUser: () => 
    request.get('/auth/current-user')
}; 