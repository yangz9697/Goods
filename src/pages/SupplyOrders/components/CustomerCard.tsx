import { useState, useEffect } from 'react';
import { Card, List, Button, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { pageOrder } from '@/api/orders';
import dayjs from 'dayjs';

interface CustomerCardProps {
  customer: {
    id: number;
    name: string;
    phone: string;
  };
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const now = dayjs();
      const response = await pageOrder({
        currentPage: 1,
        pageSize: 5,
        filters: {
          startTime: now.startOf('day').valueOf(),
          endTime: now.endOf('day').valueOf(),
          userId: customer.id
        }
      });
      if (response.success) {
        setOrders(response.data.items);
      }
    } catch (error) {
      console.error('获取供货单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [customer.id]);

  const handleCardClick = () => {
    navigate(`/supply-orders/${customer.id}`);
  };

  const handleUrgentClick = async (orderNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: 实现加急功能
  };

  return (
    <Card 
      title={`${customer.name} (${customer.phone})`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer', marginBottom: 16 }}
    >
      <List
        loading={loading}
        dataSource={orders}
        renderItem={(order) => (
          <List.Item
            actions={[
              <Button 
                type="link" 
                onClick={(e) => handleUrgentClick(order.orderNo, e)}
                disabled={order.isUrgent}
              >
                {order.isUrgent ? '已加急' : '加急'}
              </Button>
            ]}
          >
            <List.Item.Meta
              title={order.orderNo}
              description={
                <>
                  <div>状态: {order.orderStatus}</div>
                  <div>备注: {order.remark}</div>
                  <div>更新时间: {dayjs(order.updateTime).format('YYYY-MM-DD HH:mm:ss')}</div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}; 