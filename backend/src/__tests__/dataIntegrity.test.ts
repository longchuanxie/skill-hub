import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../models/User';
import { Skill } from '../models/Skill';
import { SkillVersion } from '../models/SkillVersion';
import { ResourceVersion } from '../models/ResourceVersion';
import { SkillPermissions } from '../models/SkillPermissions';
import { Comment } from '../models/Comment';
import { Enterprise } from '../models/Enterprise';
import { Invitation } from '../models/Invitation';
import { Types as MongooseTypes } from 'mongoose';
import { nextVersionNumber, createResourceVersion } from '../utils/resourceHelpers';
import fs from 'fs';
import path from 'path';

// Regression tests for the batch-2 data-integrity hardening:
// - deleting a skill cascades to versions/permissions/comments (and files)
// - ResourceVersion numbers come from a monotonic counter (no more
//   parseInt('1.10.0') === parseInt('11.0.0') collisions)
// - accepting an invitation is idempotent and leaves the old enterprise
describe('Data integrity (batch 2)', () => {
  let owner: any;
  let ownerToken: string;

  const signToken = (user: any) =>
    jwt.sign({ userId: user._id.toString(), role: user.role, type: 'access' }, 'test-secret', {
      expiresIn: '1h',
    });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Skill.deleteMany({}),
      SkillVersion.deleteMany({}),
      ResourceVersion.deleteMany({}),
      SkillPermissions.deleteMany({}),
      Comment.deleteMany({}),
      Enterprise.deleteMany({}),
      Invitation.deleteMany({}),
    ]);

    owner = await User.create({
      username: 'owner2',
      email: 'owner2@example.com',
      password: 'StrongPass123!',
    });
    ownerToken = signToken(owner);
  });

  describe('DELETE /api/skills/:id cascade', () => {
    it('removes versions, unified versions, permissions and comments', async () => {
      const zipRel = 'uploads/test-cascade.zip';
      fs.writeFileSync(path.join(process.cwd(), zipRel), 'dummy');

      const skill = await Skill.create({
        name: 'Cascade Skill',
        description: 'x',
        owner: owner._id,
        category: 'test',
        visibility: 'public',
        status: 'approved',
        version: '1.0.0',
        files: [
          {
            filename: 'test-cascade.zip',
            originalName: 'test-cascade.zip',
            path: zipRel,
            size: 5,
            mimetype: 'application/zip',
          },
        ],
      });
      await SkillVersion.create({
        skillId: skill._id,
        version: '1.0.0',
        url: zipRel,
        filename: 'test-cascade.zip',
        originalName: 'test-cascade.zip',
        size: 5,
        mimetype: 'application/zip',
        updateDescription: 'init',
      });
      await ResourceVersion.create({
        resourceId: skill._id,
        resourceType: 'skill',
        version: '1.0.0',
        versionNumber: 1,
        content: 'x',
        createdBy: owner._id,
      });
      await SkillPermissions.create({
        skillId: skill._id,
        visibility: 'private',
        allowComments: true,
        allowForks: false,
        collaborators: [],
      });
      await Comment.create({
        resourceId: skill._id,
        resourceType: 'skill',
        user: owner._id,
        userId: owner._id,
        content: 'nice',
      });

      await request(app)
        .delete(`/api/skills/${skill._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(await SkillVersion.countDocuments({ skillId: skill._id })).toBe(0);
      expect(await ResourceVersion.countDocuments({ resourceId: skill._id })).toBe(0);
      expect(await SkillPermissions.countDocuments({ skillId: skill._id })).toBe(0);
      expect(await Comment.countDocuments({ resourceId: skill._id })).toBe(0);
      expect(fs.existsSync(path.join(process.cwd(), zipRel))).toBe(false);
    });
  });

  describe('monotonic version numbers', () => {
    it('assigns sequential numbers regardless of semver strings', async () => {
      const resourceId = new MongooseTypes.ObjectId();
      const createdBy = owner._id;

      // The old parseInt scheme collided on exactly this pair.
      await createResourceVersion({
        resourceId,
        resourceType: 'skill',
        version: '11.0.0',
        content: 'a',
        files: [],
        changelog: 'x',
        tags: [],
        createdBy,
      });
      await createResourceVersion({
        resourceId,
        resourceType: 'skill',
        version: '1.10.0',
        content: 'b',
        files: [],
        changelog: 'x',
        tags: [],
        createdBy,
      });

      const docs = await ResourceVersion.find({ resourceId }).sort({ versionNumber: 1 });
      expect(docs.map((d) => d.versionNumber)).toEqual([1, 2]);
      expect(await nextVersionNumber(resourceId)).toBe(3);
    });
  });

  describe('POST /api/invitation/:token/accept', () => {
    it('joins the new enterprise and leaves the old roster', async () => {
      const inviter = await User.create({
        username: 'inviter',
        email: 'inviter@example.com',
        password: 'StrongPass123!',
      });
      const oldEnterprise = await Enterprise.create({
        name: 'Old Corp',
        owner: inviter._id,
        members: [{ userId: owner._id, role: 'member' }],
      });
      owner.enterpriseId = oldEnterprise._id;
      await owner.save();

      const newEnterprise = await Enterprise.create({
        name: 'New Corp',
        owner: inviter._id,
        members: [{ userId: inviter._id, role: 'admin' }],
      });
      const invitation = await Invitation.create({
        email: owner.email,
        enterpriseId: newEnterprise._id,
        invitedBy: inviter._id,
        role: 'member',
        token: 'tok-integrity-1',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      await request(app)
        .post(`/api/invitation/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const user = await User.findById(owner._id);
      expect(String(user?.enterpriseId)).toBe(String(newEnterprise._id));

      const newRoster = await Enterprise.findById(newEnterprise._id).select('members').lean();
      expect(newRoster?.members.some((m: any) => String(m.userId) === String(owner._id))).toBe(
        true,
      );

      const oldRoster = await Enterprise.findById(oldEnterprise._id).select('members').lean();
      expect(oldRoster?.members.some((m: any) => String(m.userId) === String(owner._id))).toBe(
        false,
      );

      const reloaded = await Invitation.findById(invitation._id);
      expect(reloaded?.status).toBe('accepted');
    });
  });
});
