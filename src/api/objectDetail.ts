import request from './request';
import { 
  ObjectDetailRequest, 
  ObjectDetailResponse,
  PageObjectDetailRequest,
  PageObjectDetailResponse,
  PageObjectPriceRequest,
  PageObjectPriceResponse,
  QueryObjectOpLogResponse
} from '../types/objectDetail';

export const addObject = async (data: ObjectDetailRequest): Promise<ObjectDetailResponse> => {
  try {
    const response = await request.post<ObjectDetailResponse>(
      '/erp/objectDetail/addObject',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error('添加对象失败：' + (error as Error).message);
  }
};

export const pageObjectDetail = async (params: PageObjectDetailRequest): Promise<PageObjectDetailResponse> => {
  try {
    const response = await request.post<PageObjectDetailResponse>(
      '/erp/objectDetail/pageObjectDetail',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('查询商品列表失败：' + (error as Error).message);
  }
};

export const deleteObject = async (objectDetailId: number) => {
  try {
    const response = await request.post('/erp/objectDetail/deleteObject', {
      objectDetailId
    });
    return response.data;
  } catch (error) {
    throw new Error('删除商品失败：' + (error as Error).message);
  }
};

interface UpdateInventoryRequest {
  amount?: number;
  box?: number;
  jin?: number;
  detailObjectId: number;
  remark: string;
}

export const updateObjectInventory = async (data: UpdateInventoryRequest) => {
  try {
    const response = await request.post('/erp/objectDetail/updateObjectInventory', data);
    return response.data;
  } catch (error) {
    throw new Error('调整库存失败：' + (error as Error).message);
  }
};

export const pageObjectPrice = async (params: PageObjectPriceRequest): Promise<PageObjectPriceResponse> => {
  try {
    const response = await request.post<PageObjectPriceResponse>(
      '/erp/objectDetail/pageObjectPrice',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('获取价格列表失败：' + (error as Error).message);
  }
};

export const queryObjectOpLog = async (objectDetailId: number): Promise<QueryObjectOpLogResponse> => {
  try {
    const response = await request.get<QueryObjectOpLogResponse>(
      `/erp/objectDetail/queryObjectOpLog?objectDetailId=${objectDetailId}`
    );
    return response.data;
  } catch (error) {
    throw new Error('获取操作记录失败：' + (error as Error).message);
  }
};

interface UpdatePriceRequest {
  objectDetailId: number;
  priceForAmount: number;
  priceForBox: number;
  priceForJin: number;
}

export const updateObjectPrice = async (data: UpdatePriceRequest) => {
  try {
    const response = await request.post('/erp/objectDetail/updateObjectPrice', data);
    return response.data;
  } catch (error) {
    throw new Error('修改价格失败：' + (error as Error).message);
  }
};

interface UpdateObjectRequest {
  objectDetailId: number;
  amountForBox: number;
  jinForBox: number;
  objectDetailName: string;
  tenant?: string;
}

interface UpdateObjectResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

export const updateObject = async (data: UpdateObjectRequest): Promise<UpdateObjectResponse> => {
  try {
    const response = await request.post<UpdateObjectResponse>(
      '/erp/objectDetail/updateObject',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error('更新商品失败：' + (error as Error).message);
  }
};

export interface UpdateObjectUnitAndPriceRequest {
  objectDetailId: number;
  amount?: number;  // 每箱个数
  jin?: number;     // 每箱斤数
  priceForAmount?: number;
  priceForBox?: number;
  priceForJin?: number;
}

export interface UpdateObjectUnitAndPriceResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

export const updateObjectUnitAndPrice = async (data: UpdateObjectUnitAndPriceRequest): Promise<UpdateObjectUnitAndPriceResponse> => {
  try {
    const response = await request.post<UpdateObjectUnitAndPriceResponse>(
      '/erp/objectDetail/updateObjectUnitAndPrice',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error('更新商品单位和价格失败：' + (error as Error).message);
  }
}; 