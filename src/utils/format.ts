export const formatPhone = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const generateOrderNumber = (date: string, customerId: string, orderCount: number) => {
  return `${date}${customerId}${orderCount.toString().padStart(2, '0')}`;
}; 