import request from './request';
import { 
  ObjectDetailRequest, 
  ObjectDetailResponse,
  PageObjectDetailRequest,
  PageObjectDetailResponse 
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