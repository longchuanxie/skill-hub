import { Request, Response } from 'express';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';

interface TrendsQuery {
  type?: 'skills' | 'prompts' | 'combined';
  sort?: 'popular' | 'latest' | 'rating';
  limit?: string;
  timeRange?: 'week' | 'month' | 'year';
}

export const getTrends = async (req: Request, res: Response) => {
  try {
    const { type = 'combined', sort = 'popular', limit = '10', timeRange = 'week' } = req.query as TrendsQuery;

    const validTypes = ['skills', 'prompts', 'combined'];
    const validSorts = ['popular', 'latest', 'rating'];
    const validTimeRanges = ['week', 'month', 'year'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type parameter'
      });
    }

    if (!validSorts.includes(sort)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort parameter'
      });
    }

    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeRange parameter'
      });
    }

    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const timeRangeMap = {
      week: 7,
      month: 30,
      year: 365
    };

    const daysAgo = timeRangeMap[timeRange];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const sortOptions: any = {
      popular: { downloads: -1 },
      latest: { createdAt: -1 },
      rating: { averageRating: -1 }
    };

    const baseQuery = {
      visibility: 'public',
      status: 'approved',
      createdAt: { $gte: startDate }
    };

    console.log(`[Trends API] 开始获取趋势数据: type=${type}, sort=${sort}, limit=${limitNum}, timeRange=${timeRange}`);

    let skills: any[] = [];
    let prompts: any[] = [];

    if (type === 'skills' || type === 'combined') {
      const skillsData = await Skill.find(baseQuery)
        .select('name description downloads averageRating ratings createdAt updatedAt')
        .sort(sortOptions[sort])
        .limit(limitNum)
        .lean();

      skills = skillsData.map((skill: any, index) => ({
        id: skill._id,
        type: 'skill',
        title: skill.name,
        description: skill.description,
        downloads: skill.downloads || 0,
        rating: skill.averageRating || 0,
        averageRating: skill.averageRating || 0,
        ratingsCount: skill.ratings ? skill.ratings.length : 0,
        trendPercentage: Math.round((Math.random() * 20 + 5) * 10) / 10,
        rank: index + 1,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt
      }));

      console.log(`[Trends API] 找到 ${skills.length} 个技能`);
    }

    if (type === 'prompts' || type === 'combined') {
      const promptsData = await Prompt.find(baseQuery)
        .select('name description usageCount averageRating ratings createdAt updatedAt')
        .sort(sortOptions[sort])
        .limit(limitNum)
        .lean();

      prompts = promptsData.map((prompt: any, index) => ({
        id: prompt._id,
        type: 'prompt',
        title: prompt.name,
        description: prompt.description,
        downloads: prompt.usageCount || 0,
        rating: prompt.averageRating || 0,
        averageRating: prompt.averageRating || 0,
        ratingsCount: prompt.ratings ? prompt.ratings.length : 0,
        trendPercentage: Math.round((Math.random() * 20 + 5) * 10) / 10,
        rank: index + 1,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt
      }));

      console.log(`[Trends API] 找到 ${prompts.length} 个提示词`);
    }

    let combined: any[] = [];
    if (type === 'combined') {
      combined = [...skills, ...prompts];
      combined.sort((a, b) => {
        if (sort === 'popular') return b.downloads - a.downloads;
        if (sort === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === 'rating') return b.rating - a.rating;
        return 0;
      });
      combined = combined.slice(0, limitNum).map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    }

    const response = {
      success: true,
      data: {
        skills,
        prompts,
        combined
      },
      meta: {
        total: skills.length + prompts.length,
        lastUpdated: new Date(),
        cacheDuration: 300
      }
    };

    console.log(`[Trends API] 返回数据: skills=${skills.length}, prompts=${prompts.length}, combined=${combined.length}`);

    res.json(response);
  } catch (error) {
    console.error('[Trends API] 获取趋势数据时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends data'
    });
  }
};