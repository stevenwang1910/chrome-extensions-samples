@echo off
echo 正在打开Chrome扩展管理页面...
start chrome chrome://extensions/
echo.
echo 请按照以下步骤安装扩展：
echo 1. 开启右上角的"开发者模式"开关
echo 2. 点击"加载已解压的扩展程序"按钮
echo 3. 选择当前目录: %cd%
echo 4. 点击"选择文件夹"
echo.
echo 安装完成后，您可以访问测试页面测试扩展功能：
echo file:///%cd%/test.html
echo.
pause