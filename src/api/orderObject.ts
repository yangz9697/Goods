import request from './request';

interface BaseResponse {
  success: boolean;
  displayMsg?: string;
  data?: any;
}

interface OrderObjectInfo {
  objectDetailId: number;
  objectDetailName: string;
  count: number;
  unitName: string;
  remark: string;
  deliveryName: string | null;
  price: number;
  unitPrice: number;
  totalPrice: number;
  creator: string;
  createTime: number;
  updater: string;
  updateTime: number;
  jinPerBox?: number;
}

interface GetObjectListResponse extends BaseResponse {
  data: {
    objectInfoList: OrderObjectInfo[];
    orderTotalPrice: number;
  };
}

export interface AddOrderObjectRequest {
  orderNo: string;
  objectDetailId: number;
  objectDetailName: string;
  count: number;
  unitName: string;
  price: number;
  remark: string;
}

export interface UpdateOrderObjectRequest {
  orderNo: string;
  objectDetailName: string;
  unitName?: string;
  id: string;
  objectDetailId: number;
  count?: number | undefined;
  price?: number;
  totalPrice?: number;
  remark?: string;
  deliveryName?: string;
  remarkCount?: string;
  planCount?: number;
}

export interface DeleteOrderObjectRequest {
  orderNo: string;
  id: number;
}

interface GetInventoryResponse extends BaseResponse {
  data: number | null;
}

interface CreateObjectRequest {
  objectDetailName: string;
  unitName: string;
  price: number;
  remark: string;
}

interface CreateObjectResponse extends BaseResponse {
  data: {
    objectDetailId: number;
  };
}

interface CheckInventoryParams {
  count: number;
  id: string;
  unitName: string;
}

interface CheckInventoryResponse {
  success: boolean;
  data: number; // 返回的库存数量
  displayMsg?: string;
}

export const orderObjectApi = {
  getObjectListByOrderNo: async (orderNo: string): Promise<GetObjectListResponse> => {
    try {
      const response = await request.get<GetObjectListResponse>(
        `/erp/orderObject/getObjectListByOrderNo?orderNo=${orderNo}`
      );
      return response.data;
    } catch (error) {
      throw new Error('获取订单商品列表失败：' + (error as Error).message);
    }
  },

  addOrderObject: async (data: AddOrderObjectRequest): Promise<BaseResponse> => {
    try {
      const response = await request.post<BaseResponse>(
        '/erp/orderObject/addOrderObject',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error('添加订单商品失败：' + (error as Error).message);
    }
  },

  updateOrderObject: async (data: UpdateOrderObjectRequest): Promise<BaseResponse> => {
    try {
      const response = await request.post<BaseResponse>(
        '/erp/orderObject/updateOrderObject',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error('更新订单商品失败：' + (error as Error).message);
    }
  },

  deleteOrderObject: async (data: DeleteOrderObjectRequest): Promise<BaseResponse> => {
    try {
      const response = await request.post<BaseResponse>(
        '/erp/orderObject/deleteOrderObject',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error('删除订单商品失败：' + (error as Error).message);
    }
  },

  selectObjectByName: async (keyword: string): Promise<BaseResponse & { data: Array<{ objectDetailId: number; objectDetailName: string }> }> => {
    try {
      const response = await request.get(
        `/erp/orderObject/selectObjectByName?keyword=${encodeURIComponent(keyword)}`
      );
      return response.data;
    } catch (error) {
      throw new Error('搜索商品失败：' + (error as Error).message);
    }
  },

  getObjectInventory: async (objectDetailId: number, unitName: string): Promise<GetInventoryResponse> => {
    try {
      const response = await request.get<GetInventoryResponse>(
        `/erp/orderObject/getObjectInventoryByUnitName?detailObjectId=${objectDetailId}&unitName=${encodeURIComponent(unitName)}`
      );
      return response.data;
    } catch (error) {
      throw new Error('获取商品库存失败：' + (error as Error).message);
    }
  },

  createObject: async (data: CreateObjectRequest): Promise<CreateObjectResponse> => {
    try {
      const response = await request.post<CreateObjectResponse>(
        '/erp/orderObject/createObject',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error('创建货品失败：' + (error as Error).message);
    }
  },

  checkObjectDetailInventory: async (params: CheckInventoryParams): Promise<CheckInventoryResponse> => {
    try {
      const response = await request.post<CheckInventoryResponse>(
        '/erp/orderObject/checkObjectDetailInventory',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('检查商品库存失败：' + (error as Error).message);
    }
  },
}; 