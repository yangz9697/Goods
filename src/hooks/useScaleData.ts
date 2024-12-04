import { useState, useEffect, useCallback } from 'react';

export const useScaleData = () => {
  const [scaleWeight, setScaleWeight] = useState(0);

  const startListening = useCallback(() => {
    // TODO: 实现电子秤数据监听
    console.log('开始监听电子秤数据');
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