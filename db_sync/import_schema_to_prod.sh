#!/bin/bash

# 加载数据库配置
source ./db_sync/db_config.sh

echo "正在将表结构导入到生产环境..."

# 导入表结构到生产环境
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -p $PROD_DB_PORT \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -f db_sync/dev_schema.sql

if [ $? -eq 0 ]; then
  echo "表结构导入成功!"
else
  echo "表结构导入失败!"
  exit 1
fi 