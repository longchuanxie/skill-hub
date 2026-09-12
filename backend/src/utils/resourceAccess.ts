import { Types } from 'mongoose';
import { SkillPermissions } from '../models/SkillPermissions';

export interface AccessContext {
  userId?: string;
  enterpriseId?: string;
}

interface AccessibleResource {
  _id?: Types.ObjectId;
  owner: unknown;
  visibility: string;
  status?: string;
  enterpriseId?: unknown;
}

const isOwner = (resource: AccessibleResource, ctx: AccessContext): boolean =>
  !!ctx.userId && String(resource.owner) === ctx.userId;

const isEnterpriseScope = (resource: AccessibleResource, ctx: AccessContext): boolean =>
  (resource.visibility === 'enterprise' || resource.visibility === 'shared') &&
  !!resource.enterpriseId &&
  !!ctx.enterpriseId &&
  String(resource.enterpriseId) === ctx.enterpriseId;

const isCollaborator = async (
  resource: AccessibleResource,
  ctx: AccessContext,
  roles?: string[],
): Promise<boolean> => {
  if (!ctx.userId || !resource._id) return false;
  const perm = await SkillPermissions.findOne({ skillId: resource._id })
    .select('collaborators')
    .lean<{ collaborators?: { userId: Types.ObjectId; role: string }[] }>();
  return (
    !!perm?.collaborators?.some(
      (c) => String(c.userId) === ctx.userId && (!roles || roles.includes(c.role)),
    ) || false
  );
};

// Read access: owner, public (non-rejected), enterprise members and any
// collaborator. Collaborators only exist for skills (SkillPermissions).
export const canReadResource = async (
  resource: AccessibleResource,
  ctx: AccessContext,
): Promise<boolean> => {
  if (isOwner(resource, ctx)) return true;
  if (resource.visibility === 'public') return resource.status !== 'rejected';
  if (isEnterpriseScope(resource, ctx)) return true;
  return isCollaborator(resource, ctx);
};

// Write access: owner or editor/admin collaborators.
export const canWriteResource = async (
  resource: AccessibleResource,
  ctx: AccessContext,
): Promise<boolean> => {
  if (isOwner(resource, ctx)) return true;
  return isCollaborator(resource, ctx, ['editor', 'admin']);
};
