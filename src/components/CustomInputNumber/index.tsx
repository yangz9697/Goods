import React from 'react';
import { Input, Button } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

// 自定义 InputNumber 组件
interface CustomInputNumberProps {
  value?: number;
  onChange?: (value: number | null) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onButtonChange?: (value: number | null) => void; // 新增：按钮变化时的回调
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const CustomInputNumber: React.FC<CustomInputNumberProps> = ({
  value = 0,
  onChange,
  onFocus,
  onBlur,
  onButtonChange,
  min = 0,
  max,
  step = 1,
  precision,
  style,
  className,
  disabled = false,
  placeholder
}) => {
  const [inputValue, setInputValue] = React.useState<string>((value ?? 0).toString());
  
  // 同步外部 value 和内部 inputValue
  React.useEffect(() => {
    setInputValue((value ?? 0).toString());
  }, [value]);
  
  const handleIncrement = () => {
    if (disabled) return;
    const currentValue = value ?? 0;
    const newValue = currentValue + step;
    if (max === undefined || newValue <= max) {
      const finalValue = precision !== undefined ? Number(newValue.toFixed(precision)) : newValue;
      setInputValue(finalValue.toString());
      onChange?.(finalValue);
      onButtonChange?.(finalValue); // 触发按钮变化回调
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    const currentValue = value ?? 0;
    const newValue = currentValue - step;
    if (newValue >= min) {
      const finalValue = precision !== undefined ? Number(newValue.toFixed(precision)) : newValue;
      setInputValue(finalValue.toString());
      onChange?.(finalValue);
      onButtonChange?.(finalValue); // 触发按钮变化回调
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    
    if (newInputValue === '') {
      setInputValue('');
      onChange?.(null);
      return;
    }
    
    // 检查是否是有效的小数格式
    const decimalPattern = /^\d*\.?\d*$/;
    if (!decimalPattern.test(newInputValue)) {
      return; // 不是有效格式，不处理
    }
    
    // 如果有 precision 限制，检查小数位数
    if (precision !== undefined && precision >= 0) {
      const decimalPart = newInputValue.split('.')[1];
      if (decimalPart && decimalPart.length > precision) {
        return; // 小数位数超过限制，不处理
      }
    }
    
    setInputValue(newInputValue);
    
    const numValue = parseFloat(newInputValue);
    if (!isNaN(numValue)) {
      const finalValue = precision !== undefined ? Number(numValue.toFixed(precision)) : numValue;
      if (finalValue >= min && (max === undefined || finalValue <= max)) {
        onChange?.(finalValue);
      }
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', ...style }} className={className}>
      <Button
        type="text"
        icon={<MinusOutlined />}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        style={{ 
          width: '24px', 
          height: '24px', 
          minWidth: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: '12px',
          color: '#999',
          borderColor: 'transparent'
        }}
      />
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={(e) => {
          e.target.select();
          onFocus?.(e);
        }}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        style={{ 
          textAlign: 'center',
          flex: 1,
          minWidth: '60px'
        }}
      />
      <Button
        type="text"
        icon={<PlusOutlined />}
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        style={{ 
          width: '24px', 
          height: '24px', 
          minWidth: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: '12px',
          color: '#999',
          borderColor: 'transparent'
        }}
      />
    </div>
  );
};

export default CustomInputNumber;
