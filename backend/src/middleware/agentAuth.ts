import { Request, Response, NextFunction } from 'express';
import { Agent } from '../models/Agent';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { ErrorCode, createErrorResponse } from '../utils/errors';

export interface AgentRequest extends Request {
  agent?: any;
}

export const authenticateAgent = async (
  req: AgentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json(createErrorResponse(ErrorCode.TOKEN_MISSING));
      return;
    }

    const agent = await Agent.findOne({ apiKey, isEnabled: true });
    if (!agent) {
      res.status(401).json(createErrorResponse(ErrorCode.UNAUTHORIZED));
      return;
    }

    agent.usage.totalRequests += 1;
    agent.usage.lastUsed = new Date();
    await agent.save();

    req.agent = agent;
    next();
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const checkAgentPermission = (resource: 'skill' | 'prompt') => {
  return async (req: AgentRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const agent = req.agent;

      if (!agent.permissions.canRead) {
        res.status(403).json(createErrorResponse(ErrorCode.READ_PERMISSION_DENIED));
        return;
      }

      let resourceDoc;
      if (resource === 'skill') {
        resourceDoc = await Skill.findById(id);
      } else {
        resourceDoc = await Prompt.findById(id);
      }

      if (!resourceDoc) {
        res.status(404).json(createErrorResponse(ErrorCode.RESOURCE_NOT_FOUND));
        return;
      }

      const isOwner = resourceDoc.owner.toString() === agent.owner.toString();
      const isSameEnterprise = 
        agent.enterpriseId && 
        resourceDoc.enterpriseId?.toString() === agent.enterpriseId.toString();
      const isPublic = resourceDoc.visibility === 'public';

      if (!isOwner && !isSameEnterprise && !isPublic) {
        res.status(403).json(createErrorResponse(ErrorCode.ACCESS_DENIED));
        return;
      }

      next();
    } catch (error) {
      res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
    }
  };
};
