import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { OrderList } from '../../components/SupplyOrders/OrderList';
import { pageOrder } from '../../api/orders';
import { message, Card, DatePicker, Space, Button } from 'antd';
import dayjs from 'dayjs';
import type { OrderType } from '../../types/order';

interface OrderResponse {
  orderNo: string;
  orderStatusName: string;
  orderStatusCode: string;
  mobile: string;
  userName: string;
  createTime: number;
  remark: string;
  updateTime: number;
  orderObjectDetailList: Array<{
    objectDetailId: number;
    objectDetailName: string;
    amount: number | null;
    jin: number | null;
    box: number | null;
  }> | null;
}

const CustomerOrders: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(() => {
    const dateParam = searchParams.get('date');
    return dateParam ? dayjs(dateParam) : dayjs();
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await pageOrder({
        currentPage: 1,
        pageSize: 50,
        filters: {
          startTime: selectedDate.startOf('day').valueOf(),
          endTime: selectedDate.endOf('day').valueOf(),
          userId: Number(id)
        }
      });

      if (response.success) {
        const items = response.data.items.map((order: OrderResponse) => ({
          id: order.orderNo,
          orderNumber: order.orderNo,
          customerId: id,
          customerName: order.userName,
          customerPhone: order.mobile,
          status: order.orderStatusCode,
          statusName: order.orderStatusName,
          date: dayjs(order.createTime).format('YYYY-MM-DD'),
          createTime: dayjs(order.createTime).format('YYYY-MM-DD HH:mm:ss'),
          items: (order.orderObjectDetailList || []).map(item => ({
            id: String(item.objectDetailId),
            name: item.objectDetailName,
            quantity: item.amount || item.jin || item.box || 0,
            unit: item.amount ? 'piece' : item.jin ? 'jin' : 'box'
          })),
          remark: order.remark,
          isUrgent: false,
          deliveryStatus: order.orderStatusCode,
          deliveryPerson: '',
          updateTime: order.updateTime
        }));
        setOrders(items);
      } else {
        message.error(response.displayMsg || '获取供货单列表失败');
      }
    } catch (error) {
      message.error('获取供货单列表失败：' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [id, selectedDate]);

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      navigate(`/supply-orders/customer/${id}?date=${date.format('YYYY-MM-DD')}`);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            allowClear={false}
            disabled={isLoading}
          />
          <Button onClick={() => navigate('/supply-orders')} disabled={isLoading}>返回</Button>
        </Space>
      </Card>

      <OrderList
        orders={orders}
        selectedOrders={selectedOrders}
        filters={{
          dateRange: [selectedDate, selectedDate],
          searchText: '',
          searchPhone: ''
        }}
        loading={isLoading}
        onFiltersChange={() => {}}
        onOrderSelect={setSelectedOrders}
        onOrderEdit={(order) => {
          const params = new URLSearchParams({
            updateTime: order.updateTime.toString(),
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            orderStatusCode: order.status
          });
          
          navigate(`/supply-orders/order/${order.id}?${params.toString()}`);
        }}
        onOrderDelete={(id) => {
          // TODO: 实现删除功能
          console.log('删除订单:', id);
        }}
        onPrint={(ids) => console.log('打印订单:', ids)}
        onExport={(ids) => console.log('导出订单:', ids)}
        selectedCustomer={id ? {
          id,
          name: orders[0]?.customerName || ''
        } : null}
        onSuccess={fetchOrders}
      />
    </Space>
  );
};

export default CustomerOrders; 