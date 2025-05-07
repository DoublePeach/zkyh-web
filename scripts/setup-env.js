#!/usr/bin/env node
/**
 * @description 环境配置辅助脚本
 * @author 郝桃桃
 * @date 2024-09-01
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 环境模板
const ENV_TEMPLATES = {
  development: `# 环境变量配置 - 开发环境
# 注意: 该文件包含敏感信息，不应提交到版本控制系统

# 数据库连接配置 - 二选一方式配置
DATABASE_URL=postgresql://postgres:@localhost:5432/zkyh_db1

# 数据库分离配置（仅当未设置DATABASE_URL时使用）
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=zkyh_db1

# AI配置
DEEPSEEK_API_KEY=
OPENROUTER_API_KEY=
DEFAULT_PROVIDER=deepseek

# MCP配置
SMITHERY_API_KEY=
`,
  production: `# 环境变量配置 - 生产环境
# 注意: 该文件包含敏感信息，不应提交到版本控制系统

# 数据库连接配置 - 二选一方式配置
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/zkyh_db

# 数据库分离配置（仅当未设置DATABASE_URL时使用）
DB_HOST=
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=zkyh_db

# AI配置
DEEPSEEK_API_KEY=
OPENROUTER_API_KEY=
DEFAULT_PROVIDER=deepseek

# MCP配置
SMITHERY_API_KEY=
`
};

// 帮助信息
const printHelp = () => {
  console.log(`
${colors.bright}${colors.cyan}数据库环境配置助手${colors.reset}

此脚本帮助您配置不同环境的数据库连接:
1. 开发环境 (.env) - 本地开发使用
2. 生产环境 (.env.production) - 生产环境使用

${colors.yellow}配置数据库有两种方式:${colors.reset}
- 使用完整连接字符串: DATABASE_URL=postgresql://user:password@host:port/database
- 使用分离参数: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

${colors.bright}${colors.green}环境之间的切换:${colors.reset}
- 开发环境: NODE_ENV=development (默认，无需设置)
- 生产环境: NODE_ENV=production

环境变量文件(.env和.env.production)不会被提交到Git，
因此您需要在每个环境中单独配置这些文件。
`);
};

// 创建环境文件
const createEnvFile = (envType) => {
  const filename = envType === 'development' ? '.env' : '.env.production';
  const filePath = path.join(process.cwd(), filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`${colors.yellow}警告: ${filename} 已存在。${colors.reset}`);
    rl.question(`是否覆盖? (y/N): `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        writeEnvFile(filePath, envType);
      } else {
        console.log(`${colors.green}跳过创建 ${filename}。${colors.reset}`);
        promptNext();
      }
    });
  } else {
    writeEnvFile(filePath, envType);
  }
};

// 写入环境文件
const writeEnvFile = (filePath, envType) => {
  fs.writeFileSync(filePath, ENV_TEMPLATES[envType]);
  console.log(`${colors.green}已创建 ${path.basename(filePath)} 文件。${colors.reset}`);
  console.log(`${colors.yellow}重要: 请编辑该文件，填入正确的数据库连接信息和密钥。${colors.reset}`);
  promptNext();
};

// 创建gitignore条目
const checkGitignore = () => {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.log(`${colors.red}错误: .gitignore 文件不存在。${colors.reset}`);
    return promptNext();
  }
  
  let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const envEntries = ['.env', '.env.production', '.env.local'];
  
  let missingEntries = envEntries.filter(entry => !gitignoreContent.includes(entry));
  
  if (missingEntries.length === 0) {
    console.log(`${colors.green}.gitignore 已包含所有环境文件。${colors.reset}`);
    return promptNext();
  }
  
  console.log(`${colors.yellow}发现 .gitignore 缺少以下条目:${colors.reset}`);
  missingEntries.forEach(entry => console.log(`  - ${entry}`));
  
  rl.question('是否添加这些条目到 .gitignore? (Y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'n') {
      let newContent = gitignoreContent;
      if (!gitignoreContent.endsWith('\n')) newContent += '\n';
      newContent += '\n# 环境变量文件\n';
      missingEntries.forEach(entry => newContent += `${entry}\n`);
      
      fs.writeFileSync(gitignorePath, newContent);
      console.log(`${colors.green}已更新 .gitignore 文件。${colors.reset}`);
    } else {
      console.log(`${colors.yellow}跳过更新 .gitignore。${colors.reset}`);
    }
    promptNext();
  });
};

// 检查package.json
const checkPackageJson = () => {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log(`${colors.red}错误: package.json 文件不存在。${colors.reset}`);
    return promptNext();
  }
  
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    console.log(`${colors.red}错误: 无法解析 package.json: ${error.message}${colors.reset}`);
    return promptNext();
  }
  
  const scripts = packageJson.scripts || {};
  
  // 检查开发和生产脚本是否设置了NODE_ENV
  let needsUpdate = false;
  
  if (scripts.dev && !scripts.dev.includes('NODE_ENV=development')) {
    scripts.dev = `NODE_ENV=development ${scripts.dev}`;
    needsUpdate = true;
  }
  
  if (scripts.start && !scripts.start.includes('NODE_ENV=production')) {
    scripts.start = `NODE_ENV=production ${scripts.start}`;
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    packageJson.scripts = scripts;
    rl.question('需要更新 package.json 中的脚本以设置 NODE_ENV。是否继续? (Y/n): ', (answer) => {
      if (answer.toLowerCase() !== 'n') {
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log(`${colors.green}已更新 package.json 脚本。${colors.reset}`);
      } else {
        console.log(`${colors.yellow}跳过更新 package.json。${colors.reset}`);
      }
      promptNext();
    });
  } else {
    console.log(`${colors.green}package.json 脚本已正确设置 NODE_ENV。${colors.reset}`);
    promptNext();
  }
};

// 主菜单
const showMainMenu = () => {
  console.clear();
  printHelp();
  
  console.log(`\n${colors.bright}请选择操作:${colors.reset}`);
  console.log('1. 创建开发环境配置 (.env)');
  console.log('2. 创建生产环境配置 (.env.production)');
  console.log('3. 检查 .gitignore 文件');
  console.log('4. 检查 package.json 中的环境设置');
  console.log('5. 退出');
  
  rl.question('\n请输入选项 [1-5]: ', (answer) => {
    switch (answer) {
      case '1':
        createEnvFile('development');
        break;
      case '2':
        createEnvFile('production');
        break;
      case '3':
        checkGitignore();
        break;
      case '4':
        checkPackageJson();
        break;
      case '5':
        console.log(`${colors.green}感谢使用环境配置助手!${colors.reset}`);
        rl.close();
        break;
      default:
        console.log(`${colors.red}无效的选项!${colors.reset}`);
        promptNext();
    }
  });
};

// 下一步提示
const promptNext = () => {
  rl.question(`\n按回车键继续...`, () => {
    showMainMenu();
  });
};

// 启动脚本
console.log(`${colors.bright}${colors.green}欢迎使用环境配置助手!${colors.reset}`);
showMainMenu();

// 处理退出
rl.on('close', () => {
  process.exit(0);
}); 