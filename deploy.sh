#!/bin/bash

# 错误时退出
set -e

# 定义变量
SERVER="root@139.224.63.0"
REMOTE_DIR="/var/www/html"
DIST_DIR="./dist"
SSH_KEY="./goods"  # 新添加的 SSH 密钥路径

echo "开始部署..."

# 检查构建文件夹是否存在
if [ ! -d "$DIST_DIR" ]; then
    echo "错误: dist 目录不存在，请先运行 npm run build"
    exit 1
fi

# 压缩 dist 目录
echo "压缩 dist 目录..."
tar -czf dist.tar.gz dist/

# 检查并创建远程目录
echo "检查远程目录..."
ssh -i $SSH_KEY $SERVER "sudo mkdir -p $REMOTE_DIR && sudo chown -R root:root $REMOTE_DIR"

# 上传到服务器
echo "上传文件到服务器..."
scp -i $SSH_KEY dist.tar.gz $SERVER:$REMOTE_DIR/

# SSH 到服务器执行部署
echo "在服务器上部署..."
ssh -i $SSH_KEY $SERVER << 'ENDSSH'
cd /var/www/html
rm -rf index.html assets
tar -xzf dist.tar.gz
mv dist/* ./
rm -rf dist
rm dist.tar.gz

# 设置正确的权限
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 重启 nginx
sudo systemctl restart nginx
echo "Nginx 配置已更新"
ENDSSH

# 清理本地文件
rm dist.tar.gz

echo "开发环境部署完成!"