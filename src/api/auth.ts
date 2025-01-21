import request from './request';

interface LoginParams {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    accountId: number;
    name: string;
    username: string;
    role: string;
    tenant: string;
  };
  displayMsg?: string;
}

interface UpdatePasswordParams {
  accountId: number;
  password: string;
}

interface UpdatePasswordResponse {
  success: boolean;
  data: null;
  displayMsg?: string;
}

export const authApi = {
  login: async (params: LoginParams): Promise<LoginResponse> => {
    try {
      const response = await request.post<LoginResponse>('/erp/account/login', params);
      return response.data;
    } catch (error) {
      throw new Error('登录失败：' + (error as Error).message);
    }
  },
    
  getCurrentUser: async () => {
    try {
      const response = await request.get('/auth/current-user');
      return response.data;
    } catch (error) {
      throw new Error('获取用户信息失败：' + (error as Error).message);
    }
  },
  
  updatePassword: async (params: UpdatePasswordParams): Promise<UpdatePasswordResponse> => {
    try {
      const response = await request.post<UpdatePasswordResponse>('/erp/account/updatePassword', params);
      return response.data;
    } catch (error) {
      throw new Error('修改密码失败：' + (error as Error).message);
    }
  }
}; 