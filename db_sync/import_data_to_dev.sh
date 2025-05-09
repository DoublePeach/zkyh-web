#!/bin/bash

# 加载数据库配置
source ./db_sync/db_config.sh

echo "正在将数据导入到开发环境..."

# 先清空开发环境中的两个表数据，避免冲突
echo "清空开发环境中的现有数据..."
PGPASSWORD=$DEV_DB_PASSWORD psql \
  -h $DEV_DB_HOST \
  -p $DEV_DB_PORT \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  -c "TRUNCATE chapters, knowledge_points RESTART IDENTITY CASCADE;"

# 导入章节表数据
echo "导入 chapters 表数据..."
PGPASSWORD=$DEV_DB_PASSWORD psql \
  -h $DEV_DB_HOST \
  -p $DEV_DB_PORT \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  -f db_sync/prod_chapters_data.sql

# 导入知识点表数据
echo "导入 knowledge_points 表数据..."
PGPASSWORD=$DEV_DB_PASSWORD psql \
  -h $DEV_DB_HOST \
  -p $DEV_DB_PORT \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  -f db_sync/prod_knowledge_points_data.sql

if [ $? -eq 0 ]; then
  echo "数据导入成功!"
else
  echo "数据导入失败!"
  exit 1
fi 