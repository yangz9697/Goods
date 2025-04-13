// 首先列出所有串口
async function listPorts() {
    const ports = await navigator.serial.getPorts();
    console.log('当前可用的串口:');
    ports.forEach(async (port, index) => {
        const info = port.getInfo();
        console.log(`端口 ${index}: `, info);
    });
  }
  
  // 连接并读取数据
  async function readCOM2() {
    try {
        // 先列出所有端口
        await listPorts();
        
        console.log('请在弹出的对话框中选择 COM2 端口');
        const port = await navigator.serial.requestPort();
        const info = port.getInfo();
        console.log('已选择端口:', info);
        
        await port.open({
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        });
        
        console.log('串口已打开，开始读取数据...');
        
        const reader = port.readable.getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            console.log('收到数据:');
            console.log('HEX:', Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' '));
            console.log('文本:', new TextDecoder().decode(value));
        }
    } catch (error) {
        console.error('错误:', error);
    }
  }
  
  // 运行
  readCOM2();