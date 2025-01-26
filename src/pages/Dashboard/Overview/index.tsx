import React from 'react';
import { Row, Col } from 'antd';
import SalesOverview from './components/SalesOverview';
import ProductConsumption from './components/ProductConsumption';

const DashboardOverview: React.FC = () => {
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
    </div>
  );
};

export default DashboardOverview; 