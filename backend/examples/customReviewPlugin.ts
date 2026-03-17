import { ReviewPlugin, ReviewContext, ReviewResult } from '../types/reviewPlugin';

const customReviewPlugin: ReviewPlugin = {
  name: 'enterprise-custom-review',
  version: '1.0.0',
  description: '企业自定义内容审核插件',

  async review(context: ReviewContext): Promise<ReviewResult> {
    const { resourceType, resourceData, filePath } = context;
    const reasons: string[] = [];
    const warnings: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    if (resourceType === 'skill') {
      if (!resourceData.name || resourceData.name.trim().length === 0) {
        reasons.push('技能名称不能为空');
        severity = 'high';
      }

      if (!resourceData.description || resourceData.description.trim().length === 0) {
        reasons.push('技能描述不能为空');
        severity = 'high';
      }

      if (resourceData.name && resourceData.name.length > 50) {
        warnings.push('技能名称建议不超过50字符');
      }

      if (resourceData.description && resourceData.description.length < 20) {
        warnings.push('技能描述过于简短');
      }
    } else if (resourceType === 'prompt') {
      if (!resourceData.name || resourceData.name.trim().length === 0) {
        reasons.push('提示词名称不能为空');
        severity = 'high';
      }

      if (!resourceData.content || resourceData.content.trim().length === 0) {
        reasons.push('提示词内容不能为空');
        severity = 'high';
      }

      if (resourceData.content && resourceData.content.length > 10000) {
        warnings.push('提示词内容过长，可能影响性能');
      }
    }

    return {
      passed: severity !== 'high',
      reasons,
      severity,
      warnings,
      customData: {
        reviewedBy: 'enterprise-custom-review',
        reviewedAt: new Date().toISOString(),
      },
    };
  },

  async validate(): Promise<boolean> {
    return true;
  },

  async cleanup(): Promise<void> {
    console.log('Enterprise custom review plugin cleanup');
  },
};

export default customReviewPlugin;
