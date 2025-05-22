import React from 'react';
import styled from 'styled-components';

// 注意：这里移除了 styled-components 的 keyframes 和 animation，
// 如果需要闪烁效果，可以在全局 CSS 中定义或者选择其他方式。

const DisplayWrapper = styled.div`
  display: flex;
  align-items: center;
  /* 调整数字块之间的间距 */
  gap: 8px; /* 增加间距 */
  /* 移除这里的背景和内边距，由外部容器控制 */
`;

const DigitBlock = styled.div`
  font-family: 'Digital-7', monospace;
  font-size: 36px; /* 增大数字大小 */
  color: #fff; /* 数字颜色为白色 */
  /* 蓝色背景块颜色，使用图片中的蓝色调 */
  background-color: rgba(255, 255, 255, 0.1); /* 使用一个近似的蓝色 */
  padding: 12px 8px; /* 调整内边距 */
  border-radius: 4px; /* 增加圆角 */
  text-align: center;
  /* 固定宽度确保对齐，根据字体大小调整 */
  width: 48px; /* 调整宽度 */
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DecimalPoint = styled.div`
  /* 小数点样式，更像一个白色圆点 */
  width: 10px; /* 调整宽度 */
  height: 10px; /* 调整高度 */
  background-color: #fff; /* 小数点颜色为白色 */
  border-radius: 50%; /* 圆形 */
  margin: 0 4px; /* 调整与数字块的间距 */
  align-self: flex-end; /* 底部对齐 */
  margin-bottom: 16px; /* 根据字体大小调整垂直位置 */
`;

interface DigitalDisplayProps {
  value: number | string;
  className?: string; // 允许外部传递样式类
}

const DigitalDisplay: React.FC<DigitalDisplayProps> = ({ 
  value,
  className
}) => {
  // 确保值为字符串，并处理小数点
  // 假设需要固定显示两位小数，根据实际需求调整 toFixed 参数
  const valueStr = typeof value === 'number' ? value.toFixed(2) : String(value);
  const characters = valueStr.split('');

  return (
    <DisplayWrapper className={className}>
      {characters.map((char, index) => {
        if (char === '.') {
          return <DecimalPoint key={index} />;
        }
        return <DigitBlock key={index}>{char}</DigitBlock>;
      })}
    </DisplayWrapper>
  );
};

export default DigitalDisplay; 