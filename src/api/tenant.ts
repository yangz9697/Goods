import request from './request';

interface TenantListFilters {
  tenantName?: string;
}

interface TenantListParams {
  currentPage: number;
  pageSize: number;
  filters: TenantListFilters;
}

export interface TenantItem {
  id: number;
  tenant: string;
  tenantName: string;
  remark: string | null;
  deleted: number;
  creator: string;
  updater: string;
  createTime: number;
  updateTime: number;
}

interface TenantListResponse {
  success: boolean;
  resultCode: string;
  displayMsg: string;
  debugMsg: string;
  data: {
    total: number;
    totalPage: number;
    items: TenantItem[];
  };
  requestId: string;
  serverTime: number;
  txId: null;
}

interface AddTenantParams {
  tenantName: string;
  remark?: string;
}

interface DeleteTenantParams {
  tenant: string;
}

interface BaseResponse {
  success: boolean;
  displayMsg: string;
}

export const tenantApi = {
  pageTenant: async (params: TenantListParams): Promise<TenantListResponse> => {
    try {
      const response = await request.post<TenantListResponse>(
        '/erp/account/pageTenant',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('获取门店列表失败：' + (error as Error).message);
    }
  },

  addTenant: async (params: AddTenantParams): Promise<BaseResponse> => {
    try {
      const response = await request.post<BaseResponse>(
        '/erp/account/addTenant',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('新增门店失败：' + (error as Error).message);
    }
  },

  deleteTenant: async (params: DeleteTenantParams): Promise<BaseResponse> => {
    try {
      const response = await request.post<BaseResponse>(
        '/erp/account/deleteTenant',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('删除门店失败：' + (error as Error).message);
    }
  }
}; 