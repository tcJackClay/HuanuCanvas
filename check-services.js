/**
 * HuanuCanvas服务状态检查脚本
 */
import http from 'http';

function checkService(name, port, path = '') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${name} (端口${port}): 正常运行`);
        resolve(true);
      } else {
        console.log(`⚠️ ${name} (端口${port}): 状态码 ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log(`❌ ${name} (端口${port}): 未运行`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ ${name} (端口${port}): 连接超时`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 检查HuanuCanvas服务状态...\n');
  
  const services = [
    { name: '前端开发服务器', port: 5208, path: '/' },
    { name: '后端API服务', port: 8766, path: '/api/status' },
  ];

  const results = await Promise.all(
    services.map(service => checkService(service.name, service.port, service.path))
  );

  const runningCount = results.filter(Boolean).length;
  
  console.log(`\n📊 状态总结: ${runningCount}/${services.length} 个服务运行中`);
  
  if (runningCount === services.length) {
    console.log('🎉 所有服务正常运行！');
    console.log('🌐 前端地址: http://localhost:5208');
    console.log('🔧 后端API: http://localhost:8766');
  } else {
    console.log('\n💡 启动命令:');
    console.log('   npm run backend:dev  # 启动后端');
    console.log('   npm run dev         # 启动前端');
    console.log('   npm run electron:dev # 启动完整环境');
  }
}

main();
