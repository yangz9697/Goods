import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Row, Col, Select, Space, Button, Popconfirm, message, Modal, Input, InputNumber, Table, Tag } from 'antd';
import { formatPhone } from '@/utils/format';
import dayjs from 'dayjs';
import { Order, OrderStatus, OrderStatusCode } from '@/types/order';
import { orderApi, RecognizedDraftItem } from '@/api/orders';
import { orderObjectApi } from '@/api/orderObject';
import { PrinterOutlined } from '@ant-design/icons';
import DigitalDisplay from '@/components/DigitalDisplay';

// 扩展 Order 类型，确保包含所有需要的属性
interface ExtendedOrder extends Order {
  orderNo: string;
  date: string;
  createTime: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatusCode;
  statusName: string;
  payStatusName: string;
  payStatus: 'waitPay' | 'paySuccess';
  totalPrice: number;
  id: string;  // 改为只接受 string 类型
  deliveryCount: number;
  totalObjectCount: number;
}

interface OrderHeaderProps {
  order: ExtendedOrder;
  statusList: OrderStatus[];
  isAdmin: boolean;
  onStatusChange: (status: OrderStatusCode) => void;
  onPayStatusChange: (status: 'waitPay' | 'paySuccess') => void;
  onDeleteSuccess: () => void;
  onWeightChange: (weight: string) => void;
}

interface EditableDraftItem extends RecognizedDraftItem {
  key: string;
}

interface ObjectSearchOption {
  objectDetailId: number;
  objectDetailName: string;
}

const UNIT_OPTIONS = [
  { label: '个', value: '个' },
  { label: '斤', value: '斤' },
  { label: '盒', value: '盒' },
  { label: '箱', value: '箱' }
];

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  statusList,
  isAdmin,
  onStatusChange,
  onPayStatusChange,
  onDeleteSuccess,
  onWeightChange
}) => {
  const [weight, setWeight] = useState<string>('000.0');
  const [port, setPort] = useState<SerialPort | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTextInputModalOpen, setIsTextInputModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [textInputValue, setTextInputValue] = useState<string>('');
  const [isRecognizingText, setIsRecognizingText] = useState<boolean>(false);
  const [isImportingExcel, setIsImportingExcel] = useState<boolean>(false);
  const [isRecognizingAudio, setIsRecognizingAudio] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [isDraftConfirmModalOpen, setIsDraftConfirmModalOpen] = useState<boolean>(false);
  const [isConfirmingDraft, setIsConfirmingDraft] = useState<boolean>(false);
  const [recognizedDraftItems, setRecognizedDraftItems] = useState<EditableDraftItem[]>([]);
  const [objectSearchOptions, setObjectSearchOptions] = useState<ObjectSearchOption[]>([]);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(44100);
  const recordedAudioBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<number | null>(null);
  const shouldAutoSubmitOnStopRef = useRef<boolean>(false);

  // 清理函数
  const cleanup = useCallback(async () => {
    try {
      if (readerRef.current) {
        try {
          await readerRef.current.releaseLock();
        } catch (error) {
          console.error('释放 reader 失败:', error);
        }
        readerRef.current = null;
      }
      if (port) {
        try {
          if (port.readable) {
            await port.close();
          }
        } catch (error) {
          console.error('关闭串口失败:', error);
        }
        setPort(null);
      }
      setIsConnected(false);
    } catch (error) {
      console.error('清理过程出错:', error);
    }
  }, [port]);

  // 初始化串口连接
  const initSerialPort = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log('正在连接中，跳过重复连接');
      return;
    }

    try {
      isConnectingRef.current = true;

      // 先检查是否已经有打开的串口
      const ports = await navigator.serial.getPorts();
      let serialPort = ports[0];

      if (!serialPort) {
        console.log('没有已授权的串口，请求用户选择...');
        try {
          serialPort = await navigator.serial.requestPort();
        } catch (error) {
          console.error('用户取消选择串口:', error);
          return;
        }
      }

      // 检查串口是否已经打开
      if (serialPort.readable) {
        console.log('串口已经打开，直接使用');
        setPort(serialPort);
        setIsConnected(true);
        startReading(serialPort);
        return;
      }

      console.log('正在打开串口...');
      try {
        await serialPort.open({ 
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });
      } catch (error) {
        console.error('打开串口失败:', error);
        if (error instanceof DOMException) {
          if (error.message.includes('already open')) {
            console.log('串口已经打开，继续使用');
            setPort(serialPort);
            setIsConnected(true);
            startReading(serialPort);
            return;
          }
        }
        throw error;
      }

      setPort(serialPort);
      setIsConnected(true);
      startReading(serialPort);
    } catch (error) {
      console.error('初始化串口失败:', error);
      if (error instanceof DOMException) {
        if (error.name === 'NetworkError') {
          message.error('串口连接失败，请检查设备连接或重新选择串口');
        } else if (error.name === 'SecurityError') {
          message.error('没有串口访问权限，请检查浏览器设置');
        } else {
          message.error(`连接失败: ${error.message}`);
        }
      } else {
        message.error('连接电子秤失败，请检查设备连接');
      }
      setIsConnected(false);
      await cleanup();
    } finally {
      isConnectingRef.current = false;
    }
  }, [cleanup]);

  const startReading = async (serialPort: SerialPort) => {
    if (!serialPort.readable) {
      console.error('串口不可读');
      message.error('串口不可读，请重新连接');
      setIsConnected(false);
      return;
    }

    try {
      readerRef.current = serialPort.readable.getReader();
      
      let buffer = '';
      const textDecoder = new TextDecoder();

      while (true) {
        const { value, done } = await readerRef.current.read();
        if (done) {
          console.log('串口已断开');
          message.error('串口连接已断开，请重新连接');
          setIsConnected(false);
          break;
        }
        
        if (value) {
          const chunk = textDecoder.decode(value, { stream: true });
          buffer += chunk;

          // 尝试从缓冲中提取多个帧
          while (buffer.length >= 18) {
            const start = buffer.indexOf('ST');

            if (start === -1) {
              // 没有起始标志，丢弃前缀
              buffer = '';
              break;
            }

            // 如果剩余数据不足一帧，等待更多数据
            if (start + 18 > buffer.length) break;

            const potentialFrame = buffer.slice(start, start + 18);

            if (potentialFrame.endsWith('kg\r\n') || potentialFrame.endsWith('kg\r')) {
              console.log('收到完整数据帧:', potentialFrame);

              // 提取重量字符串
              const weightStr = potentialFrame.slice(8, 14).trim();
              const weight = parseFloat(weightStr);

              if (!isNaN(weight)) {
                const newWeight = (weight * 2).toFixed(1);
                setWeight(newWeight);
                onWeightChange(newWeight);
                console.log(`解析重量: ${newWeight}斤`);
              }
            } else {
              console.warn('发现无效数据帧:', potentialFrame, '16进制:', Array.from(potentialFrame).map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join(' '));
            }

            // 移除已处理内容
            buffer = buffer.slice(start + 18);
          }
        }
      }
    } catch (error) {
      console.error('读取串口数据失败:', error);
      // 只有在特定错误时才显示重新连接
      if (error instanceof DOMException && 
          (error.message.includes('The port is closed') || 
           error.message.includes('The port is not open'))) {
        message.error('串口连接已断开，请重新连接');
        setIsConnected(false);
      }
    } finally {
      if (readerRef.current) {
        try {
          await readerRef.current.releaseLock();
        } catch (error) {
          console.error('释放 reader 失败:', error);
        }
        readerRef.current = null;
      }
    }
  };

  useEffect(() => {
    initSerialPort();
    return () => {
      cleanup();
    };
  }, [initSerialPort, cleanup]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      try {
        scriptProcessorRef.current?.disconnect();
        sourceNodeRef.current?.disconnect();
        audioContextRef.current?.close();
      } catch (error) {
        console.error('卸载时清理录音资源失败:', error);
      }
    };
  }, []);

  // 手动重连函数
  const handleReconnect = useCallback(async () => {
    try {
      await cleanup();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const ports = await navigator.serial.getPorts();
        for (const port of ports) {
          try {
            await port.forget();
          } catch (error) {
            console.error('清除串口权限失败:', error);
          }
        }
      } catch (error) {
        console.error('获取已授权串口失败:', error);
      }
      
      await initSerialPort();
    } catch (error) {
      console.error('重新连接失败:', error);
      message.error('重新连接失败，请检查设备连接');
    }
  }, [cleanup, initSerialPort]);

  const handleDeleteOrder = async () => {
    try {
      const response = await orderApi.deleteOrder(order.orderNo);
      if (response.success) {
        onDeleteSuccess();
      } else {
        message.error(response.displayMsg || '删除供货单失败');
      }
    } catch (error) {
      message.error('删除供货单失败：' + (error as Error).message);
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await orderApi.printOrderToPDF(order.orderNo);
      const url = window.URL.createObjectURL(blob);
      
      // 创建一个隐藏的 iframe
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);
      
      // 监听 iframe 加载完成
      printFrame.onload = () => {
        try {
          // 延迟更长时间确保 PDF 完全渲染
          setTimeout(() => {
            if (printFrame.contentWindow) {
              // 监听打印对话框关闭
              const mediaQueryList = window.matchMedia('print');
              const handlePrintChange = (e: MediaQueryListEvent) => {
                if (!e.matches) {  // 打印对话框关闭
                  mediaQueryList.removeEventListener('change', handlePrintChange);
                  document.body.removeChild(printFrame);
                  window.URL.revokeObjectURL(url);
                }
              };
              mediaQueryList.addEventListener('change', handlePrintChange);

              // 触发打印
              printFrame.contentWindow.print();
            }
          }, 1000);  // 增加延时到 1 秒
        } catch (error) {
          message.error('打印失败：' + (error as Error).message);
          document.body.removeChild(printFrame);
          window.URL.revokeObjectURL(url);
        }
      };

      // 设置 iframe 的 src
      printFrame.src = url;
    } catch (error) {
      message.error('打印失败：' + (error as Error).message);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await orderApi.exportOrderToExcel(order.orderNo);
      const url = window.URL.createObjectURL(blob);
      
      // 创建一个隐藏的 a 标签来下载文件
      const link = document.createElement('a');
      link.href = url;
      link.download = `${order.customerName}${order.date}.xlsx`;  // 设置下载文件名
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      message.error('导出失败：' + (error as Error).message);
    }
  };

  const openDraftConfirmModal = (items: RecognizedDraftItem[]) => {
    setRecognizedDraftItems(
      (items || []).map((item, index) => ({
        ...item,
        key: `${Date.now()}-${index}`
      }))
    );
    setIsDraftConfirmModalOpen(true);
  };

  const handleTextInputSubmit = async () => {
    const text = textInputValue.trim();
    if (!text) {
      message.warning('请输入文字内容');
      return;
    }

    try {
      setIsRecognizingText(true);
      const response = await orderApi.recognizeText(text);
      if (response.success) {
        message.success(response.displayMsg || `文字识别成功，共${response.data?.length || 0}条`);
        setIsTextInputModalOpen(false);
        setTextInputValue('');
        openDraftConfirmModal(response.data || []);
      } else {
        message.error(response.displayMsg || '文字识别提交失败');
      }
    } catch (error) {
      message.error((error as Error).message || '文字识别提交失败');
    } finally {
      setIsRecognizingText(false);
    }
  };

  const handleExcelImportClick = () => {
    excelFileInputRef.current?.click();
  };

  const handleExcelFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsImportingExcel(true);
      const response = await orderApi.batchImportDraft(file);
      if (response.success) {
        message.success(response.displayMsg || `Excel导入成功，共${response.data?.length || 0}条`);
        openDraftConfirmModal(response.data || []);
      } else {
        message.error(response.displayMsg || 'Excel导入失败');
      }
    } catch (error) {
      message.error((error as Error).message || 'Excel导入失败');
    } finally {
      setIsImportingExcel(false);
    }
  };

  const stopAudioRecording = (autoSubmit = false) => {
    shouldAutoSubmitOnStopRef.current = autoSubmit;
    try {
      scriptProcessorRef.current?.disconnect();
      sourceNodeRef.current?.disconnect();
      audioContextRef.current?.close();
    } catch (error) {
      console.error('停止PCM录音失败:', error);
    }

    const pcmBlob = buildWavBlobFromPcm();
    recordedAudioBlobRef.current = pcmBlob;
    pcmChunksRef.current = [];
    if (shouldAutoSubmitOnStopRef.current) {
      shouldAutoSubmitOnStopRef.current = false;
      uploadRecordedAudio(pcmBlob);
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    audioContextRef.current = null;
    scriptProcessorRef.current = null;
    sourceNodeRef.current = null;
    setIsRecording(false);
  };

  const buildWavBlobFromPcm = () => {
    const pcmData = pcmChunksRef.current;
    const sampleRate = sampleRateRef.current || 44100;
    const totalLength = pcmData.reduce((sum, arr) => sum + arr.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    pcmData.forEach((chunk) => {
      merged.set(chunk, offset);
      offset += chunk.length;
    });

    const buffer = new ArrayBuffer(44 + merged.length * 2);
    const view = new DataView(buffer);

    const writeString = (pos: number, str: string) => {
      for (let i = 0; i < str.length; i += 1) {
        view.setUint8(pos + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + merged.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, merged.length * 2, true);

    let index = 44;
    for (let i = 0; i < merged.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, merged[i]));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      index += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      message.error('当前浏览器不支持录音');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('当前浏览器不支持AudioContext，无法录音');
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      sampleRateRef.current = audioContext.sampleRate;
      pcmChunksRef.current = [];

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (event: AudioProcessingEvent) => {
        const inputData = event.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(inputData));
      };

      sourceNode.connect(processor);
      processor.connect(audioContext.destination);
      recordedAudioBlobRef.current = null;
      setRecordSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 59) {
            stopAudioRecording(true);
            message.info('录音已达到60秒，已自动停止');
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      message.error('无法开始录音：' + (error as Error).message);
    }
  };

  const uploadRecordedAudio = async (inputBlob?: Blob) => {
    const blob = inputBlob || recordedAudioBlobRef.current;
    if (!blob) {
      message.warning('请先完成录音');
      return;
    }
    try {
      setIsRecognizingAudio(true);
      const extension = blob.type.includes('wav')
        ? 'wav'
        : blob.type.includes('webm')
          ? 'webm'
          : 'audio';
      const audioFile = new File([blob], `audio-${Date.now()}.${extension}`, {
        type: blob.type || 'audio/wav'
      });

      const response = await orderApi.recognizeAudio(audioFile);
      if (response.success) {
        message.success(response.displayMsg || `语音识别成功，共${response.data?.length || 0}条`);
        setIsVoiceModalOpen(false);
        openDraftConfirmModal(response.data || []);
      } else {
        message.error(response.displayMsg || '语音识别失败');
      }
    } catch (error) {
      message.error((error as Error).message || '语音识别失败');
    } finally {
      setIsRecognizingAudio(false);
    }
  };

  const handleDraftFieldChange = (
    key: string,
    field: keyof RecognizedDraftItem,
    value: string | number
  ) => {
    setRecognizedDraftItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteDraftRow = (key: string) => {
    setRecognizedDraftItems((prev) => prev.filter((item) => item.key !== key));
    message.success('已删除该行');
  };

  const searchObjects = async (keyword: string) => {
    if (!keyword) {
      setObjectSearchOptions([]);
      return;
    }
    try {
      const response = await orderObjectApi.selectObjectByName(keyword);
      if (response.success) {
        setObjectSearchOptions(response.data || []);
      } else {
        message.error(response.displayMsg || '搜索商品失败');
      }
    } catch (error) {
      message.error('搜索商品失败：' + (error as Error).message);
    }
  };

  const handleSelectDraftObject = (key: string, objectDetailId: number, objectDetailName: string) => {
    setRecognizedDraftItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              serviceObjectId: objectDetailId,
              serviceObjectName: objectDetailName
            }
          : item
      )
    );
  };

  const handleAddEmptyDraftRow = () => {
    setRecognizedDraftItems((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        serviceObjectId: 0,
        serviceObjectName: '',
        totalCount: 0,
        unitName: '',
        remark: '',
        remarkCount: ''
      }
    ]);
  };

  const handleClearAllDraftRows = () => {
    setRecognizedDraftItems([]);
    message.success('已清空全部');
  };

  const handleConfirmDraft = async () => {
    if (recognizedDraftItems.length === 0) {
      message.warning('请先添加草稿条目');
      return;
    }

    try {
      setIsConfirmingDraft(true);
      const items = recognizedDraftItems.map(({ key, ...item }) => item);
      const response = await orderApi.confirmDraft({
        orderNo: order.orderNo,
        items
      });

      if (response.success) {
        message.success(response.displayMsg || '草稿确认成功');
        setIsDraftConfirmModalOpen(false);
      } else {
        message.error(response.displayMsg || '草稿确认失败');
      }
    } catch (error) {
      message.error((error as Error).message || '草稿确认失败');
    } finally {
      setIsConfirmingDraft(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 第一块：客户信息和操作按钮 */}
      <div style={{ 
        background: '#fff',
        borderRadius: '4px',
        padding: '12px'
      }}>
        <Form layout="inline" style={{ width: '100%' }}>
          <Row style={{ width: '100%', alignItems: 'center' }}>
            {/* 左侧 Logo */}
            <Col>
              <img 
                src="/avatar.png"
                alt="logo" 
                style={{ 
                  width: 48, 
                  height: 48,
                  marginRight: 16
                }} 
              />
            </Col>

            {/* 中间客户信息和日期信息 */}
            <Col flex="auto">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {/* 客户信息行 */}
                <div>
                  <span style={{ 
                    fontSize: '14px',
                    color: '#666',
                    marginRight: '8px'
                  }}>
                    客户信息：
                  </span>
                  <span style={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1890ff'
                  }}>
                    {order.customerName + formatPhone(order.customerPhone)}
                  </span>
                </div>
                {/* 日期信息行 */}
                <div>
                  <Space size={16}>
                    <div>
                      <span style={{ 
                        fontSize: '14px',
                        color: '#666',
                        marginRight: '8px'
                      }}>
                        供货日期：
                      </span>
                      <span style={{ 
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        {order.date}
                      </span>
                    </div>
                    <div>
                      <span style={{ 
                        fontSize: '14px',
                        color: '#666',
                        marginRight: '8px'
                      }}>
                        下单日期：
                      </span>
                      <span style={{ 
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        {order.createTime ? dayjs(order.createTime).format('YYYY-MM-DD') : ''}
                      </span>
                    </div>
                  </Space>
                </div>
              </Space>
            </Col>

            {/* 右侧操作按钮 */}
            <Col>
              <Space>
                <Button loading={isImportingExcel} onClick={handleExcelImportClick}>Excel导入</Button>
                <Button onClick={() => setIsVoiceModalOpen(true)}>语音输入</Button>
                <Button onClick={() => setIsTextInputModalOpen(true)}>文字输入</Button>
                <Button 
                  type="primary" 
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                >
                  打印
                </Button>
                <Button onClick={handleExport}>导出</Button>
                <Popconfirm
                  title="确定要删除这个供货单吗？"
                  onConfirm={handleDeleteOrder}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger>删除</Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Form>
        <input
          ref={excelFileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleExcelFileChange}
        />
      </div>
      <Modal
        title="语音输入"
        open={isVoiceModalOpen}
        onCancel={() => {
          if (!isRecognizingAudio) {
            stopAudioRecording(false);
            setIsVoiceModalOpen(false);
          }
        }}
        footer={[
          <Button
            key="record"
            onClick={() => {
              if (isRecording) {
                stopAudioRecording(true);
              } else {
                startAudioRecording();
              }
            }}
            disabled={isRecognizingAudio}
          >
            {isRecording ? '停止录音' : '开始录音'}
          </Button>,
          <Button key="submit" type="primary" onClick={() => uploadRecordedAudio()} loading={isRecognizingAudio}>
            手动提交
          </Button>
        ]}
        destroyOnClose
      >
        <div style={{ lineHeight: 1.8 }}>
          <div>录音时长：{recordSeconds}s / 60s</div>
          <div>状态：{isRecording ? '录音中...' : recordedAudioBlobRef.current ? '录音完成，可提交' : '未开始录音'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>录音限制60秒，超过会自动停止。</div>
        </div>
      </Modal>
      <Modal
        title="文字输入"
        open={isTextInputModalOpen}
        onCancel={() => {
          if (!isRecognizingText) {
            setIsTextInputModalOpen(false);
          }
        }}
        onOk={handleTextInputSubmit}
        okText="提交"
        cancelText="取消"
        confirmLoading={isRecognizingText}
        destroyOnClose
      >
        <Input.TextArea
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          rows={6}
          placeholder="请输入需要识别的文字"
          maxLength={3000}
          showCount
          disabled={isRecognizingText}
        />
      </Modal>
      <Modal
        title={
          <Space size={16}>
            <span>确认录入清单</span>
            <Tag color="blue">共识别 {recognizedDraftItems.length} 条</Tag>
            <Tag color={recognizedDraftItems.length > 0 ? 'green' : 'default'}>
              可确认 {recognizedDraftItems.length} 条
            </Tag>
          </Space>
        }
        open={isDraftConfirmModalOpen}
        onCancel={() => setIsDraftConfirmModalOpen(false)}
        width={1100}
        footer={[
          <Space key="left-actions">
            <Button onClick={handleAddEmptyDraftRow}>新增一行</Button>
            <Popconfirm
              title="确认清空"
              description="确定要清空所有草稿行吗？"
              okText="清空"
              cancelText="取消"
              onConfirm={handleClearAllDraftRows}
            >
              <Button danger>清空全部</Button>
            </Popconfirm>
          </Space>,
          <Button
            key="confirm"
            type="primary"
            disabled={recognizedDraftItems.length === 0}
            loading={isConfirmingDraft}
            onClick={handleConfirmDraft}
          >
            确认录入
          </Button>,
          <Button key="cancel" onClick={() => setIsDraftConfirmModalOpen(false)}>
            关闭
          </Button>
        ]}
        destroyOnClose
      >
        <Table<EditableDraftItem>
          rowKey="key"
          dataSource={recognizedDraftItems}
          pagination={false}
          scroll={{ y: 420 }}
          columns={[
            {
              title: '行',
              width: 60,
              render: (_, __, index) => index + 1
            },
            {
              title: '商品',
              dataIndex: 'serviceObjectName',
              key: 'serviceObjectName',
              render: (_value: string, record) => (
                <Select<number>
                  showSearch
                  value={record.serviceObjectId || undefined}
                  placeholder="搜索选择商品"
                  style={{ width: '100%' }}
                  filterOption={false}
                  onSearch={searchObjects}
                  onChange={(selectedValue, option) => {
                    const selectedOption = option as { value: number; label: string };
                    handleSelectDraftObject(record.key, selectedValue, selectedOption.label);
                  }}
                  onClear={() => handleSelectDraftObject(record.key, 0, '')}
                  options={[
                    ...(record.serviceObjectId
                      ? [{ label: record.serviceObjectName, value: record.serviceObjectId }]
                      : []),
                    ...objectSearchOptions.map((opt) => ({
                      label: opt.objectDetailName,
                      value: opt.objectDetailId
                    }))
                  ]}
                  allowClear
                />
              )
            },
            {
              title: '数量',
              dataIndex: 'totalCount',
              key: 'totalCount',
              width: 120,
              render: (value: number, record) => (
                <InputNumber
                  value={value}
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  onChange={(newValue) => handleDraftFieldChange(record.key, 'totalCount', Number(newValue || 0))}
                />
              )
            },
            {
              title: '单位',
              dataIndex: 'unitName',
              key: 'unitName',
              width: 120,
              render: (value: string, record) => (
                <Select
                  value={value || undefined}
                  placeholder="选择单位"
                  style={{ width: '100%' }}
                  options={UNIT_OPTIONS}
                  onChange={(newValue) => handleDraftFieldChange(record.key, 'unitName', newValue)}
                  allowClear
                />
              )
            },
            {
              title: '备注',
              dataIndex: 'remark',
              key: 'remark',
              render: (value: string, record) => (
                <Input
                  value={value}
                  placeholder="请输入备注"
                  onChange={(e) => handleDraftFieldChange(record.key, 'remark', e.target.value)}
                />
              )
            },
            {
              title: '状态',
              key: 'status',
              width: 120,
              render: (_, record) =>
                record.serviceObjectName && record.unitName ? (
                  <Tag color="green">匹配成功</Tag>
                ) : (
                  <Tag color="gold">需确认</Tag>
                )
            },
            {
              title: '操作',
              key: 'action',
              width: 90,
              render: (_, record) => (
                <Popconfirm
                  title="确认删除"
                  description="确定要删除这一行数据吗？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => handleDeleteDraftRow(record.key)}
                >
                  <Button danger type="link">
                    删除
                  </Button>
                </Popconfirm>
              )
            }
          ]}
        />
      </Modal>

      {/* 第二块：电子秤、配货进度和结算信息 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* 1. 电子秤部分 */}
        <div style={{ 
          flex: '0 0 auto',  // 改为不伸缩，根据内容自适应
          /* 使用图片中的蓝色调作为背景 */
          background: '#2759CD', 
          borderRadius: '6px',
          padding: '12px 24px', /* 调整内边距 */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start', /* 靠左对齐 */
          gap: '24px', /* 调整计重/单位 和 数字显示 的间距 */
          minWidth: 'fit-content'  // 确保宽度至少能容纳内容
        }}>
          {isConnected ? (
            <> {/* 使用 Fragment 包裹 */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',  // 横向排列
                alignItems: 'baseline',  // 基线对齐
                gap: '4px',  // 减小间距
                whiteSpace: 'nowrap'  // 防止文字换行
              }}>
                <span style={{ 
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#fff',
                  lineHeight: 1,  // 确保行高为1
                  whiteSpace: 'nowrap'  // 防止文字换行
                }}>
                  计重
                </span>
                <span style={{ 
                  fontSize: '14px',
                  color: '#fff',
                  lineHeight: 1  // 确保行高为1
                }}>
                  (斤)
                </span>
              </div>
              {/* 使用新的 DigitalDisplay 组件 */}
              <DigitalDisplay value={weight} /> 
            </>
          ) : (
            <Button style={{width: '100%', color: "#ffffff"}} type="text" onClick={handleReconnect}>
              连接电子秤
            </Button>
          )}
        </div>

        {/* 2. 配货进度部分 */}
        <div style={{ 
          flex: 1,
          // background: '#f6ffed',
          backgroundImage: 'linear-gradient(to bottom, #F3FAFF 0%, #ffffff 100%)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',  // 改为纵向排列
          gap: '12px',  // 添加间距
          border: '1px solid #ffffff'
        }}>
          {/* 标题行 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ 
                        fontSize: '14px',
                        fontWeight: 500,
              color: '#333333'
            }}>
              配货状态
            </span>
            <span style={{ 
              fontSize: '12px',
              fontWeight: 500,
              color: '#777777'
            }}>
              配货进度：<span style={{ color: '#409EFF' }}>{order.deliveryCount}/{order.totalObjectCount}</span>
            </span>
          </div>

          {/* 选择框 */}
                    <Select
            style={{ width: '100%' }}  // 宽度设为100%
                      value={order.status}
                      onChange={onStatusChange}
                    >
                      {statusList.map(status => (
                        <Select.Option 
                          key={status.orderStatusCode} 
                          value={status.orderStatusCode}
                        >
                          {status.orderStatusName}
                        </Select.Option>
                      ))}
                    </Select>
        </div>

        {/* 3. 结算信息部分 */}
        {isAdmin && (
          <div style={{ 
            flex: 1,
            backgroundImage: 'linear-gradient(to bottom, #FFF4F4 0%, #ffffff 100%)',
            borderRadius: '6px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',  // 改为纵向排列
            gap: '12px',  // 添加间距
            border: '1px solid #ffffff'
          }}>
            {/* 标题行 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
                    <span style={{ 
                      fontWeight: 500,
                color: '#333333'
                    }}>
                结算
                    </span>
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#777777'
              }}>
                总计：<span style={{ color: '#FF7A7A' }}>￥{order.totalPrice}</span>
                        </span>
            </div>

            {/* 选择框 */}
                        <Select
              style={{ width: '100%' }}  // 宽度设为100%
                          value={order.payStatus}
                          onChange={onPayStatusChange}
                          options={[
                            { label: '未结算', value: 'waitPay' },
                            { label: '已结算', value: 'paySuccess' }
                          ]}
                        />
          </div>
                  )}
      </div>
        </div>
  );
};