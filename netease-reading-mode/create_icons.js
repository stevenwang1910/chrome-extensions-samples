const fs = require('fs');
const path = require('path');

// 创建简单的PNG图标文件（使用base64编码的1x1像素透明PNG）
const createIcon = (size, filename) => {
    // 这是一个非常简单的透明PNG图标，实际应用中应该使用更复杂的图标
    const transparentPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(path.join(__dirname, 'icons', filename), transparentPNG);
    console.log(`创建图标: ${filename} (${size}x${size})`);
};

// 确保icons目录存在
if (!fs.existsSync(path.join(__dirname, 'icons'))) {
    fs.mkdirSync(path.join(__dirname, 'icons'));
}

// 创建不同尺寸的图标
createIcon(16, 'icon16.png');
createIcon(48, 'icon48.png');
createIcon(128, 'icon128.png');

console.log('图标创建完成！');