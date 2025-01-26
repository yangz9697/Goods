import dayjs from 'dayjs';

// 生成最近7天的日期
const generateDates = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

// 生成随机销售额
const generateSales = () => {
  return Math.floor(Math.random() * 10000) / 100;
};

export const mockDashboardData = {
  // 总销售额
  totalSales: 15680.50,
  
  // 销售趋势数据
  salesTrend: generateDates().map(date => ({
    date,
    sales: generateSales()
  })),
  
  // 货品销售数据
  productSales: [
    { category: '蔬菜', sales: 3250.60 },
    { category: '水果', sales: 4521.30 },
    { category: '肉类', sales: 5680.20 },
    { category: '海鲜', sales: 2130.40 },
    { category: '日用品', sales: 1890.50 }
  ]
};

// 添加商品消耗数据
export const mockProductConsumption = {
  list: [
    {
      id: 1,
      name: '可乐',
      unit: '箱',
      consumption: 156,
      totalAmount: 4680.00,
      dailyData: generateDates().map(date => ({
        date,
        consumption: Math.floor(Math.random() * 30),
        sales: Math.floor(Math.random() * 1000)
      }))
    },
    {
      id: 2,
      name: '雪碧',
      unit: '箱',
      consumption: 142,
      totalAmount: 4260.00,
      dailyData: generateDates().map(date => ({
        date,
        consumption: Math.floor(Math.random() * 30),
        sales: Math.floor(Math.random() * 1000)
      }))
    },
    // ... 更多商品数据
  ]
};

// 生成随机订单
const generateOrders = (month: number) => {
  const orders = [];
  const daysInMonth = month === 2 ? 28 : 30;
  const orderCount = Math.floor(Math.random() * 5) + 3; // 每月3-7个订单

  for (let i = 0; i < orderCount; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const date = `2024-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const amount = Math.floor(Math.random() * 2000) + 500; // 500-2500的随机金额
    
    orders.push({
      id: `${month}-${i + 1}`,
      date,
      amount: amount,
      status: Math.random() > 0.6 ? 'paid' : 'unpaid', // 60%概率已付款
    });
  }

  return orders;
};

// 生成月度数据
const generateMonthlyDetails = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const orders = generateOrders(i + 1);
    const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
    const paidAmount = orders
      .filter(order => order.status === 'paid')
      .reduce((sum, order) => sum + order.amount, 0);

    return {
      month: i + 1,
      paid: paidAmount,
      unpaid: totalAmount - paidAmount,
      orders,
    };
  });
};

// 添加付款情况数据
export const mockPaymentData = {
  list: [
    {
      id: 1,
      name: '张三',
      mobile: '13800138000',
      remark: '重要客户',
      totalAmount: 15680.50,
      unpaidAmount: 5680.50,
      paidAmount: 10000.00,
      monthlyDetails: generateMonthlyDetails()
    },
    {
      id: 2,
      name: '李四',
      mobile: '13900139000',
      remark: '老客户',
      totalAmount: 12450.80,
      unpaidAmount: 3450.80,
      paidAmount: 9000.00,
      monthlyDetails: generateMonthlyDetails()
    },
    {
      id: 3,
      name: '王五',
      mobile: '13700137000',
      remark: '新客户',
      totalAmount: 8920.30,
      unpaidAmount: 8920.30,
      paidAmount: 0.00,
      monthlyDetails: generateMonthlyDetails()
    },
    {
      id: 4,
      name: '赵六',
      mobile: '13600136000',
      remark: '批发客户',
      totalAmount: 25680.90,
      unpaidAmount: 0.00,
      paidAmount: 25680.90,
      monthlyDetails: generateMonthlyDetails()
    },
    {
      id: 5,
      name: '钱七',
      mobile: '13500135000',
      remark: '零售客户',
      totalAmount: 3680.20,
      unpaidAmount: 1680.20,
      paidAmount: 2000.00,
      monthlyDetails: generateMonthlyDetails()
    },
    {
      id: 6,
      name: '孙八',
      mobile: '13400134000',
      remark: '批发客户',
      totalAmount: 19850.60,
      unpaidAmount: 9850.60,
      paidAmount: 10000.00,
      monthlyDetails: generateMonthlyDetails()
    }
  ]
}; 