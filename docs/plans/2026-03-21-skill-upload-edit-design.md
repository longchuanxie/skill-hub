# SKILL上传编辑页面调整设计方案

## 1. 需求概述

调整SKILL上传编辑页面布局和功能：
1. 上传页面移除status字段，编辑页面保留status字段
2. 上传页面增加暂存功能（draft）和正式提交（approved）
3. 文件上传设为第一个表单组件，前端解析SKILL.md提取元数据
4. 提供文件夹预览和在线修改功能

## 2. 修改范围

### 2.1 前端页面
- `frontend/src/pages/UploadPage.tsx` - SKILL上传页面
- `frontend/src/pages/SkillEditPage.tsx` - SKILL编辑页面（调整布局）

### 2.2 前端工具函数
- 新建 `frontend/src/utils/skillParser.ts` - SKILL.md解析工具

### 2.3 API调整（如需要）
- 后端API保持不变

## 3. UploadPage调整

### 3.1 移除status字段
- 从skillForm中移除status字段
- 用户上传时status默认为draft

### 3.2 暂存功能
- 新增"暂存"按钮，status设置为draft
- 新增"提交审核"按钮，status设置为approved
- 两个按钮都调用同一个createSkill接口，通过status参数区分

### 3.3 布局调整
调整表单顺序：
1. **文件上传组件**（第一个）
2. 基本信息（名称、描述）
3. 分类和标签
4. 作者和兼容性
5. 可见性

### 3.4 SKILL.md解析流程
1. 用户上传ZIP文件
2. 前端解压ZIP（使用JSZip）
3. 查找SKILL.md文件
4. 解析SKILL.md提取：name、description、tags、compatibility等
5. 自动填充到表单对应字段
6. 用户可手动修改

### 3.5 文件夹预览
- 上传后显示文件树结构
- 点击文件可预览内容
- 支持在线编辑文本文件

## 4. SkillEditPage调整

### 4.1 保留status字段
- 编辑页面保持status下拉选择
- 可选值：draft, pending, approved, rejected

### 4.2 布局优化
- 文件上传组件前置
- 保持原有编辑功能

## 5. 技术实现

### 5.1 前端依赖
- JSZip（用于解压ZIP文件）
- 前端已有，不再添加新依赖

### 5.2 SKILL.md格式
```markdown
# Skill Name
## Description
This is the skill description.

## Tags
tag1, tag2, tag3

## Compatibility
claude, gpt-4
```

### 5.3 文件预览支持
- 文本文件：直接显示内容
- 图片文件：显示缩略图
- 其他文件：显示文件名和大小

## 6. 状态流转

```
UploadPage:
  [上传文件] -> [解析SKILL.md] -> [填充表单] -> [用户确认]
                                                        |
                                                        v
  [暂存(draft)] <-------------------------------- [保存为草稿]
                                                        |
                                                        v
                                              [提交审核(approved)]

EditPage:
  [加载数据] -> [用户编辑] -> [保存更新] -> [可选：提交审核]
```

## 7. 错误处理

- 文件类型错误：提示只支持ZIP文件
- SKILL.md解析失败：提示无法解析，使用默认空表单
- 网络错误：显示错误提示，允许重试
