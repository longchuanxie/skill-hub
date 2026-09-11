import fs from 'fs';
import path from 'path';
import { validateSkillUpload, SkillManifest } from './skillUploadValidator';
import { contentReviewConfig } from '../config/contentReviewConfig';
import { reviewPluginManager } from './reviewPluginManager';
import { ReviewContext } from '../types/reviewPlugin';

export interface AutoReviewResult {
  passed: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
  warnings: string[];
}

interface ReviewConfig {
  enableContentFilter: boolean;
  strictMode: boolean;
}

const MALICIOUS_PATTERNS = [
  '忽略所有指令', '绕过限制', '越狱', 'jailbreak',
  'ignore all instructions', 'bypass restrictions', 'override safety',
  '忽略安全', '绕过安全', '覆盖限制', 'override',
  '作为管理员', 'as admin', 'admin mode',
  'system prompt', 'system override', '角色扮演'
];

const INJECTION_PATTERNS = [
  'eval(', 'exec(', 'system(', '__import__',
  '<script>', 'javascript:', 'data:',
  'document.cookie', 'window.location',
  'process.env', 'require('
];

const ETHICS_PATTERNS = [
  '歧视', '偏见', 'stereotype', 'discrimination',
  '仇恨', 'hate', 'harassment',
  '侵犯隐私', 'privacy violation'
];

const HARMFUL_PATTERNS = [
  '生成恶意软件', 'create malware', 'hack',
  '制作武器', 'weapon', 'explosive',
  '欺诈', 'fraud', 'scam',
  '钓鱼', 'phishing', 'steal'
];

function checkMaliciousPatterns(...texts: string[]): { found: string[]; severity: 'high' } {
  const found: string[] = [];
  const combinedText = texts.join(' ').toLowerCase();

  for (const pattern of MALICIOUS_PATTERNS) {
    if (combinedText.includes(pattern.toLowerCase())) {
      found.push(`检测到潜在恶意指令模式: ${pattern}`);
    }
  }

  return { found, severity: 'high' as const };
}

function checkInjectionPatterns(...texts: string[]): { found: string[]; severity: 'high' } {
  const found: string[] = [];
  const combinedText = texts.join(' ');

  for (const pattern of INJECTION_PATTERNS) {
    if (combinedText.includes(pattern)) {
      found.push(`检测到代码注入模式: ${pattern}`);
    }
  }

  return { found, severity: 'high' as const };
}

function checkEthicsPatterns(...texts: string[]): { found: string[]; severity: 'medium' } {
  const found: string[] = [];
  const combinedText = texts.join(' ').toLowerCase();

  for (const pattern of ETHICS_PATTERNS) {
    if (combinedText.includes(pattern.toLowerCase())) {
      found.push(`检测到伦理问题: ${pattern}`);
    }
  }

  return { found, severity: 'medium' as const };
}

function checkHarmfulPatterns(...texts: string[]): { found: string[]; severity: 'high' } {
  const found: string[] = [];
  const combinedText = texts.join(' ').toLowerCase();

  for (const pattern of HARMFUL_PATTERNS) {
    if (combinedText.includes(pattern.toLowerCase())) {
      found.push(`检测到有害内容: ${pattern}`);
    }
  }

  return { found, severity: 'high' as const };
}

function checkDescriptionQuality(description: string): { valid: boolean; issues: string[]; severity: 'low' } {
  const issues: string[] = [];
  
  if (description.length < 10) {
    issues.push('描述过于简短，无法说明功能用途');
  }
  
  if (description.length > 5000) {
    issues.push('描述过长，建议精简');
  }
  
  const hasFunctionKeyword = /功能|作用|用途|实现|提供|帮助|assist/i.test(description);
  if (!hasFunctionKeyword) {
    issues.push('描述未说明功能用途');
  }
  
  return { valid: issues.length === 0, issues, severity: 'low' as const };
}

function checkPromptFormat(content: string): { valid: boolean; issues: string[]; severity: 'low' } {
  const issues: string[] = [];
  
  if (content.length < 20) {
    issues.push('Prompt内容过短，可能无法提供有效指导');
  }
  
  if (content.length > 50000) {
    issues.push('Prompt内容过长，可能影响模型理解');
  }
  
  const hasVariablePlaceholder = /\{\{|\}\}/.test(content);
  if (!hasVariablePlaceholder) {
    issues.push('Prompt未使用变量占位符，可能影响灵活性');
  }
  
  const lineCount = content.split('\n').length;
  if (lineCount > 50) {
    issues.push('Prompt行数过多，建议分段或使用模板');
  }
  
  return { valid: issues.length === 0, issues, severity: 'low' as const };
}

function checkSkillStructure(skillData: any): { valid: boolean; issues: string[]; severity: 'medium' } {
  const issues: string[] = [];
  
  if (!skillData.name || skillData.name.trim().length === 0) {
    issues.push('技能名称不能为空');
  }
  
  if (skillData.name.length > 100) {
    issues.push('技能名称过长（最多100字符）');
  }
  
  if (!skillData.description || skillData.description.trim().length === 0) {
    issues.push('技能描述不能为空');
  }
  
  if (skillData.description.length > 5000) {
    issues.push('技能描述过长（最多5000字符）');
  }
  
  if (!skillData.category) {
    issues.push('技能分类不能为空');
  }
  
  return { valid: issues.length === 0, issues, severity: 'medium' as const };
}

function checkPromptStructure(promptData: any): { valid: boolean; issues: string[]; severity: 'medium' } {
  const issues: string[] = [];
  
  if (!promptData.name || promptData.name.trim().length === 0) {
    issues.push('提示词名称不能为空');
  }
  
  if (promptData.name.length > 100) {
    issues.push('提示词名称过长（最多100字符）');
  }
  
  if (!promptData.description || promptData.description.trim().length === 0) {
    issues.push('提示词描述不能为空');
  }
  
  if (promptData.description.length > 2000) {
    issues.push('提示词描述过长（最多2000字符）');
  }
  
  if (!promptData.content || promptData.content.trim().length === 0) {
    issues.push('提示词内容不能为空');
  }
  
  if (promptData.variables && promptData.variables.length > 0) {
    for (let i = 0; i < promptData.variables.length; i++) {
      const variable = promptData.variables[i];
      if (!variable.name || variable.name.trim().length === 0) {
        issues.push(`变量${i + 1}名称不能为空`);
      }
      if (!variable.type) {
        issues.push(`变量${variable.name || i + 1}缺少类型定义`);
      }
    }
  }
  
  return { valid: issues.length === 0, issues, severity: 'medium' as const };
}

function maxSeverity(
  a: 'low' | 'medium' | 'high',
  b: 'low' | 'medium' | 'high'
): 'low' | 'medium' | 'high' {
  const severityMap = { low: 0, medium: 1, high: 2 };
  const max = Math.max(severityMap[a], severityMap[b]);
  return Object.keys(severityMap).find(
    key => severityMap[key as keyof typeof severityMap] === max
  ) as 'low' | 'medium' | 'high';
}

export async function reviewSkill(skillData: any, filePath?: string): Promise<AutoReviewResult> {
  if (!contentReviewConfig.enabled) {
    return {
      passed: true,
      reasons: [],
      severity: 'low',
      warnings: ['内容审核已禁用，自动通过'],
    };
  }

  if (reviewPluginManager.shouldUseCustomPlugin()) {
    try {
      await reviewPluginManager.initialize();
      const context: ReviewContext = {
        resourceType: 'skill',
        resourceData: skillData,
        filePath,
        metadata: {
          hasFile: !!filePath,
        },
      };
      const result = await reviewPluginManager.review(context);
      return {
        passed: result.passed,
        reasons: result.reasons,
        severity: result.severity,
        warnings: result.warnings,
      };
    } catch (error) {
      console.error('Custom review plugin failed:', error);
      if (contentReviewConfig.strictMode) {
        return {
          passed: false,
          reasons: [`自定义审核插件失败: ${error instanceof Error ? error.message : '未知错误'}`],
          severity: 'high',
          warnings: [],
        };
      }
    }
  }

  const reasons: string[] = [];
  const warnings: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  const structureCheck = checkSkillStructure(skillData);
  if (!structureCheck.valid) {
    reasons.push(...structureCheck.issues);
    severity = maxSeverity(severity, structureCheck.severity);
  }

  if (!contentReviewConfig.skipMaliciousCodeCheck) {
    const maliciousCheck = checkMaliciousPatterns(skillData.name, skillData.description);
    if (maliciousCheck.found.length > 0) {
      reasons.push(...maliciousCheck.found);
      severity = maxSeverity(severity, maliciousCheck.severity);
    }

    const injectionCheck = checkInjectionPatterns(skillData.name, skillData.description);
    if (injectionCheck.found.length > 0) {
      reasons.push(...injectionCheck.found);
      severity = maxSeverity(severity, injectionCheck.severity);
    }
  }

  if (!contentReviewConfig.skipSensitiveInfoCheck) {
    const ethicsCheck = checkEthicsPatterns(skillData.name, skillData.description);
    if (ethicsCheck.found.length > 0) {
      reasons.push(...ethicsCheck.found);
      severity = maxSeverity(severity, ethicsCheck.severity);
    }

    const harmfulCheck = checkHarmfulPatterns(skillData.name, skillData.description);
    if (harmfulCheck.found.length > 0) {
      reasons.push(...harmfulCheck.found);
      severity = maxSeverity(severity, harmfulCheck.severity);
    }
  }

  const qualityCheck = checkDescriptionQuality(skillData.description);
  if (!qualityCheck.valid) {
    warnings.push(...qualityCheck.issues);
  }

  if (filePath && !contentReviewConfig.skipFormatValidation) {
    try {
      const validationResult = await validateSkillUpload(filePath, path.join(process.cwd(), 'temp', `review-${Date.now()}`));
      if (!validationResult.valid) {
        const fileErrors = validationResult.errors.map(e => {
          if (e.includes('malicious pattern') || e.includes('jailbreak pattern')) {
            return `ZIP包文件内容安全检查失败: ${e}`;
          } else if (e.includes('sensitive information')) {
            return `ZIP包包含敏感信息: ${e}`;
          } else if (e.includes('exceeds size limit')) {
            return `ZIP包大小限制: ${e}`;
          } else {
            return `ZIP包验证失败: ${e}`;
          }
        });
        reasons.push(...fileErrors);
        severity = maxSeverity(severity, 'high');
      } else if (validationResult.structure && validationResult.format === 'SKILL.md') {
        const structure = validationResult.structure as SkillManifest;
        warnings.push(`ZIP包结构验证通过，包含${structure.name} v${structure.version || '1.0.0'}`);
      }
    } catch (error) {
      reasons.push(`ZIP包验证过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`);
      severity = maxSeverity(severity, 'high');
    }
  }

  return {
    passed: severity !== 'high',
    reasons,
    severity,
    warnings
  };
}

export async function reviewPrompt(promptData: any): Promise<AutoReviewResult> {
  if (!contentReviewConfig.enabled) {
    return {
      passed: true,
      reasons: [],
      severity: 'low',
      warnings: ['内容审核已禁用，自动通过'],
    };
  }

  if (reviewPluginManager.shouldUseCustomPlugin()) {
    try {
      await reviewPluginManager.initialize();
      const context: ReviewContext = {
        resourceType: 'prompt',
        resourceData: promptData,
        metadata: {},
      };
      const result = await reviewPluginManager.review(context);
      return {
        passed: result.passed,
        reasons: result.reasons,
        severity: result.severity,
        warnings: result.warnings,
      };
    } catch (error) {
      console.error('Custom review plugin failed:', error);
      if (contentReviewConfig.strictMode) {
        return {
          passed: false,
          reasons: [`自定义审核插件失败: ${error instanceof Error ? error.message : '未知错误'}`],
          severity: 'high',
          warnings: [],
        };
      }
    }
  }

  const reasons: string[] = [];
  const warnings: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  const structureCheck = checkPromptStructure(promptData);
  if (!structureCheck.valid) {
    reasons.push(...structureCheck.issues);
    severity = maxSeverity(severity, structureCheck.severity);
  }

  if (!contentReviewConfig.skipMaliciousCodeCheck) {
    const maliciousCheck = checkMaliciousPatterns(
      promptData.name,
      promptData.description,
      promptData.content
    );
    if (maliciousCheck.found.length > 0) {
      reasons.push(...maliciousCheck.found);
      severity = maxSeverity(severity, maliciousCheck.severity);
    }

    const injectionCheck = checkInjectionPatterns(
      promptData.name,
      promptData.description,
      promptData.content
    );
    if (injectionCheck.found.length > 0) {
      reasons.push(...injectionCheck.found);
      severity = maxSeverity(severity, injectionCheck.severity);
    }
  }

  if (!contentReviewConfig.skipSensitiveInfoCheck) {
    const ethicsCheck = checkEthicsPatterns(
      promptData.name,
      promptData.description,
      promptData.content
    );
    if (ethicsCheck.found.length > 0) {
      reasons.push(...ethicsCheck.found);
      severity = maxSeverity(severity, ethicsCheck.severity);
    }

    const harmfulCheck = checkHarmfulPatterns(
      promptData.name,
      promptData.description,
      promptData.content
    );
    if (harmfulCheck.found.length > 0) {
      reasons.push(...harmfulCheck.found);
      severity = maxSeverity(severity, harmfulCheck.severity);
    }
  }

  const formatCheck = checkPromptFormat(promptData.content);
  if (!formatCheck.valid) {
    warnings.push(...formatCheck.issues);
  }

  const qualityCheck = checkDescriptionQuality(promptData.description);
  if (!qualityCheck.valid) {
    warnings.push(...qualityCheck.issues);
  }

  return {
    passed: severity !== 'high',
    reasons,
    severity,
    warnings
  };
}
