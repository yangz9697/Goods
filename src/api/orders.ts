import request from './request';
import { OrderStatusCode } from '@/types/order';

interface QueryObjectOrderRequest {
  startTime: number;
  endTime: number;
  keyWord?: string;
  // 是否大货/小货筛选：true=大货，false=小货，未传/undefined=全部
  isBox?: boolean | null;
}

export interface OrderInfo {
  orderSupplyDate: string;
  orderNo: string;
  orderStatus: OrderStatusCode;
  orderStatusName: string;
  remark: string;
  userId: number;
  userName: string;
  userMobile: string;
  createTime: string;
  isUrgent: boolean;
  updateTime: number;
  deliveryCount: number;
  totalObjectCount: number;
}

interface CustomerOrder {
  userName: string | null;
  mobile: string | null;
  userId: number;
  orderInfoList: OrderInfo[];
}

interface QueryObjectOrderResponse {
  success: boolean;
  data: CustomerOrder[];
  displayMsg?: string;
}

export const queryObjectOrder = async (params: QueryObjectOrderRequest): Promise<QueryObjectOrderResponse> => {
  try {
    const response = await request.post<QueryObjectOrderResponse>(
      '/erp/order/queryObjectOrder',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('获取供货单列表失败：' + (error as Error).message);
  }
};

interface AddObjectOrderRequest {
  orderSupplyDate: string;
  remark: string;
  userId: number;
}

interface AddObjectOrderResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

export const addObjectOrder = async (data: AddObjectOrderRequest): Promise<AddObjectOrderResponse> => {
  try {
    const response = await request.post<AddObjectOrderResponse>(
      '/erp/order/addObjectOrder',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error('创建供货单失败：' + (error as Error).message);
  }
};

interface UpdateOrderUrgentRequest {
  orderNo: string;
  isUrgent: boolean;
}

interface UpdateOrderUrgentResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

export const updateOrderUrgent = async (data: { orderNo: string, isUrgent: boolean }) => {
  try {
    const response = await request.post('/erp/order/urgentOrder', data);
    return response.data;
  } catch (error) {
    throw new Error('更新订单加急状态失败：' + (error as Error).message);
  }
};

interface PageOrderRequest {
  currentPage: number;
  pageSize: number;
  filters: {
    startTime: number;
    endTime: number;
    userId: number;
  };
}

interface PageOrderResponse {
  success: boolean;
  data: {
    total: number;
    totalPage: number;
    items: Array<{
      orderNo: string;
      orderStatusName: string;
      orderStatusCode: OrderStatusCode;
      mobile: string;
      userName: string;
      createTime: number;
      remark: string;
      updateTime: number;
      orderObjectDetailList: any[] | null;
    }>;
  };
  displayMsg?: string;
}

export const pageOrder = async (params: PageOrderRequest): Promise<PageOrderResponse> => {
  try {
    const response = await request.post<PageOrderResponse>(
      '/erp/order/pageOrder',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('获取供货单列表失败：' + (error as Error).message);
  }
};

interface DeleteOrderResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

export const deleteOrder = async (orderNo: string): Promise<DeleteOrderResponse> => {
  try {
    const response = await request.post<DeleteOrderResponse>(
      '/erp/order/deleteOrder',
      { orderNo }
    );
    return response.data;
  } catch (error) {
    throw new Error('删除订单失败：' + (error as Error).message);
  }
};

interface OrderStatus {
  orderStatusCode: OrderStatusCode;
  orderStatusName: string;
}

interface GetOrderStatusResponse {
  success: boolean;
  data: OrderStatus[];
  displayMsg?: string;
}

interface UpdateOrderStatusRequest {
  orderNo: string;
  orderStatusCode: OrderStatusCode;
}

interface UpdateOrderStatusResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

export const updateOrderStatus = async (params: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> => {
  try {
    const response = await request.post<UpdateOrderStatusResponse>(
      '/erp/order/updateOrderStatus',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('更新订单状态失败：' + (error as Error).message);
  }
};

// 添加搜索用户的接口
interface SelectUserResponse {
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    mobile: string;
    favorite?: string;
    remark?: string;
    createTime: number;
    updateTime: number;
    creator: string;
    updater: string;
  }>;
  displayMsg?: string;
}

export const selectUser = async (keyword: string): Promise<SelectUserResponse> => {
  try {
    const response = await request.get<SelectUserResponse>(
      `/erp/objectUser/selectUser?keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
  } catch (error) {
    throw new Error('搜索客户失败：' + (error as Error).message);
  }
};

export interface OrderListFilters {
  startTime: number;
  endTime: number;
  userId?: number;
  keyword?: string;
  objectDetailName?: string;
}

interface OrderListParams {
  currentPage: number;
  pageSize: number;
  filters: OrderListFilters;
}

export interface OrderItem {
  orderNo: string;
  orderStatusName: string;
  orderStatusCode: OrderStatusCode;
  mobile: string;
  userName: string;
  createTime: number;
  remark: string;
  updateTime: number;
  orderObjectDetailList: any[] | null;
}

interface OrderListResponse {
  success: boolean;
  data: {
    total: number;
    totalPage: number;
    items: OrderItem[];
  };
  displayMsg?: string;
}

export interface GetOrderInfoResponse {
  success: boolean;
  data: {
    orderSupplyDate: string;
    orderNo: string;
    orderStatus: OrderStatusCode;
    orderStatusName: string;
    payStatusName: string;
    payStatus: 'waitPay' | 'paySuccess';
    userName: string;
    userMobile: string;
    createTime: string | null;
    remark: string;
    deliveryCount: number;
    totalObjectCount: number;
    objectInfoList: Array<{
      id: string;
      objectDetailId: number;
      objectDetailName: string;
      count: number;
      unitName: string;
      price: number;
      unitPrice: number;
      remark: string;
      deliveryName: string;
      totalPrice: number;
      creator: string;
      createTime: number;
      updater: string;
      updateTime: number;
      planCount?: number;
      remarkCount?: string;
      jinPerBox?: number;
      amountPerBox?: number;
      deliverUpdateTime?: number;
    }> | null;
    orderTotalPrice: number | null;
  };
  displayMsg?: string;
}

interface AddOrderParams {
  userId: number;
  orderSupplyDate: string;
  remark?: string;
}

interface AddOrderResponse {
  success: boolean;
  data: null;
  displayMsg?: string;
}

interface UpdateOrderPayStatusRequest {
  orderNo: string;
  orderPayStatusCode: 'waitPay' | 'paySuccess';
}

interface UpdateOrderPayStatusResponse {
  success: boolean;
  displayMsg?: string;
}

interface GetObjectListResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

// 添加接口定义
interface DeliveryUser {
  name: string;
  username: string;
  role: string;
  tenant: string;
  creator: string | null;
  updater: string | null;
  createTime: string;
  updateTime: string;
}

interface SelectDeliveryResponse {
  success: boolean;
  data: DeliveryUser[];
  displayMsg?: string;
}

export interface RecognizedDraftItem {
  remark: string;
  remarkCount: string;
  serviceObjectId: number;
  serviceObjectName: string;
  totalCount: number;
  unitName: string;
}

interface RecognizeTextResponse {
  success: boolean;
  data: RecognizedDraftItem[];
  displayMsg?: string;
}

interface ConfirmDraftRequest {
  orderNo: string;
  items: RecognizedDraftItem[];
}

interface ConfirmDraftResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

interface BatchImportDraftResponse {
  success: boolean;
  data: RecognizedDraftItem[];
  displayMsg?: string;
}

interface RecognizeAudioResponse {
  success: boolean;
  data: RecognizedDraftItem[];
  displayMsg?: string;
}

export const orderApi = {
  pageOrder: async (params: OrderListParams): Promise<OrderListResponse> => {
    try {
      const response = await request.post<OrderListResponse>(
        '/erp/order/pageOrder',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('获取供货单列表失败：' + (error as Error).message);
    }
  },
  queryObjectOrder: async (params: QueryObjectOrderRequest): Promise<QueryObjectOrderResponse> => {
    try {
      const response = await request.post<QueryObjectOrderResponse>(
        '/erp/order/queryObjectOrder',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('获取供货单列表失败：' + (error as Error).message);
    }
  },
  addObjectOrder: async (data: AddObjectOrderRequest): Promise<AddObjectOrderResponse> => {
    try {
      const response = await request.post<AddObjectOrderResponse>(
        '/erp/order/addObjectOrder',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error('创建供货单失败：' + (error as Error).message);
    }
  },
  updateOrderUrgent: async (data: UpdateOrderUrgentRequest): Promise<UpdateOrderUrgentResponse> => {
    try {
      const response = await request.post<UpdateOrderUrgentResponse>(
        '/erp/order/urgentOrder',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error('更新订单加急状态失败：' + (error as Error).message);
    }
  },
  updateOrderStatus: async (params: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> => {
    try {
      const response = await request.post<UpdateOrderStatusResponse>(
        '/erp/order/updateOrderStatus',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('更新订单状态失败：' + (error as Error).message);
    }
  },
  selectUser: async (keyword: string): Promise<SelectUserResponse> => {
    try {
      const response = await request.get<SelectUserResponse>(
        `/erp/objectUser/selectUser?keyword=${encodeURIComponent(keyword)}`
      );
      return response.data;
    } catch (error) {
      throw new Error('搜索客户失败：' + (error as Error).message);
    }
  },
  addOrder: async (params: AddOrderParams): Promise<AddOrderResponse> => {
    try {
      const response = await request.post<AddOrderResponse>(
        '/erp/order/addOrder',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('添加供货单失败：' + (error as Error).message);
    }
  },
  getOrderInfo: async (orderNo: string): Promise<GetOrderInfoResponse> => {
    try {
      const response = await request.get<GetOrderInfoResponse>(
        `/erp/order/getOrderInfo?orderNo=${orderNo}`
      );
      return response.data;
    } catch (error) {
      throw new Error('获取供货单详情失败：' + (error as Error).message);
    }
  },
  getOrderDetail: async (id: string): Promise<GetObjectListResponse> => {
    try {
      const response = await request.get<GetObjectListResponse>(
        `/erp/orderObject/getObjectListByOrderNo?orderNo=${id}`
      );
      return response.data;
    } catch (error) {
      throw new Error('获取订单详情失败：' + (error as Error).message);
    }
  },
  getOrderAllStatus: async (): Promise<GetOrderStatusResponse> => {
    try {
      const response = await request.get<GetOrderStatusResponse>(
        '/erp/order/getOrderAllStatus'
      );
      return response.data;
    } catch (error) {
      throw new Error('获取订单状态列表失败：' + (error as Error).message);
    }
  },
  deleteOrder: async (orderNo: string): Promise<DeleteOrderResponse> => {
    try {
      const response = await request.post<DeleteOrderResponse>('/erp/order/deleteOrder', { orderNo });
      return response.data;
    } catch (error) {
      throw new Error('删除订单失败：' + (error as Error).message);
    }
  },
  updateOrderPayStatus: async (params: UpdateOrderPayStatusRequest): Promise<UpdateOrderPayStatusResponse> => {
    try {
      const response = await request.post<UpdateOrderPayStatusResponse>(
        '/erp/order/updateOrderPayStatus',
        params
      );
      return response.data;
    } catch (error) {
      throw new Error('更新订单支付状态失败：' + (error as Error).message);
    }
  },
  selectDelivery: async (): Promise<SelectDeliveryResponse> => {
    try {
      const response = await request.get<SelectDeliveryResponse>(
        '/erp/account/selectDelivery'
      );
      return response.data;
    } catch (error) {
      throw new Error('获取配货员列表失败：' + (error as Error).message);
    }
  },
  cancelUrgentOrder: async (orderNo: string) => {
    try {
      const response = await request.post('/erp/order/cancelUrgentOrder', { orderNo });
      return response.data;
    } catch (error) {
      throw new Error('取消加急失败：' + (error as Error).message);
    }
  },
  getOrderInfoByUserId: async (params: {
    userId: number;
    startTime: number;
    endTime: number;
  }) => {
    try {
      const response = await request.post('/erp/order/getOrderInfoByUserId', params);
      return response.data;
    } catch (error) {
      throw new Error('获取用户订单信息失败：' + (error as Error).message);
    }
  },
  printOrderToPDF: async (orderNo: string) => {
    try {
      const response = await request.post('/erp/order/printObjectToPDF', {
        orderNo
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('打印失败：' + (error as Error).message);
    }
  },
  exportOrderToExcel: async (orderNo: string) => {
    try {
      const response = await request.post('/erp/order/exportObjectToExcel', {
        orderNo
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('导出失败：' + (error as Error).message);
    }
  },
  batchPrintOrderToPDF: async (params: { orderNoList: string[] }) => {
    try {
      const response = await request.post('/erp/order/batchPrintObjectPDF', params, {
        responseType: 'blob',
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      throw new Error('批量打印失败：' + (error as Error).message);
    }
  },
  batchExportOrderToExcel: async (params: { orderNoList: string[] }) => {
    try {
      const response = await request.post('/erp/order/batchExportObjectExcel', params, {
        responseType: 'blob',
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      throw new Error('批量导出失败：' + (error as Error).message);
    }
  },
  batchUpdateOrderPayStatus: async (params: {
    orderNoList: string[];
    orderPayStatusCode: 'paySuccess';
  }) => {
    try {
      const response = await request.post('/erp/order/batchUpdateOrderPayStatus', params);
      return response.data;
    } catch (error) {
      throw new Error('批量更新订单支付状态失败：' + (error as Error).message);
    }
  },
  recognizeText: async (text: string): Promise<RecognizeTextResponse> => {
    try {
      const response = await request.post<RecognizeTextResponse>(
        '/erp/draft/recognizeText',
        { text },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      throw new Error('文字识别失败：' + (error as Error).message);
    }
  },
  confirmDraft: async (params: ConfirmDraftRequest): Promise<ConfirmDraftResponse> => {
    try {
      const response = await request.post<ConfirmDraftResponse>('/erp/draft/confirm', params);
      return response.data;
    } catch (error) {
      throw new Error('草稿确认失败：' + (error as Error).message);
    }
  },
  downloadDraftTemplate: async () => {
    try {
      const response = await request.get('/erp/draft/template', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('下载Excel模版失败：' + (error as Error).message);
    }
  },
  batchImportDraft: async (file: File): Promise<BatchImportDraftResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await request.post<BatchImportDraftResponse>(
        '/erp/draft/batchImport',
        formData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Excel导入失败：' + (error as Error).message);
    }
  },
  recognizeAudio: async (file: File): Promise<RecognizeAudioResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await request.post<RecognizeAudioResponse>(
        '/erp/draft/recognizeAudio',
        formData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('语音识别失败：' + (error as Error).message);
    }
  },
};