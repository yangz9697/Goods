import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { orderApi } from '@/api/orders';
import { orderObjectApi, AddOrderObjectRequest } from '@/api/orderObject';
import { OrderStatusMap, OrderStatusCode, Order, OrderDetailItem } from '@/types/order';

// 创建本地状态列表常量
const STATUS_LIST = Object.entries(OrderStatusMap).map(([code, name]) => ({
  orderStatusCode: code as OrderStatusCode,
  orderStatusName: name
}));

export const useOrderDetail = (orderNo: string | undefined) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryUsers, setDeliveryUsers] = useState<{ label: string; value: string }[]>([]);

  // 分离配货员获取函数
  const fetchDeliveryUsers = useCallback(async () => {
    try {
      const deliveryRes = await orderApi.selectDelivery();
      if (deliveryRes?.success) {
        setDeliveryUsers(deliveryRes.data.map(user => ({
          label: user.name,
          value: user.username
        })));
      }
    } catch (error) {
      console.error('获取配送人员失败:', error);
    }
  }, []);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderNo) return;
    
    try {
      const orderRes = await orderApi.getOrderInfo(orderNo);
      if (!orderRes.success) {
        message.error(orderRes.displayMsg || '获取供货单详情失败');
        return;
      }

      setOrder({
        id: orderNo,
        orderNo: orderNo,
        date: orderRes.data.orderSupplyDate,
        createTime: orderRes.data.createTime || '',
        customerName: orderRes.data.userName,
        customerPhone: orderRes.data.userMobile,
        status: orderRes.data.orderStatus,
        statusName: orderRes.data.orderStatusName,
        remark: orderRes.data.remark,
        items: (orderRes.data.objectInfoList || []).map((item): OrderDetailItem => ({
          id: `item-${item.objectDetailId}`,
          name: item.objectDetailName,
          planCount: item.planCount,
          remarkCount: item.remarkCount,
          count: item.count,
          unit: item.unitName,
          price: item.price,
          unitPrice: item.unitPrice,
          remark: item.remark,
          deliveryName: item.deliveryName || '',
          objectDetailId: item.objectDetailId,
          totalPrice: item.totalPrice,
          orderNo: orderRes.data.orderNo,
          userName: orderRes.data.userName,
          mobile: orderRes.data.userMobile,
          orderStatusCode: orderRes.data.orderStatus,
          orderStatusName: orderRes.data.orderStatusName,
          createTime: item.createTime,
          updateTime: item.updateTime,
        })),
        payStatusName: orderRes.data.payStatusName,
        totalPrice: orderRes.data.orderTotalPrice || 0
      });
    } catch (error) {
      message.error('获取订单详情失败：' + (error as Error).message);
    }
  }, [orderNo]);

  useEffect(() => {
    fetchDeliveryUsers();
  }, [fetchDeliveryUsers]);

  useEffect(() => {
    fetchOrderDetail();
    const timer = setInterval(() => {
      fetchOrderDetail();
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchOrderDetail]);

  const handleAdd = async (values: Omit<AddOrderObjectRequest, 'orderNo'>) => {
    try {
      const response = await orderObjectApi.addOrderObject({
        ...values,
        orderNo: orderNo!
      });

      if (response.success) {
        message.success('添加成功');
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '添加失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleDeleteItem = async (objectDetailId: number) => {
    try {
      const response = await orderObjectApi.deleteOrderObject({
        objectDetailId,
        orderNo: orderNo!
      });

      if (response.success) {
        message.success('删除成功');
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '删除失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleEdit = async (values: {
    count: number;
    objectDetailId: number;
    price: number;
    totalPrice?: number;
    remark: string;
    unitName?: string;
    deliveryName?: string;
  }) => {
    try {
      const currentItem = order?.items.find(item => item.objectDetailId === values.objectDetailId);
      const response = await orderObjectApi.updateOrderObject({
        ...values,
        orderNo: orderNo!,
        objectDetailName: currentItem?.name || '',
        unitName: values.unitName || currentItem?.unit || '斤'
      });

      if (response.success) {
        message.success('编辑成功');
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '编辑失败');
      }
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleStatusChange = async (statusCode: OrderStatusCode) => {
    try {
      const response = await orderApi.updateOrderStatus({
        orderNo: orderNo!,
        orderStatusCode: statusCode
      });
      
      if (response.success) {
        message.success('更新状态成功');
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '更新状态失败');
      }
    } catch (error) {
      message.error('更新状态失败：' + (error as Error).message);
    }
  };

  const handleUpdatePayStatus = async (statusCode: 'waitPay' | 'paySuccess') => {
    try {
      const response = await orderApi.updateOrderPayStatus({
        orderNo: orderNo!,
        orderPayStatusCode: statusCode
      });
      
      if (response.success) {
        message.success('更新支付状态成功');
        fetchOrderDetail();
      } else {
        message.error(response.displayMsg || '更新支付状态失败');
      }
    } catch (error) {
      message.error('更新支付状态失败：' + (error as Error).message);
    }
  };

  return {
    order,
    statusList: STATUS_LIST,
    deliveryUsers,
    handleAdd,
    handleEdit,
    handleDeleteItem,
    handleStatusChange,
    handleUpdatePayStatus
  };
}; 