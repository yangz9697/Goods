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
    tenantName: string;
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

interface TenantInfo {
  tenant: string;
  tenantName: string;
}

interface GetTenantListResponse {
  success: boolean;
  data: TenantInfo[];
  displayMsg?: string;
}

interface UpdateTenantParams {
  accountId: number;
  tenant: string;
}

interface UpdateTenantResponse {
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
  },
  
  getTenantList: async (): Promise<GetTenantListResponse> => {
    try {
      const response = await request.get<GetTenantListResponse>('/erp/account/getTenantList');
      return response.data;
    } catch (error) {
      throw new Error('获取门店列表失败：' + (error as Error).message);
    }
  },

  updateTenant: async (params: UpdateTenantParams): Promise<UpdateTenantResponse> => {
    try {
      const response = await request.post<UpdateTenantResponse>('/erp/account/updateTenantInfo', params);
      return response.data;
    } catch (error) {
      throw new Error('切换门店失败：' + (error as Error).message);
    }
  }
}; 