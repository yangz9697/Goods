import { useState, useCallback } from 'react';
import { message } from 'antd';
import { orderApi } from '@/api/orders';
import { orderObjectApi, AddOrderObjectRequest } from '@/api/orderObject';
import { OrderStatusMap, OrderStatusCode, Order } from '@/types/order';

// 创建本地状态列表常量
const STATUS_LIST = Object.entries(OrderStatusMap).map(([code, name]) => ({
  orderStatusCode: code as OrderStatusCode,
  orderStatusName: name
}));

export const useOrderDetail = (orderNo: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryUsers, setDeliveryUsers] = useState<{ label: string; value: string }[]>([]);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderNo) return;
    setLoading(true);
    
    try {
      // 获取订单基本信息
      const orderRes = await orderApi.getOrderInfo(orderNo);
      if (!orderRes.success) {
        message.error(orderRes.displayMsg || '获取供货单详情失败');
        return;
      }

      // 获取订单商品列表
      const itemsRes = await orderObjectApi.getObjectListByOrderNo(orderNo);
      if (!itemsRes.success) {
        message.error(itemsRes.displayMsg || '获取订单商品失败');
        return;
      }

      // 获取配送人员数据
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

      // 整合数据
      setOrder({
        id: orderNo,
        orderNo: orderNo,
        date: orderRes.data.orderSupplyDate,
        createTime: orderRes.data.createTime,
        customerName: orderRes.data.userName,
        customerPhone: orderRes.data.userMobile,
        status: orderRes.data.orderStatus,
        statusName: orderRes.data.orderStatusName,
        remark: orderRes.data.remark,
        items: (itemsRes.data?.objectInfoList || []).map((item) => ({
          id: `item-${item.objectDetailId}`,
          name: item.objectDetailName,
          quantity: item.count,
          unit: item.unitName,
          price: item.price,
          unitPrice: item.unitPrice,
          remark: item.remark,
          deliveryName: item.deliveryName || undefined,
          objectDetailId: item.objectDetailId,
          totalPrice: item.totalPrice
        })),
        totalPrice: itemsRes.data?.orderTotalPrice || 0
      });
      console.log(order);

    } catch (error) {
      message.error('获取订单详情失败：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orderNo]);

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
    loading,
    order,
    statusList: STATUS_LIST,  // 直接返回常量
    deliveryUsers,
    fetchOrderDetail,
    handleAdd,
    handleDeleteItem,
    handleEdit,
    handleStatusChange,
    handleUpdatePayStatus,
    setOrder,
    setDeliveryUsers
  };
}; 