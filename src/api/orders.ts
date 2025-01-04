import request from './request';

// 使用统一的请求实例
export const someOrderApi = async () => {
  const response = await request.get('/some/endpoint');
  return response.data;
};

interface QueryObjectOrderRequest {
  startTime: number;
  endTime: number;
}

interface OrderInfo {
  orderNo: string;
  orderStatus: 'wait' | 'processing' | 'completed'; // 根据实际状态类型补充
  remark: string;
  isUrgent: boolean;
  updateTime: number;
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

export const updateOrderUrgent = async (data: UpdateOrderUrgentRequest): Promise<UpdateOrderUrgentResponse> => {
  try {
    const response = await request.post<UpdateOrderUrgentResponse>(
      '/erp/order/updateOrderUrgent',
      data
    );
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
      orderStatusCode: 'wait' | 'processing' | 'completed';
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

export const getOrderDetail = async (id: string) => {
  const response = await fetch(`http://139.224.63.0:8000/erp/orderObject/getObjectListByOrderNo?orderNo=${id}`, {
    headers: {
      'x-domain-id': '1000'
    }
  });
  return response.json();
}; 