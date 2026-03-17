import { Request, Response } from 'express';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';

export const likeController = {
  toggleLike: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = (req as any).user.id;

      if (type === 'skill') {
        const skill = await Skill.findById(id);
        if (!skill) {
          res.status(404).json({ message: 'Skill not found' });
          return;
        }

        const likeIndex = skill.likes.indexOf(userId);
        let liked = false;

        if (likeIndex === -1) {
          skill.likes.push(userId);
          liked = true;
        } else {
          skill.likes.splice(likeIndex, 1);
          liked = false;
        }

        skill.likeCount = skill.likes.length;
        await skill.save();

        res.json({ 
          liked,
          likeCount: skill.likeCount 
        });
      } else if (type === 'prompt') {
        const prompt = await Prompt.findById(id);
        if (!prompt) {
          res.status(404).json({ message: 'Prompt not found' });
          return;
        }

        const likeIndex = prompt.likes.indexOf(userId);
        let liked = false;

        if (likeIndex === -1) {
          prompt.likes.push(userId);
          liked = true;
        } else {
          prompt.likes.splice(likeIndex, 1);
          liked = false;
        }

        prompt.likeCount = prompt.likes.length;
        await prompt.save();

        res.json({ 
          liked,
          likeCount: prompt.likeCount 
        });
      } else {
        res.status(400).json({ message: 'Invalid type' });
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  checkLike: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = (req as any).user.id;

      if (type === 'skill') {
        const skill = await Skill.findById(id);
        if (!skill) {
          res.status(404).json({ message: 'Skill not found' });
          return;
        }

        const isLiked = skill.likes.includes(userId);
        res.json({ isLiked });
      } else if (type === 'prompt') {
        const prompt = await Prompt.findById(id);
        if (!prompt) {
          res.status(404).json({ message: 'Prompt not found' });
          return;
        }

        const isLiked = prompt.likes.includes(userId);
        res.json({ isLiked });
      } else {
        res.status(400).json({ message: 'Invalid type' });
      }
    } catch (error) {
      console.error('Check like error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getLikes: async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const userId = (req as any).user.id;

      if (type === 'skills') {
        const skills = await Skill.find({ 
          likes: userId,
          status: 'approved',
          visibility: 'public'
        }).populate('owner', 'username avatar');

        res.json({ skills });
      } else if (type === 'prompts') {
        const prompts = await Prompt.find({ 
          likes: userId,
          status: 'approved',
          visibility: 'public'
        }).populate('owner', 'username avatar');

        res.json({ prompts });
      } else {
        res.status(400).json({ message: 'Invalid type' });
      }
    } catch (error) {
      console.error('Get likes error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
