import request from './request';

interface AccountListFilters {
  creator?: string;
  name?: string;
  tenant?: string;
  username?: string;
}

interface AccountListParams {
  currentPage: number;
  pageSize: number;
  filters: AccountListFilters;
}

export interface AccountItem {
  name: string;
  username: string;
  role: 'admin' | 'manager' | 'employee';
  tenant: string;
  creator: string | null;
  updater: string | null;
  createTime: string;
  updateTime: string;
}

interface RoleItem {
  role: string;
  roleName: string;
}

interface RoleListResponse {
  success: boolean;
  resultCode: string;
  displayMsg: string;
  debugMsg: string;
  data: RoleItem[];
  requestId: string;
  serverTime: number;
  txId: null;
}

interface AddAccountParams {
  name: string;
  role: string;
  tenant: string;
  username: string;
}

interface AddAccountResponse {
  success: boolean;
  data: null;
  displayMsg: string;
}

interface AccountListResponse {
  success: boolean;
  data: {
    total: number;
    items: AccountItem[];
  };
  displayMsg?: string;
}

interface UpdateRoleParams {
  username: string;
  role: string;
}

export const accountApi = {
  pageAccount: async (params: AccountListParams): Promise<AccountListResponse> => {
    try {
      const response = await request.post<AccountListResponse>(
        '/erp/account/pageAccount',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('获取账户列表失败：' + (error as Error).message);
    }
  },

  getRoleList: async (): Promise<RoleListResponse> => {
    try {
      const response = await request.get<RoleListResponse>('/erp/account/getRoleList');
      return response.data;
    } catch (error) {
      throw new Error('获取角色列表失败：' + (error as Error).message);
    }
  },

  addAccount: async (params: AddAccountParams): Promise<AddAccountResponse> => {
    try {
      const response = await request.post<AddAccountResponse>('/erp/account/addAccount', params);
      return response.data;
    } catch (error) {
      throw new Error('添加账户失败：' + (error as Error).message);
    }
  },

  resetPassword: async (params: { username: string }) => {
    try {
      const response = await request.post('/erp/account/reset', params);
      return response.data;
    } catch (error) {
      throw new Error('重置密码失败：' + (error as Error).message);
    }
  },

  updateRole: async (params: UpdateRoleParams) => {
    try {
      const response = await request.post('/erp/account/updateRole', params);
      return response.data;
    } catch (error) {
      throw new Error('更新角色失败：' + (error as Error).message);
    }
  }
}; 