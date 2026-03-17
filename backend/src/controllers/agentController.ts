import { Response } from 'express';
import { Agent } from '../models/Agent';
import { AuthRequest } from '../middleware/auth';

export const createAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { description, permissions, enterpriseId } = req.body;

    const agent = new Agent({
      description,
      enterpriseId: enterpriseId || req.user?.enterpriseId,
      owner: req.user?.userId,
      createdBy: req.user?.userId,
      permissions: permissions || { canRead: true, canWrite: false, allowedResources: [] },
    });
    agent.regenerateApiKey();

    await agent.save();
    res.status(201).json({ agent, apiKey: agent.apiKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' });
  }
};

export const getAgents = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    let query: any = { owner: req.user?.userId };
    if (req.user?.enterpriseId) {
      query = {
        $or: [
          { owner: req.user?.userId },
          { enterpriseId: req.user?.enterpriseId }
        ]
      };
    }

    const [agents, total] = await Promise.all([
      Agent.find(query).skip(skip).limit(Number(pageSize)).sort({ createdAt: -1 }),
      Agent.countDocuments(query)
    ]);

    res.json({
      agents: agents.map(a => ({ ...a.toObject(), apiKey: undefined })),
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agents' });
  }
};

export const getAgentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id);
    
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    if ((agent.owner as any)?.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    res.json({ ...agent.toObject(), apiKey: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent' });
  }
};

export const updateAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const agent = await Agent.findById(id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    if ((agent.owner as any)?.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    Object.assign(agent, updates);
    await agent.save();
    res.json({ ...agent.toObject(), apiKey: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent' });
  }
};

export const deleteAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    if ((agent.owner as any)?.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await agent.deleteOne();
    res.json({ message: 'Agent deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
};

export const regenerateAgentKey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    if ((agent.owner as any)?.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const newApiKey = agent.regenerateApiKey();
    await agent.save();
    res.json({ apiKey: newApiKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
};

export const getAgentApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    if ((agent.owner as any)?.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    res.json({ apiKey: agent.apiKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get API key' });
  }
};
