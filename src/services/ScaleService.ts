export class ScaleService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isReading = false;
  private static selectedPort: SerialPort | null = null;

  async connect(): Promise<boolean> {
    try {
      console.log('开始连接电子秤...');
      
      // 如果端口已经打开，先关闭它
      if (this.port) {
        console.log('端口已存在，先关闭它');
        await this.disconnect();
      }

      console.log('请求串口权限...');
      // 请求串口权限
      this.port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x1A86, usbProductId: 0x7523 }, // 默认电子秤
          { usbVendorId: 0x1A86, usbProductId: 0x5523 }  // 备用电子秤
        ]
      });
      console.log('已选择串口:', this.port);

      console.log('正在打开串口...');
      // 打开串口
      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: 'none'
      });
      console.log('串口已成功打开');

      return true;
    } catch (error) {
      console.error('初始化串口失败:', error);
      return false;
    }
  }

  async startReading(callback: (value: number | null) => void) {
    if (!this.port || this.isReading) {
      console.log('无法开始读取:', !this.port ? '端口未连接' : '已在读取中');
      return;
    }

    try {
      console.log('开始读取电子秤数据...');
      this.isReading = true;
      this.reader = this.port.readable.getReader();

      while (this.isReading) {
        try {
          const { value, done } = await this.reader.read();
          if (done) {
            console.info('读取流已结束');
            break;
          }

          // 解析数据
          const text = new TextDecoder().decode(value);
          console.info('收到原始数据:', text);
          
          const match = text.match(/(\d+\.?\d*)kg/);
          if (match) {
            const weight = parseFloat(match[1]);
            console.info('解析到重量:', weight, 'kg');
            callback(weight);
          } else {
            console.info('未找到有效重量数据');
            callback(null);
          }
        } catch (error) {
          console.error('读取电子秤数据失败:', error);
          callback(null);
        }
      }
    } catch (error) {
      console.error('启动电子秤读取失败:', error);
      callback(null);
    } finally {
      console.info('停止读取电子秤数据');
      await this.stopReading();
    }
  }

  async stopReading() {
    console.log('正在停止读取...');
    this.isReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
        await this.reader.releaseLock();
        console.log('读取器已停止并释放');
      } catch (error) {
        console.error('停止电子秤读取失败:', error);
      }
      this.reader = null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.port) {
        console.log('正在关闭串口...');
        // 先停止读取
        await this.stopReading();
        // 再关闭端口
        await this.port.close();
        this.port = null;
        console.log('串口已关闭');
      }
    } catch (error) {
      console.error('关闭串口失败:', error);
    }
  }

  static async reset() {
    console.log('正在重置电子秤服务...');
    if (ScaleService.selectedPort) {
      try {
        await ScaleService.selectedPort.close();
        console.log('已关闭保存的串口');
      } catch (error) {
        console.error('关闭已保存的串口失败:', error);
      }
      ScaleService.selectedPort = null;
    }
  }
} 