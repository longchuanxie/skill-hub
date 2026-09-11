import fs from 'fs';
import path from 'path';
import { ReviewPlugin, ReviewContext, ReviewResult, ReviewPluginConfig } from '../types/reviewPlugin';
import { contentReviewConfig } from '../config/contentReviewConfig';
import { logger } from '../utils/logger';

class ReviewPluginManager {
  private plugins: Map<string, ReviewPlugin> = new Map();
  private pluginConfigs: Map<string, ReviewPluginConfig> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!contentReviewConfig.customPluginPath) {
      logger.info('No custom review plugin path configured, using built-in review');
      this.initialized = true;
      return;
    }

    try {
      const pluginPath = path.resolve(contentReviewConfig.customPluginPath);
      
      if (!fs.existsSync(pluginPath)) {
        logger.warn(`Custom review plugin not found at ${pluginPath}, using built-in review`);
        this.initialized = true;
        return;
      }

      const pluginModule = await import(pluginPath);
      const plugin: ReviewPlugin = pluginModule.default || pluginModule;

      if (!this.validatePlugin(plugin)) {
        throw new Error('Invalid review plugin structure');
      }

      if (plugin.validate && !(await plugin.validate())) {
        throw new Error('Plugin validation failed');
      }

      this.plugins.set(plugin.name, plugin);
      this.pluginConfigs.set(plugin.name, {
        enabled: true,
        priority: 100,
        timeout: contentReviewConfig.timeout,
      });

      logger.info(`Custom review plugin loaded: ${plugin.name} v${plugin.version}`);
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to load custom review plugin:', error);
      logger.info('Falling back to built-in review');
      this.initialized = true;
    }
  }

  shouldUseCustomPlugin(): boolean {
    return !!contentReviewConfig.customPluginPath && this.plugins.size > 0;
  }

  private validatePlugin(plugin: any): plugin is ReviewPlugin {
    return (
      typeof plugin === 'object' &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.description === 'string' &&
      typeof plugin.review === 'function'
    );
  }

  async review(context: ReviewContext): Promise<ReviewResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const enabledPlugins = Array.from(this.pluginConfigs.entries())
      .filter(([_, config]) => config.enabled)
      .sort((a, b) => b[1].priority - a[1].priority);

    if (enabledPlugins.length === 0) {
      return this.getDefaultResult(context);
    }

    for (const [pluginName, config] of enabledPlugins) {
      const plugin = this.plugins.get(pluginName);
      if (!plugin) continue;

      try {
        const result = await this.executeWithTimeout(
          plugin.review,
          context,
          config.timeout || contentReviewConfig.timeout
        );
        
        if (!result.passed && contentReviewConfig.strictMode) {
          return result;
        }
        
        return result;
      } catch (error) {
        logger.error(`Plugin ${pluginName} review failed:`, error);
        
        if (contentReviewConfig.strictMode) {
          return {
            passed: false,
            reasons: [`Review plugin ${pluginName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            severity: 'high',
            warnings: [],
          };
        }
      }
    }

    return this.getDefaultResult(context);
  }

  private async executeWithTimeout<T>(
    fn: (context: ReviewContext) => Promise<T>,
    context: ReviewContext,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(context),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Review timeout')), timeout)
      ),
    ]) as Promise<T>;
  }

  private getDefaultResult(context: ReviewContext): ReviewResult {
    return {
      passed: true,
      reasons: [],
      severity: 'low',
      warnings: ['No review plugin configured, using default approval'],
    };
  }

  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup();
        } catch (error) {
          logger.error('Plugin cleanup failed:', error);
        }
      }
    }
    this.plugins.clear();
    this.pluginConfigs.clear();
    this.initialized = false;
  }

  getPluginStatus(): Array<{ name: string; version: string; enabled: boolean }> {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      enabled: this.pluginConfigs.get(plugin.name)?.enabled || false,
    }));
  }
}

export const reviewPluginManager = new ReviewPluginManager();
