import React from 'react';
import ReactECharts from 'echarts-for-react';

const Dashboard: React.FC = () => {
  const option = {
    title: {
      text: '销售统计'
    },
    tooltip: {},
    xAxis: {
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {},
    series: [{
      name: '销量',
      type: 'bar',
      data: [5, 20, 36, 10, 10, 20]
    }]
  };

  return (
    <div>
      <h2>数据概览</h2>
      <ReactECharts option={option} />
    </div>
  );
};

export default Dashboard; 