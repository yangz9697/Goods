import React from 'react';
import { Row, Col } from 'antd';
import SalesOverview from './components/SalesOverview';
import ProductConsumption from './Overview/components/ProductConsumption';
import PaymentOverview from './components/PaymentOverview';

const Dashboard: React.FC = () => {
  const isAdmin = localStorage.getItem('role') === 'admin';

  return (
    <div style={{ padding: '0 12px' }}>
      {/* 销售概览 */}
      <SalesOverview />

      {/* 商品消耗统计 */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <ProductConsumption />
        </Col>
      </Row>

      {/* 付款情况看板（仅管理员可见） */}
      {isAdmin && (
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <PaymentOverview />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard; 