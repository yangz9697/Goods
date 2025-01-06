import request from './request';

interface AddOrderObjectParams {
  orderNo: string;
  objectDetailId: number;
  objectDetailName: string;
  count: number;
  unitName: string;
  price: number;
  remark: string;
}

interface AddOrderObjectResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

interface UpdateOrderObjectParams {
  orderNo: string;
  objectDetailId: number;
  count: number;
  price: number;
  remark: string;
  unitName?: string;
  deliveryName?: string;
}

interface UpdateOrderObjectResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

interface DeleteOrderObjectParams {
  orderNo: string;
  objectDetailId: number;
}

interface DeleteOrderObjectResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

interface SelectObjectResponse {
  success: boolean;
  data: Array<{
    objectDetailId: number;
    objectDetailName: string;
  }>;
  displayMsg?: string;
}

interface GetInventoryResponse {
  success: boolean;
  data: number | null;
  displayMsg?: string;
}

// 添加货品
export const addOrderObject = async (params: AddOrderObjectParams): Promise<AddOrderObjectResponse> => {
  try {
    const response = await request.post<AddOrderObjectResponse>(
      '/erp/orderObject/addOrderObject',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('添加货品失败：' + (error as Error).message);
  }
};

// 更新货品
export const updateOrderObject = async (params: UpdateOrderObjectParams): Promise<UpdateOrderObjectResponse> => {
  try {
    const response = await request.post<UpdateOrderObjectResponse>(
      '/erp/orderObject/updateOrderObject',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('更新货品失败：' + (error as Error).message);
  }
};

// 删除货品
export const deleteOrderObject = async (params: DeleteOrderObjectParams): Promise<DeleteOrderObjectResponse> => {
  try {
    const response = await request.post<DeleteOrderObjectResponse>(
      '/erp/orderObject/deleteOrderObject',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('删除货品失败：' + (error as Error).message);
  }
};

// 根据名称搜索货品
export const selectObjectByName = async (keyword: string): Promise<SelectObjectResponse> => {
  try {
    const response = await request.get<SelectObjectResponse>(
      `/erp/orderObject/selectObjectByName?keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
  } catch (error) {
    throw new Error('搜索货品失败：' + (error as Error).message);
  }
};

// 获取货品库存
export const getObjectInventory = async (detailObjectId: number, unitName: string): Promise<GetInventoryResponse> => {
  try {
    const response = await request.get<GetInventoryResponse>(
      `/erp/orderObject/getObjectInventoryByUnitName?detailObjectId=${detailObjectId}&unitName=${encodeURIComponent(unitName)}`
    );
    return response.data;
  } catch (error) {
    throw new Error('获取库存失败：' + (error as Error).message);
  }
}; 