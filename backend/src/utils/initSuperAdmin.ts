import { User } from '../models/User';
import { createLogger } from './logger';

const logger = createLogger('initSuperAdmin');

export interface SuperAdminConfig {
  username: string;
  email: string;
  password: string;
}

/**
 * 从环境变量获取超级管理员配置
 */
export function getSuperAdminConfigFromEnv(): SuperAdminConfig | null {
  const username = process.env.INITIAL_SUPER_ADMIN_USERNAME;
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL;
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD;

  if (!username || !email || !password) {
    logger.info('未配置初始超级管理员环境变量，跳过自动创建');
    return null;
  }

  // 验证配置有效性
  if (username.length < 3) {
    logger.error('初始超级管理员用户名长度不能少于3个字符');
    return null;
  }

  if (!email.includes('@')) {
    logger.error('初始超级管理员邮箱格式无效');
    return null;
  }

  if (password.length < 12) {
    logger.error('初始超级管理员密码长度不能少于12个字符');
    return null;
  }

  return { username, email, password };
}

/**
 * 初始化超级管理员账户
 * 在系统首次部署时自动创建初始超级管理员
 */
export async function initializeSuperAdmin(): Promise<void> {
  try {
    // 检查是否已存在超级管理员
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      logger.info('超级管理员已存在，跳过初始化');
      return;
    }

    // 获取环境变量配置
    const config = getSuperAdminConfigFromEnv();
    if (!config) {
      logger.warn('未配置初始超级管理员，系统将以无超级管理员状态运行');
      logger.warn('请通过以下环境变量配置初始超级管理员：');
      logger.warn('  INITIAL_SUPER_ADMIN_USERNAME=admin');
      logger.warn('  INITIAL_SUPER_ADMIN_EMAIL=admin@example.com');
      logger.warn('  INITIAL_SUPER_ADMIN_PASSWORD=your_secure_password');
      return;
    }

    // 检查邮箱是否已被使用
    const existingUser = await User.findOne({ email: config.email.toLowerCase() });
    if (existingUser) {
      logger.error(`邮箱 ${config.email} 已被使用，无法创建初始超级管理员`);
      return;
    }

    // 检查用户名是否已被使用
    const existingUsername = await User.findOne({ username: config.username });
    if (existingUsername) {
      logger.error(`用户名 ${config.username} 已被使用，无法创建初始超级管理员`);
      return;
    }

    // 创建超级管理员账户
    const superAdmin = new User({
      username: config.username,
      email: config.email.toLowerCase(),
      password: config.password,
      role: 'super_admin',
      isEmailVerified: true,
      isTwoFactorEnabled: false, // 首次创建时不强制启用，登录后引导设置
    });

    await superAdmin.save();

    logger.info('========================================');
    logger.info('初始超级管理员创建成功！');
    logger.info(`用户名: ${config.username}`);
    logger.info(`邮箱: ${config.email}`);
    logger.info('========================================');
    logger.info('重要提示：');
    logger.info('1. 请立即登录并修改初始密码');
    logger.info('2. 请启用双重认证以增强安全性');
    logger.info('3. 请创建其他管理员账户作为备份');
    logger.info('4. 建议删除或修改环境变量中的密码');
    logger.info('========================================');

  } catch (error) {
    logger.error('初始化超级管理员失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * 检查系统是否需要初始化超级管理员
 */
export async function needsSuperAdminInitialization(): Promise<boolean> {
  const count = await User.countDocuments({ role: 'super_admin' });
  return count === 0;
}
