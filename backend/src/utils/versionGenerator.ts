import { Types } from 'mongoose';
import { SkillVersion } from '../models/SkillVersion';
import { PromptVersion } from '../models/PromptVersion';

export async function generateNextSkillVersion(skillId: Types.ObjectId): Promise<string> {
  const versions = await SkillVersion.find({ skillId }).sort({ createdAt: -1 });

  if (versions.length === 0) {
    return '1.0.0';
  }

  const lastVersion = versions[0].version;
  const parts = lastVersion.split('.').map(Number);

  parts[2] = (parts[2] || 0) + 1;

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

export async function generateNextPromptVersion(promptId: Types.ObjectId): Promise<string> {
  const versions = await PromptVersion.find({ promptId }).sort({ createdAt: -1 });

  if (versions.length === 0) {
    return '1.0.0';
  }

  const lastVersion = versions[0].version;
  const parts = lastVersion.split('.').map(Number);

  parts[2] = (parts[2] || 0) + 1;

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
