#!/bin/bash

# AI模块清理脚本
# 移除旧的、重复的AI文件，保留新重构的文件结构
# 作者: 郝桃桃
# 日期: 2024-09-29

echo "开始清理旧的AI模块文件..."

# 要移除的文件列表
OLD_FILES=(
  "src/lib/ai/db-router.js"
  "src/lib/ai/db-router.ts"
  "src/lib/ai/db-study-plan.ts"
  "src/lib/ai/openrouter.ts"
)

# 检查新文件是否存在
if [ ! -f "src/lib/ai/study-plan-service.ts" ] || [ ! -f "src/lib/ai/api-client.ts" ]; then
  echo "错误: 新的文件结构未创建完成，请先确保新文件已创建"
  exit 1
fi

# 创建备份目录
BACKUP_DIR="src/lib/ai/legacy_backup"
mkdir -p $BACKUP_DIR

# 移动旧文件到备份目录
for file in "${OLD_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "备份文件: $file -> $BACKUP_DIR/"
    cp "$file" "$BACKUP_DIR/$(basename $file)"
    # 移除原文件
    echo "移除原文件: $file"
    rm "$file"
  else
    echo "文件不存在，跳过: $file"
  fi
done

echo "清理完成!"
echo "旧文件已备份到: $BACKUP_DIR/"
echo "如需恢复旧文件，请从备份目录复制回来"