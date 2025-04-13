export class ScaleService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isReading = false;
  private static selectedPort: SerialPort | null = null;

  async connect() {
    try {
      // 如果已经有选择的串口，直接使用
      if (ScaleService.selectedPort) {
        this.port = ScaleService.selectedPort;
      } else {
        // 请求用户选择串口
        this.port = await navigator.serial.requestPort();
        // 保存选择的串口
        ScaleService.selectedPort = this.port;
      }
      
      // 打开串口
      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      return true;
    } catch (error) {
      console.error('连接电子秤失败:', error);
      return false;
    }
  }

  async startReading(callback: (value: number | null) => void) {
    if (!this.port || this.isReading) return;

    try {
      this.isReading = true;
      this.reader = this.port.readable.getReader();

      while (this.isReading) {
        try {
          const { value, done } = await this.reader.read();
          if (done) break;

          // 解析数据
          const text = new TextDecoder().decode(value);
          const match = text.match(/(\d+\.?\d*)kg/);
          
          if (match) {
            const weight = parseFloat(match[1]);
            callback(weight);
          } else {
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
      await this.stopReading();
    }
  }

  async stopReading() {
    this.isReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
        await this.reader.releaseLock();
      } catch (error) {
        console.error('停止电子秤读取失败:', error);
      }
      this.reader = null;
    }
  }

  async disconnect() {
    await this.stopReading();
    if (this.port) {
      try {
        await this.port.close();
      } catch (error) {
        console.error('关闭电子秤连接失败:', error);
      }
      this.port = null;
    }
  }

  static async reset() {
    if (ScaleService.selectedPort) {
      try {
        await ScaleService.selectedPort.close();
      } catch (error) {
        console.error('关闭已保存的串口失败:', error);
      }
      ScaleService.selectedPort = null;
    }
  }
} 