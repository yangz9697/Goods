import { useState, useEffect, useCallback } from 'react';

export const useScaleData = () => {
  const [scaleWeight, setScaleWeight] = useState(0);

  const startListening = useCallback(() => {
    // 模拟电子秤数据更新
    const timer = setInterval(() => {
      setScaleWeight(Math.random() * 100);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stopListening = useCallback(() => {
    // TODO: 实现停止监听
    console.log('停止监听电子秤数据');
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    scaleWeight,
    startListening,
    stopListening
  };
}; 