# AI服务目录说明

此目录包含与AI服务相关的代码文件，用于生成备考规划和其他AI功能。

## 目录结构

- `templates/`: 包含所有提示词模板
  - `study-plan-prompt.ts`: 备考规划提示词模板，**这是当前使用的唯一提示词模板**
- `study-plan-service.ts`: 主要的备考规划生成服务，调用提示词模板并处理API调用
- `api-client.ts`: 处理与AI API的通信（如DeepSeek、OpenRouter等）
- `fallback-generator.ts`: 当API调用失败时的本地备选方案生成器
- `processors/`: 处理AI返回结果的处理器
- `legacy_backup/`: 历史备份文件，**不应在当前代码中使用**
  - `db-router.js`/`db-router.ts`: 旧版数据库路由（已被`study-plan-service.ts`替代）
  - `db-study-plan.ts`: 旧版备考规划生成（已被`study-plan-service.ts`替代）
  - `openrouter.ts`: 旧版OpenRouter API调用（已被`api-client.ts`替代）

## 使用说明

1. 对于备考规划生成，请使用`study-plan-service.ts`中的函数：
   - `generateStudyPlanFromDatabase`: 使用数据库资料生成完整备考规划
   - `generateBasicStudyPlan`: 生成基础备考规划（不使用数据库）

2. 修改提示词时，请更新`templates/study-plan-prompt.ts`中的模板函数。

3. `legacy_backup/`目录中的文件仅作参考，不应直接导入或使用。

## 注意事项

- 保持提示词模板的一致性，避免创建多个相似但略有不同的模板
- 修改提示词时请添加详细注释，解释修改的原因和影响
- 使用`fallback-generator.ts`提供的本地备选方案，确保API调用失败时仍能提供服务 