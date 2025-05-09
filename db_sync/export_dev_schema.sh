#!/bin/bash

# 加载数据库配置
source ./db_sync/db_config.sh

echo "正在从开发环境导出表结构..."

# 导出开发环境的表结构（不包含数据）
PGPASSWORD=$DEV_DB_PASSWORD pg_dump \
  -h $DEV_DB_HOST \
  -p $DEV_DB_PORT \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f db_sync/dev_schema.sql

if [ $? -eq 0 ]; then
  echo "表结构导出成功: db_sync/dev_schema.sql"
else
  echo "表结构导出失败!"
  exit 1
fi 