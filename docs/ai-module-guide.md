# AI模块重构指南

## 概述

我们对AI模块进行了全面重构，将原本分散在多个文件中的提示词模板和重复代码整合成了更加模块化、可维护的结构。

## 文件结构

```
src/lib/ai/
├── index.ts                 # 统一导出入口
├── api-client.ts            # API调用客户端 (例如 DeepSeek, OpenRouter)
├── study-plan-service.ts    # 学习规划服务主入口
├── fallback-generator.ts    # 本地备选方案生成器
├── templates/               # 提示词模板
│   └── study-plan-prompt.ts # 备考规划提示词模板 (当前主要使用)
├── processors/              # AI返回结果的处理器
└── legacy_backup/           # 旧版AI模块文件备份 (由 cleanup-ai-module.sh 创建)
```

(备注: `src/lib/ai/`目录下还有一个 `README.md` 文件，提供了该模块更详细的内部结构和维护说明，包括对 `legacy_backup/` 中具体废弃文件的描述。)

## 主要改进

1. **模块化设计**：将功能分解为独立模块，每个模块专注于单一职责
2. **统一API入口**：通过`index.ts`提供统一的导出接口
3. **提示词模板集中管理**：将所有提示词模板集中到`templates`目录
4. **代码复用**：消除了重复代码，提高了可维护性
5. **错误处理增强**：引入多层次的错误处理和备选方案
6. **类型安全**：增强了TypeScript类型定义

## 使用方式

### 生成备考规划

```typescript
import { generateStudyPlanFromDatabase } from '@/lib/ai';
import { SurveyFormData } from '@/types/survey';

// 获取用户调查问卷数据
const surveyData: SurveyFormData = {/* ... */};

// 生成备考规划
const studyPlan = await generateStudyPlanFromDatabase(surveyData);
```

### 在测试环境中使用基础版本

```typescript
import { generateBasicStudyPlan } from '@/lib/ai';

// 不依赖数据库，适用于测试环境
const studyPlan = await generateBasicStudyPlan(surveyData);
```

### 直接使用API客户端

```typescript
import { callAIAPI } from '@/lib/ai';

// 自定义提示词
const prompt = "你好，请生成...";

// 调用API
const response = await callAIAPI(prompt);
```

## 错误处理机制

新版AI模块采用了多层次的错误处理机制：

1. 首先尝试使用数据库资料生成高级提示词并调用AI
2. 如果数据库查询失败，尝试使用基础提示词
3. 如果AI API调用失败，使用本地备选方案生成

这确保了即使在网络不稳定或API服务不可用的情况下，系统仍然能够为用户提供合理的备考规划。

## 维护建议

1. **添加新提示词模板**：在`templates`目录下创建新的模板文件。当前主要提示词在`templates/study-plan-prompt.ts`。
2. **更新API调用**：在`api-client.ts`中修改或添加新的API调用方法。该文件处理与不同AI服务（如DeepSeek, OpenRouter等）的通信。
3. **增强备选方案**：在`fallback-generator.ts`中改进本地生成逻辑。导出的 `generateLocalStudyPlan` 函数可用于此目的。
4. **处理AI输出**：如果AI的输出格式需要新的处理逻辑，可以在 `processors/` 目录下添加或修改处理器。

## 清理旧文件

为了清理旧的、重复的AI模块文件，我们提供了清理脚本：

```bash
# 确保脚本有执行权限
chmod +x scripts/cleanup-ai-module.sh

# 执行清理脚本
./scripts/cleanup-ai-module.sh
```

这将把旧文件（如 `db-router.js`, `db-router.ts`, `db-study-plan.ts`, `openrouter.ts`）移动到 `src/lib/ai/legacy_backup/` 备份目录，以确保在需要时可以恢复，并保持当前工作目录的整洁。 