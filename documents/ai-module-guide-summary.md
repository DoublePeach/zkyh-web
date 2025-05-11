# AI模块重构指南摘要

本文档是 `docs/ai-module-guide.md` 的摘要。

## 概述
该文档描述了对项目中AI模块进行的一次全面重构，旨在提升模块化、可维护性，并整合了分散的提示词模板和重复代码。

## 重构后的文件结构
位于 `src/lib/ai/`:
*   `index.ts`: 模块的统一导出入口。
*   `api-client.ts`: 负责调用外部AI API的客户端 (例如 DeepSeek, OpenRouter)。
*   `study-plan-service.ts`: 学习规划服务的主要业务逻辑入口。
*   `fallback-generator.ts`: 本地备选方案生成器。
*   `templates/`: 存放所有提示词模板的目录。
    *   `study-plan-prompt.ts`: 备考规划提示词模板 (当前主要使用)。
*   `processors/`: AI返回结果的处理器。
*   `legacy_backup/`: 旧版AI模块文件备份 (由 `scripts/cleanup-ai-module.sh` 创建)。

(备注: `src/lib/ai/` 目录下还有一个 `README.md` 文件，提供了该模块更详细的内部结构和维护说明。)

## 主要改进点
1.  模块化设计
2.  统一API入口
3.  提示词模板集中管理
4.  代码复用
5.  错误处理增强 (多层次错误处理和备选方案)
6.  类型安全

## 使用示例
*   生成备考规划 (依赖数据库): `generateStudyPlanFromDatabase`
*   生成基础备考规划 (不依赖数据库): `generateBasicStudyPlan`
*   直接调用AI API: `callAIAPI`
*   本地备选方案: `generateLocalStudyPlan`

## 错误处理机制
1.  首选：使用数据库资料生成高级提示词并调用AI。
2.  备选1 (若数据库查询失败)：使用基础提示词调用AI。
3.  备选2 (若AI API调用失败)：使用 `fallback-generator.ts` (e.g., `generateLocalStudyPlan`) 在本地生成备选方案。

## 维护建议
*   **提示词模板**: 主要在 `templates/study-plan-prompt.ts`。
*   **API调用**: 修改 `api-client.ts` (处理与DeepSeek, OpenRouter等通信)。
*   **备选方案**: 改进 `fallback-generator.ts`。
*   **AI输出处理**: 在 `processors/` 中添加/修改处理器。

## 旧文件清理
*   脚本 `scripts/cleanup-ai-module.sh` 用于将旧文件 (如 `db-router.ts`, `openrouter.ts` 等) 移动到 `src/lib/ai/legacy_backup/`。

详情请查阅原始文档 `docs/ai-module-guide.md`。 