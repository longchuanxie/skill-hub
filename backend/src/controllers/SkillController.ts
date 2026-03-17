import { Response } from 'express';
import { Skill } from '../models/Skill';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { validateSkillUpload } from '../utils/skillUploadValidator';

export const createSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category, tags, visibility, version } = req.body;

    // 验证用户已登录
    if (!req.user?.userId) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User must be logged in to create a skill'
      });
      return;
    }

    // 检查是否有文件上传
    const hasFile = req.file != null;

    // 如果没有文件，禁止设置为 public
    if (!hasFile && visibility === 'public') {
      res.status(400).json({
        error: 'PUBLIC_SKILL_REQUIRES_FILE',
        message: 'Cannot set skill to public without uploading a file. Please upload a file or set visibility to private.'
      });
      return;
    }

    let skillData: any = {
      name,
      description,
      category: category || 'general',
      tags: tags || [],
      owner: req.user?.userId,
      visibility: visibility || 'private',
      version: version || '1.0.0',
      versions: [],
      files: [],
    };

    // 如果有文件，处理文件上传
    if (hasFile) {
      // 检查文件类型是否为ZIP
      if (!req.file!.originalname.endsWith('.zip')) {
        res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Only ZIP files are allowed'
        });
        return;
      }

      // 创建临时目录用于解压和验证
      const tempDir = path.join(process.cwd(), 'temp', `skill-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        // 验证Skill结构
        const validationResult = await validateSkillUpload(req.file!.path, tempDir);
        if (!validationResult.valid) {
          res.status(400).json({
            error: 'INVALID_SKILL_STRUCTURE',
            message: 'Invalid skill structure',
            details: validationResult.errors
          });
          return;
        }

        // 验证通过，添加文件信息
        const fileUrl = `/uploads/${req.file!.filename}`;
        const newVersion = {
          version: version || validationResult.structure?.version || '1.0.0',
          url: fileUrl,
          createdAt: new Date(),
        };

        skillData.versions = [newVersion];
        skillData.files = [{
          filename: req.file!.originalname,
          originalName: req.file!.originalname,
          path: fileUrl,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
        }];

        // 更新技能信息（如果skill.json中有更新）
        if (validationResult.structure) {
          if (validationResult.structure.name) skillData.name = validationResult.structure.name;
          if (validationResult.structure.description) skillData.description = validationResult.structure.description;
          if (validationResult.structure.version) skillData.version = validationResult.structure.version;
        }
      } finally {
        // 清理临时目录
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    }

    const skill = new Skill(skillData);
    await skill.save();

    res.status(201).json({
      message: 'Skill created successfully',
      skill,
    });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create skill'
    });
  }
};

export const getSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 12, category, search, sort = 'latest' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    let query: any = { visibility: 'public', status: 'approved' };
    
    if (req.user?.userId) {
      query = {
        $or: [
          { visibility: 'public', status: 'approved' },
          { owner: req.user.userId },
        ]
      };
    }
    
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: String(search) };
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') sortOption = { downloads: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };

    const [skills, total] = await Promise.all([
      Skill.find(query).populate('owner', 'username avatar').skip(skip).limit(Number(pageSize)).sort(sortOption),
      Skill.countDocuments(query)
    ]);

    res.json({
      skills,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get skills' });
  }
};

export const getSkillById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const skill = await Skill.findById(id).populate('owner', 'username avatar');
    
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    const ownerId = skill.owner ? ((skill.owner as any)._id || skill.owner) : null;
    const hasAccess = 
      skill.visibility === 'public' || 
      (ownerId && String(ownerId) === req.user?.userId);

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const skillObj = skill.toObject();
    if (!skillObj.owner) {
      skillObj.owner = {
        _id: null,
        username: 'Unknown User',
        avatar: null
      };
    }

    res.json(skillObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get skill' });
  }
};

export const updateSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const skill = await Skill.findById(id);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    if (String(skill.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    Object.assign(skill, updates);
    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update skill' });
  }
};

export const deleteSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    if (String(skill.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await skill.deleteOne();
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
};

export const rateSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const skill = await Skill.findById(id);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    const existingRating = skill.ratings.find(r => String(r.userId) === req.user?.userId);
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      skill.ratings.push({ userId: req.user?.userId as any, rating, createdAt: new Date() });
    }

    skill.averageRating = skill.ratings.reduce((sum, r) => sum + r.rating, 0) / skill.ratings.length;
    await skill.save();
    res.json({ message: 'Rating submitted', averageRating: skill.averageRating });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rate skill' });
  }
};

export const uploadSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const skillId = req.body.skillId;
    
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    if (String(skill.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // 检查文件类型是否为ZIP
    if (!req.file.originalname.endsWith('.zip')) {
      res.status(400).json({ error: 'Only ZIP files are allowed' });
      return;
    }

    // 创建临时目录用于解压和验证
    const tempDir = path.join(process.cwd(), 'temp', `skill-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // 验证Skill结构
      const validationResult = await validateSkillUpload(req.file.path, tempDir);
      if (!validationResult.valid) {
        res.status(400).json({ error: 'Invalid skill structure', details: validationResult.errors });
        return;
      }

      // 验证通过，保存文件
      const fileUrl = `/uploads/${req.file.filename}`;
      const newVersion = {
        version: req.body.version || validationResult.structure?.version || '1.0.0',
        url: fileUrl,
        createdAt: new Date(),
      };

      skill.versions.push(newVersion as any);
      skill.files.push({
        filename: req.file.originalname,
        originalName: req.file.originalname,
        path: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // 更新技能信息（如果skill.json中有更新）
      if (validationResult.structure) {
        if (validationResult.structure.name) skill.name = validationResult.structure.name;
        if (validationResult.structure.description) skill.description = validationResult.structure.description;
        if (validationResult.structure.version) skill.version = validationResult.structure.version;
      }

      await skill.save();

      res.json({ 
        message: 'File uploaded successfully', 
        url: fileUrl, 
        version: newVersion,
        structure: validationResult.structure
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Upload skill file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const downloadSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);
    if (!skill) {
      res.status(404).json({
        error: 'SKILL_NOT_FOUND',
        message: 'Skill not found'
      });
      return;
    }

    const hasAccess =
      skill.visibility === 'public' ||
      String(skill.owner) === req.user?.userId;

    if (!hasAccess) {
      res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Access denied'
      });
      return;
    }

    const latestVersion = skill.versions[skill.versions.length - 1];
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({
        error: 'NO_FILE_AVAILABLE',
        message: 'This skill has no file available for download. Please upload a file first.'
      });
      return;
    }

    skill.downloads += 1;
    await skill.save();

    const filePath = path.join(process.cwd(), latestVersion.url);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({
        error: 'FILE_NOT_FOUND',
        message: 'The skill file was not found on the server. Please contact the administrator.'
      });
    }
  } catch (error) {
    console.error('Download skill error:', error);
    res.status(500).json({
      error: 'DOWNLOAD_FAILED',
      message: 'Failed to download skill. Please try again later.'
    });
  }
};
