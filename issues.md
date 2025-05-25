2024-12-12 联调issue记录
1.库存列表：
- [x] 列表查询、添加、编辑、删除完成初步调试
- [ ] 添加及编辑菜品库存时需要支持数量
- [ ] 缺少操作记录的返回
- [ ] updater展示（后续登陆功能完成后再调试）
2.价格列表
- [ ] 查询列表报错
    curl --location 'http://139.224.63.0:8000/erp/objectDetail/pageObjectPrice' \
    --header 'x-domain-id: 1000' \
    --header 'Content-Type: application/json' \
    --data '{
    "currentPage": 1,
    "filters": {},
    "pageSize": 10
    }'
- [ ] filters参数缺少起始时间筛选，而且应该为必需
- [ ] 缺少修改售价的接口
- [ ] 根据不同的单位查询物品价格 /erp/objectDetail/queryObjectPriceByUnit，用在哪里？
3. 客户列表
- [x] 列表查询、添加、编辑完成初步调试
- [ ] 缺少删除客户的接口

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