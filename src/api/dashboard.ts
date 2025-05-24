import request from './request';

interface SalesData {
  totalPrice: number;
  salesRankList: Array<{
    saleDate: string;
    salePrice: number;
  }>;
  objectPriceList: Array<{
    objectDetailName: string;
    objectDetailId: number;
    price: number;
  }>;
}

interface BaseResponse {
  success: boolean;
  displayMsg?: string;
}

interface GetSalesDataResponse extends BaseResponse {
  data: SalesData;
}

interface ProductDetailInfo {
  objectDetailId: number;
  objectDetailName: string;
  unitName: string;
  totalCount: number;
  totalPrice: number;
  countRank: Array<{
    count: number;
    orderDate: string;
  }>;
  priceRank: Array<{
    price: number;
    orderDate: string;
  }>;
}

interface GetProductDetailResponse extends BaseResponse {
  data: ProductDetailInfo[];
}

interface UserPayInfo {
  userId: number;
  name: string;
  mobile: string;
  totalPrice: number;
  waitPayPrice: number;
  paySuccessPrice: number;
}

interface PaymentData {
  totalWaitPayPrice: number;
  userPayInfoList: UserPayInfo[];
}

interface GetPaymentDataResponse extends BaseResponse {
  data: PaymentData;
}

export interface PaymentDetailInfo {
  dateDesc: string;
  waitPayPrice: number;
  paySuccessPrice: number;
  startTime: number;
  endTime: number;
}

interface UserPaymentDetail {
  userId: number;
  name: string;
  mobile: string;
  totalPrice: number;
  totalWaitPayPrice: number;
  totalPaySuccessPrice: number;
  payDetailInfoList: PaymentDetailInfo[];
}

interface GetUserPaymentDetailResponse extends BaseResponse {
  data: UserPaymentDetail;
}

// 添加趋势数据相关的接口类型
interface TrendData {
  count: string;
  orderDate: string;
}

interface PriceData {
  price: string;
  orderDate: string;
}

interface TrendResponse {
  amountCountRank: TrendData[];
  jinCountRank: TrendData[];
  boxCountRank: TrendData[];
  heCountRank: TrendData[];
  priceRank: PriceData[];
}

interface GetProductTrendParams {
  objectDetailId: number;
  startTime: number;
  endTime: number;
  tenant?: string;
}

// 添加趋势数据的响应接口
interface GetProductTrendResponse extends BaseResponse {
  data: TrendResponse;
}

// 添加历史价格相关的接口类型
interface UnitPriceData {
  price: string;
  orderDate: string;
}

interface UnitPriceResponse {
  amountUnitPriceRank: UnitPriceData[];
  jinUnitPriceRank: UnitPriceData[];
  boxUnitPriceRank: UnitPriceData[];
  heUnitPriceRank: UnitPriceData[];
}

interface GetUnitPriceResponse extends BaseResponse {
  data: UnitPriceResponse;
}

export const dashboardApi = {
  getSalesData: async (params: { startTime: number; endTime: number; tenant?: string }): Promise<GetSalesDataResponse> => {
    try {
      const response = await request.post('/erp/index/orderObjectRankByDay', params);
      return response.data;
    } catch (error) {
      throw new Error('获取销售数据失败：' + (error as Error).message);
    }
  },

  getProductDetail: async (params: {
    startTime: number;
    endTime: number;
    tenant?: string;
    objectDetailName?: string;
    orderByUnitName?: '个' | '斤' | '箱' | '盒';
    orderType?: 'asc' | 'desc';
  }): Promise<GetProductDetailResponse> => {
    try {
      const response = await request.post('/erp/index/orderObjectDetailInfo', params);
      return response.data;
    } catch (error) {
      throw new Error('获取商品详情失败：' + (error as Error).message);
    }
  },

  getPaymentData: async (params: {
    startTime: number;
    endTime: number;
    keyword?: string;
    tenant?: string;
    payStatus?: 'paySuccess' | 'waitPay';
  }): Promise<GetPaymentDataResponse> => {
    try {
      const response = await request.post('/erp/index/orderPayInfo', params);
      return response.data;
    } catch (error) {
      throw new Error('获取付款数据失败：' + (error as Error).message);
    }
  },

  getUserPaymentDetail: async (params: {
    startTime: number;
    endTime: number;
    userId: number;
  }): Promise<GetUserPaymentDetailResponse> => {
    try {
      const response = await request.post('/erp/index/orderPayInfoByUser', params);
      return response.data;
    } catch (error) {
      throw new Error('获取用户付款详情失败：' + (error as Error).message);
    }
  },

  // 添加获取趋势数据的接口
  getProductTrend: async (params: GetProductTrendParams): Promise<GetProductTrendResponse> => {
    try {
      const response = await request.post('/erp/index/orderObjectDetailRank', params);
      return response.data;
    } catch (error) {
      throw new Error('获取趋势数据失败：' + (error as Error).message);
    }
  },

  getUnitPriceTrend: async (params: {
    objectDetailId: number;
    startTime: number;
    endTime: number;
    tenant?: string;
  }): Promise<GetUnitPriceResponse> => {
    try {
      const response = await request.post('/erp/index/objectDetailUnitPriceRank', params);
      return response.data;
    } catch (error) {
      throw new Error('获取历史价格数据失败：' + (error as Error).message);
    }
  },
}; 