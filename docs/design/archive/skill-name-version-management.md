# 同名技能版本管理设计文档

**功能名称**: 同名技能自动版本管理  
**文档版本**: v1.0  
**创建日期**: 2026-03-21  
**优先级**: P1  

---

## 一、需求背景

### 1.1 问题描述

当前系统允许同一用户上传多个同名技能，导致：
- 技能列表中出现重复项
- 用户难以区分不同版本
- 版本管理混乱

### 1.2 需求目标

同一用户上传同名技能时，系统应自动将其作为新版本保存到已有技能中，而非创建新的技能记录。

### 1.3 业务规则

1. **同名判断**: 同一 `owner` + `name` 组合视为同名
2. **自动版本管理**: 同名上传时自动创建新版本
3. **版本号递增**: 遵循语义化版本规范 (如 1.0.0 -> 1.0.1)
4. **元数据更新**: 更新技能的基本信息（描述、标签等）

---

## 二、技术方案

### 2.1 数据模型调整

#### 2.1.1 Skill 模型索引

在 `Skill` 模型中添加复合唯一索引：

```typescript
// backend/src/models/Skill.ts
skillSchema.index({ owner: 1, name: 1 }, { 
  unique: true, 
  partialFilterExpression: { name: { $exists: true, $ne: '' } }
});
```

**说明**:
- `owner + name` 组合必须唯一
- 使用 `partialFilterExpression` 排除空名称的情况

### 2.2 API 逻辑调整

#### 2.2.1 createSkill 控制器修改

**修改位置**: `backend/src/controllers/SkillController.ts`

**处理流程**:

```
用户上传技能
    │
    ▼
检查 owner + name 是否存在
    │
    ├── 不存在 ──────────────────► 创建新技能 (现有逻辑)
    │
    └── 存在
            │
            ▼
        验证权限 (是否为技能所有者)
            │
            ├── 非所有者 ──────────► 返回错误: SKILL_NAME_EXISTS_BY_OTHER
            │
            └── 是所有者
                    │
                    ▼
                自动更新版本
                    │
                    ├── 生成新版本号
                    ├── 创建 SkillVersion 记录
                    ├── 创建 ResourceVersion 记录
                    └── 更新 Skill 主记录
```

#### 2.2.2 版本号生成规则

```typescript
async function generateNextVersion(skillId: Types.ObjectId): Promise<string> {
  const versions = await SkillVersion.find({ skillId }).sort({ createdAt: -1 });
  
  if (versions.length === 0) {
    return '1.0.0';
  }
  
  const lastVersion = versions[0].version;
  const parts = lastVersion.split('.').map(Number);
  
  // 修订号递增 (z + 1)
  parts[2] = (parts[2] || 0) + 1;
  
  // 进位处理
  if (parts[2] > 99) {
    parts[2] = 0;
    parts[1] = (parts[1] || 0) + 1;
  }
  
  if (parts[1] > 99) {
    parts[1] = 0;
    parts[0] = (parts[0] || 0) + 1;
  }
  
  return parts.join('.');
}
```

### 2.3 错误码定义

新增错误码：

| 错误码 | 值 | 中文描述 | 英文描述 |
|--------|-----|----------|----------|
| SKILL_NAME_EXISTS | 7006 | 您已上传过同名技能，新版本已自动创建 | Skill with this name already exists, new version created automatically |
| SKILL_NAME_EXISTS_BY_OTHER | 7007 | 同名技能已被其他用户使用 | Skill name already taken by another user |
| NAME_REQUIRED | 7008 | 技能名称不能为空 | Skill name is required |

### 2.4 响应结构调整

**创建新技能响应** (无变化):
```json
{
  "message": "Skill created successfully",
  "skill": { ... },
  "isNew": true
}
```

**同名技能自动版本响应**:
```json
{
  "message": "Skill version updated successfully",
  "skill": { ... },
  "isNew": false,
  "previousVersion": "1.0.0",
  "currentVersion": "1.0.1"
}
```

---

## 三、实现细节

### 3.1 后端代码修改

#### 3.1.1 SkillController.ts

```typescript
export const createSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // ... 现有的验证逻辑 ...

    // 检查同名技能是否存在
    const existingSkill = await Skill.findOne({ 
      owner: req.user?.userId, 
      name: skillData.name 
    });

    if (existingSkill) {
      // 同名技能存在，执行版本更新逻辑
      const result = await updateExistingSkillVersion(existingSkill, req);
      
      logger.info('Skill version updated', { 
        skillId: existingSkill._id, 
        version: result.newVersion,
        userId: req.user?.userId 
      });

      res.status(200).json({
        message: 'Skill version updated successfully',
        skill: result.skill,
        isNew: false,
        previousVersion: result.previousVersion,
        currentVersion: result.newVersion,
      });
      return;
    }

    // 创建新技能 (现有逻辑)
    // ...
  }
};

async function updateExistingSkillVersion(
  skill: ISkill, 
  req: AuthRequest
): Promise<{ skill: ISkill; previousVersion: string; newVersion: string }> {
  const previousVersion = skill.version;
  const newVersion = await generateNextVersion(skill._id);
  
  // 创建版本记录
  const skillVersion = new SkillVersion({
    skillId: skill._id,
    version: newVersion,
    url: `/uploads/${req.file!.filename}`,
    filename: req.file!.filename,
    originalName: req.file!.originalname,
    size: req.file!.size,
    mimetype: req.file!.mimetype,
    updateDescription: req.body.updateDescription || `Update to version ${newVersion}`,
  });
  await skillVersion.save();

  // 更新 Skill 主记录
  skill.version = newVersion;
  skill.description = skillData.description || skill.description;
  skill.tags = skillData.tags || skill.tags;
  skill.category = skillData.category || skill.category;
  // ... 更新其他字段 ...
  
  await skill.save();

  return { skill, previousVersion, newVersion };
}
```

### 3.2 前端适配

#### 3.2.1 上传页面提示

当检测到同名技能时，前端应显示友好提示：

```
检测到您已上传过同名技能 "xxx"，系统已自动创建新版本 (1.0.1)
```

---

## 四、测试方案

### 4.1 单元测试

```typescript
describe('Skill Version Management', () => {
  describe('createSkill with same name', () => {
    it('should create new skill when name is unique', async () => {
      // 首次上传应创建新技能
    });

    it('should create new version when same user uploads same name', async () => {
      // 同用户同名上传应创建新版本
    });

    it('should return error when different user uploads same name', async () => {
      // 不同用户同名上传应返回错误
    });

    it('should increment version number correctly', async () => {
      // 版本号应正确递增
    });
  });

  describe('generateNextVersion', () => {
    it('should return 1.0.0 for first version', async () => {
      // 首个版本应为 1.0.0
    });

    it('should increment patch version', async () => {
      // 修订号递增测试
    });
  });
});
```

### 4.2 集成测试

```typescript
describe('Skill Upload API', () => {
  it('POST /api/skills - first upload creates new skill', async () => {
    // 首次上传测试
  });

  it('POST /api/skills - second upload with same name creates version', async () => {
    // 同名上传测试
  });

  it('POST /api/skills - different user cannot use same name', async () => {
    // 不同用户同名测试
  });
});
```

---

## 五、验收标准

### 5.1 功能验收

- [ ] 同用户首次上传技能成功创建
- [ ] 同用户同名上传自动创建新版本
- [ ] 不同用户同名上传返回错误提示
- [ ] 版本号正确递增
- [ ] 版本历史可查询
- [ ] 前端正确显示版本更新提示

### 5.2 数据验收

- [ ] 数据库中不存在同用户同名的重复技能
- [ ] SkillVersion 表正确记录版本历史
- [ ] ResourceVersion 表正确记录资源版本

### 5.3 测试验收

- [ ] 单元测试覆盖率 > 80%
- [ ] 所有测试用例通过

---

## 六、影响范围

### 6.1 后端修改

| 文件 | 修改内容 |
|------|----------|
| `backend/src/models/Skill.ts` | 添加复合唯一索引 |
| `backend/src/controllers/SkillController.ts` | 添加同名检测和版本更新逻辑 |
| `backend/src/utils/errorCodes.ts` | 添加新错误码 |

### 6.2 前端修改

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/pages/UploadPage.tsx` | 适配新的响应格式，显示版本更新提示 |

### 6.3 数据库变更

- 需要创建复合唯一索引（可能需要先清理重复数据）

---

## 七、上线计划

### 7.1 数据清理

上线前需检查并清理已有的同名重复数据：

```javascript
// 查找重复数据
db.skills.aggregate([
  { $match: { name: { $exists: true, $ne: '' } } },
  { $group: { _id: { owner: "$owner", name: "$name" }, count: { $sum: 1 }, docs: { $push: "$_id" } } },
  { $match: { count: { $gt: 1 } } }
])
```

### 7.2 索引创建

```javascript
db.skills.createIndex(
  { owner: 1, name: 1 }, 
  { unique: true, partialFilterExpression: { name: { $exists: true, $ne: '' } } }
)
```
