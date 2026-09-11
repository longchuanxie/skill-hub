import { Request, Response } from 'express';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { User } from '../models/User';

export const getHomeStats = async (req: Request, res: Response) => {
  try {
    console.log('开始获取首页统计数据...');
    
    const skillsCount = await Skill.countDocuments({ visibility: 'public', status: 'approved' });
    console.log('技能数量:', skillsCount);
    
    const promptsCount = await Prompt.countDocuments({ visibility: 'public', status: 'approved' });
    console.log('提示词数量:', promptsCount);
    
    const usersCount = await User.countDocuments({});
    console.log('用户数量:', usersCount);
    
    const skills = await Skill.find({ visibility: 'public', status: 'approved' }).select('downloads');
    const skillsDownloads = skills.reduce((sum, skill) => sum + (skill.downloads || 0), 0);
    console.log('技能下载总数:', skillsDownloads);
    
    const prompts = await Prompt.find({ visibility: 'public', status: 'approved' }).select('usageCount');
    const promptsDownloads = prompts.reduce((sum, prompt) => sum + (prompt.usageCount || 0), 0);
    console.log('提示词使用总数:', promptsDownloads);
    
    const totalDownloads = skillsDownloads + promptsDownloads;
    console.log('总下载次数:', totalDownloads);

    console.log('统计数据:', { skillsCount, promptsCount, usersCount, totalDownloads });

    res.json({
      success: true,
      data: {
        skills: skillsCount,
        prompts: promptsCount,
        users: usersCount,
        downloads: totalDownloads
      }
    });
  } catch (error) {
    console.error('获取首页统计数据时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch home statistics'
    });
  }
};