/**
 * @description 检查数据库配置
 * @author 郝桃桃
 * @date 2024-08-24
 */

const { DB_CONFIG } = require('../src/lib/config');

console.log('=== 数据库配置检查 ===');
console.log('当前环境:', DB_CONFIG.isDev ? 'development' : 'production');

console.log('\n=== 数据库参数 ===');
console.log('主机:', DB_CONFIG.HOST);
console.log('端口:', DB_CONFIG.PORT);
console.log('用户:', DB_CONFIG.USER);
console.log('密码:', DB_CONFIG.PASSWORD ? '已设置' : '未设置');
console.log('数据库:', DB_CONFIG.DATABASE);

console.log('\n=== 连接字符串 ===');
console.log('活动连接字符串:', DB_CONFIG.PG_CONNECTION_STRING);
console.log('开发环境连接字符串:', DB_CONFIG.DEV_CONNECTION_STRING);
console.log('生产环境连接字符串:', DB_CONFIG.PROD_CONNECTION_STRING);

console.log('\n=== 完成 ==='); 