#!/bin/bash

# 加载数据库配置
source ./db_sync/db_config.sh

echo "创建数据库备份..."

# 创建备份目录
mkdir -p db_sync/backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 备份开发环境数据库
echo "备份开发环境数据库..."
PGPASSWORD=$DEV_DB_PASSWORD pg_dump \
  -h $DEV_DB_HOST \
  -p $DEV_DB_PORT \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  -F c \
  -f db_sync/backups/dev_db_backup_$TIMESTAMP.dump

# 备份生产环境数据库
echo "备份生产环境数据库..."
PGPASSWORD=$PROD_DB_PASSWORD pg_dump \
  -h $PROD_DB_HOST \
  -p $PROD_DB_PORT \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -F c \
  -f db_sync/backups/prod_db_backup_$TIMESTAMP.dump

echo "数据库备份完成!"
echo "备份文件保存在: db_sync/backups/ 目录" 