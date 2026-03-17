import { Request, Response } from 'express';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';

export const favoriteController = {
  addFavorite: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = (req as any).user.id;

      if (type === 'skill') {
        const skill = await Skill.findById(id);
        if (!skill) {
          res.status(404).json({ message: 'Skill not found' });
          return;
        }

        if (skill.favorites.includes(userId)) {
          res.status(400).json({ message: 'Already favorited' });
          return;
        }

        skill.favorites.push(userId);
        skill.favoriteCount = skill.favorites.length;
        await skill.save();

        res.json({ 
          message: 'Added to favorites',
          favoriteCount: skill.favoriteCount 
        });
      } else if (type === 'prompt') {
        const prompt = await Prompt.findById(id);
        if (!prompt) {
          res.status(404).json({ message: 'Prompt not found' });
          return;
        }

        if (prompt.favorites.includes(userId)) {
          res.status(400).json({ message: 'Already favorited' });
          return;
        }

        prompt.favorites.push(userId);
        prompt.favoriteCount = prompt.favorites.length;
        await prompt.save();

        res.json({ 
          message: 'Added to favorites',
          favoriteCount: prompt.favoriteCount 
        });
      } else {
        res.status(400).json({ message: 'Invalid type' });
      }
    } catch (error) {
      console.error('Add favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  removeFavorite: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = (req as any).user.id;

      if (type === 'skill') {
        const skill = await Skill.findById(id);
        if (!skill) {
          res.status(404).json({ message: 'Skill not found' });
          return;
        }

        if (!skill.favorites.includes(userId)) {
          res.status(400).json({ message: 'Not favorited' });
          return;
        }

        skill.favorites = skill.favorites.filter((id: any) => id.toString() !== userId);
        skill.favoriteCount = skill.favorites.length;
        await skill.save();

        res.json({ 
          message: 'Removed from favorites',
          favoriteCount: skill.favoriteCount 
        });
      } else if (type === 'prompt') {
        const prompt = await Prompt.findById(id);
        if (!prompt) {
          res.status(404).json({ message: 'Prompt not found' });
          return;
        }

        if (!prompt.favorites.includes(userId)) {
          res.status(400).json({ message: 'Not favorited' });
          return;
        }

        prompt.favorites = prompt.favorites.filter((id: any) => id.toString() !== userId);
        prompt.favoriteCount = prompt.favorites.length;
        await prompt.save();

        res.json({ 
          message: 'Removed from favorites',
          favoriteCount: prompt.favoriteCount 
        });
      } else {
        res.status(400).json({ message: 'Invalid type' });
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  checkFavorite: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = (req as any).user.id;

      if (type === 'skill') {
        const skill = await Skill.findById(id);
        if (!skill) {
          res.status(404).json({ message: 'Skill not found' });
          return;
        }

        const isFavorited = skill.favorites.includes(userId);
        res.json({ isFavorited });
      } else if (type === 'prompt') {
        const prompt = await Prompt.findById(id);
        if (!prompt) {
          res.status(404).json({ message: 'Prompt not found' });
          return;
        }

        const isFavorited = prompt.favorites.includes(userId);
        res.json({ isFavorited });
      } else {
        res.status(400).json({ message: 'Invalid type' });
      }
    } catch (error) {
      console.error('Check favorite error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getFavorites: async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const userId = (req as any).user.id;

      if (type === 'skills') {
        const skills = await Skill.find({ 
          favorites: userId,
          status: 'approved',
          visibility: 'public'
        }).populate('owner', 'username avatar');

        res.json({ skills });
      } else if (type === 'prompts') {
        const prompts = await Prompt.find({ 
          favorites: userId,
          status: 'approved',
          visibility: 'public'
        }).populate('owner', 'username avatar');

        res.json({ prompts });
      } else {
        res.status(400).json({ message: 'Invalid type' });
      }
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
