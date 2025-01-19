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

interface DeleteOrderRequest {
  orderNo: string;
}

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
  orderStatusCode: 'add' | 'wait' | 'ready' | 'waitCheck' | 'end';
  orderStatusName: string;
}

interface GetOrderStatusResponse {
  success: boolean;
  data: OrderStatus[];
  displayMsg?: string;
}

export const getOrderAllStatus = async (): Promise<GetOrderStatusResponse> => {
  try {
    const response = await fetch('http://139.224.63.0:8000/erp/order/getOrderAllStatus', {
      headers: {
        'x-domain-id': '1000'
      }
    });
    return response.json();
  } catch (error) {
    throw new Error('获取订单状态列表失败：' + (error as Error).message);
  }
};

interface UpdateOrderStatusRequest {
  orderNo: string;
  orderStatusCode: 'add' | 'wait' | 'ready' | 'waitCheck' | 'end';
}

interface UpdateOrderStatusResponse {
  success: boolean;
  data: any;
  displayMsg?: string;
}

export const updateOrderStatus = async (params: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> => {
  try {
    const response = await fetch('http://139.224.63.0:8000/erp/order/updateOrderStatus', {
      method: 'POST',
      headers: {
        'x-domain-id': '1000',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    return response.json();
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