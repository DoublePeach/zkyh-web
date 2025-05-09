#!/bin/bash

echo "==============================================="
echo "数据库同步工具 - 开始同步过程"
echo "==============================================="
echo "1. 将开发环境表结构同步到生产环境"
echo "2. 将生产环境特定表数据同步到开发环境"
echo "==============================================="

# 检查数据库连接
check_connection() {
  local host=$1
  local port=$2
  local user=$3
  local password=$4
  local db=$5
  local env=$6

  echo "检查 $env 数据库连接..."
  PGPASSWORD=$password psql -h $host -p $port -U $user -d $db -c "SELECT 1" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ $env 数据库连接成功!"
  else
    echo "❌ $env 数据库连接失败!"
    exit 1
  fi
}

# 加载数据库配置
source ./db_sync/db_config.sh

# 检查数据库连接
check_connection $DEV_DB_HOST $DEV_DB_PORT $DEV_DB_USER "$DEV_DB_PASSWORD" $DEV_DB_NAME "开发环境"
check_connection $PROD_DB_HOST $PROD_DB_PORT $PROD_DB_USER "$PROD_DB_PASSWORD" $PROD_DB_NAME "生产环境"

echo "==============================================="
echo "步骤 1: 将开发环境表结构导出"
echo "==============================================="
./db_sync/export_dev_schema.sh

echo "==============================================="
echo "步骤 2: 将表结构导入生产环境"
echo "==============================================="
./db_sync/import_schema_to_prod.sh

echo "==============================================="
echo "步骤 3: 从生产环境导出特定表数据"
echo "==============================================="
./db_sync/export_prod_data.sh

echo "==============================================="
echo "步骤 4: 将特定表数据导入开发环境"
echo "==============================================="
./db_sync/import_data_to_dev.sh

echo "==============================================="
echo "同步完成! 👍"
echo "已完成以下操作:"
echo "1. 开发环境表结构已同步到生产环境"
echo "2. 生产环境的 chapters 和 knowledge_points 表数据已同步到开发环境"
echo "===============================================" 