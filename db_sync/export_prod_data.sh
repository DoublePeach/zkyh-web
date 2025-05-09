#!/bin/bash

# 加载数据库配置
source ./db_sync/db_config.sh

echo "正在从生产环境导出表数据..."

# 导出生产环境的章节表数据
echo "导出 chapters 表数据..."
PGPASSWORD=$PROD_DB_PASSWORD pg_dump \
  -h $PROD_DB_HOST \
  -p $PROD_DB_PORT \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  --data-only \
  --table=chapters \
  --no-owner \
  --no-privileges \
  -f db_sync/prod_chapters_data.sql

# 导出生产环境的知识点表数据
echo "导出 knowledge_points 表数据..."
PGPASSWORD=$PROD_DB_PASSWORD pg_dump \
  -h $PROD_DB_HOST \
  -p $PROD_DB_PORT \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  --data-only \
  --table=knowledge_points \
  --no-owner \
  --no-privileges \
  -f db_sync/prod_knowledge_points_data.sql

if [ $? -eq 0 ]; then
  echo "表数据导出成功!"
else
  echo "表数据导出失败!"
  exit 1
fi 