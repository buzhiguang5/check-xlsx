## 用于检测excel格式游戏配置表

```bash
# Install
npm install

# Install pkg
npm install -g pkg


# 将 app.js 编译成 app.exe 可执行文件（使用管理员模式）
pkg app.js
#上面的命令会同时编译出 linux 、windows 、mac 版的 exe，加 -t win 就可以只编译 windows 下的
pkg -t win app.js    
```