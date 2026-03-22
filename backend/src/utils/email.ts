import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { createLogger } from './logger';

const logger = createLogger('email');

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
  fromEmail?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

let defaultTransporter: Transporter | null = null;

function getDefaultSMTPConfig(): SMTPConfig | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromName = process.env.SMTP_FROM_NAME || 'SkillHub';
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || 'noreply@skillhub.com';

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    fromName,
    fromEmail,
  };
}

export function createTransporter(config: SMTPConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

export function getDefaultTransporter(): Transporter | null {
  if (!defaultTransporter) {
    const config = getDefaultSMTPConfig();
    if (!config) {
      logger.warn('SMTP configuration not found, email sending disabled');
      return null;
    }
    defaultTransporter = createTransporter(config);
  }
  return defaultTransporter;
}

export async function sendEmail(
  options: EmailOptions,
  smtpConfig?: SMTPConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let transporter: Transporter | null;
    let fromEmail: string;
    let fromName: string;

    if (smtpConfig) {
      transporter = createTransporter(smtpConfig);
      fromEmail = smtpConfig.fromEmail || smtpConfig.user;
      fromName = smtpConfig.fromName || 'SkillHub';
    } else {
      transporter = getDefaultTransporter();
      const config = getDefaultSMTPConfig();
      if (!config) {
        logger.warn('SMTP not configured, simulating email send', { to: options.to, subject: options.subject });
        console.log(`\n[EMAIL SIMULATION] To: ${options.to}, Subject: ${options.subject}\n${options.text || options.html}\n`);
        return { success: true, messageId: `simulated-${Date.now()}` };
      }
      fromEmail = config.fromEmail || config.user;
      fromName = config.fromName || 'SkillHub';
      transporter = createTransporter(config);
    }

    const mailOptions: SendMailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

export async function verifySMTPConnection(smtpConfig?: SMTPConfig): Promise<{ success: boolean; error?: string }> {
  try {
    let transporter: Transporter | null;

    if (smtpConfig) {
      transporter = createTransporter(smtpConfig);
    } else {
      transporter = getDefaultTransporter();
      if (!transporter) {
        return { success: false, error: 'SMTP not configured' };
      }
    }

    await transporter.verify();
    logger.info('SMTP connection verified successfully');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('SMTP connection verification failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

export const EmailTemplates = {
  verificationCode: (code: string, expiresInMinutes: number): { subject: string; html: string; text: string } => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; }
          .code-box { 
            background: #f5f5f5; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px; 
            margin: 20px 0;
          }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          .warning { color: #e53935; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SkillHub</div>
          </div>
          <h2>验证码</h2>
          <p>您正在请求验证码，请使用以下验证码完成操作：</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p class="warning">此验证码将在 ${expiresInMinutes} 分钟后失效，请尽快使用。</p>
          <p>如果您没有请求此验证码，请忽略此邮件。</p>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>&copy; ${new Date().getFullYear()} SkillHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `
SkillHub 验证码

您正在请求验证码，请使用以下验证码完成操作：

验证码：${code}

此验证码将在 ${expiresInMinutes} 分钟后失效，请尽快使用。

如果您没有请求此验证码，请忽略此邮件。

此邮件由系统自动发送，请勿回复。
© ${new Date().getFullYear()} SkillHub. All rights reserved.
    `;
    return { subject: 'SkillHub 验证码', html, text };
  },

  passwordReset: (username: string, resetLink: string): { subject: string; html: string; text: string } => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; }
          .button { 
            display: inline-block; 
            background: #000; 
            color: #fff; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .link-box {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          .warning { color: #e53935; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SkillHub</div>
          </div>
          <h2>重置密码</h2>
          <p>您好 ${username}，</p>
          <p>我们收到了重置您账户密码的请求。请点击下方按钮重置密码：</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">重置密码</a>
          </p>
          <p>如果按钮无法点击，请复制以下链接到浏览器：</p>
          <div class="link-box">
            <a href="${resetLink}">${resetLink}</a>
          </div>
          <p class="warning">此链接将在 1 小时后失效。</p>
          <p>如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。</p>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>&copy; ${new Date().getFullYear()} SkillHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `
SkillHub 密码重置

您好 ${username}，

我们收到了重置您账户密码的请求。请点击以下链接重置密码：

${resetLink}

此链接将在 1 小时后失效。

如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。

此邮件由系统自动发送，请勿回复。
© ${new Date().getFullYear()} SkillHub. All rights reserved.
    `;
    return { subject: 'SkillHub 密码重置', html, text };
  },

  welcome: (username: string): { subject: string; html: string; text: string } => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; }
          .button { 
            display: inline-block; 
            background: #000; 
            color: #fff; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SkillHub</div>
          </div>
          <h2>欢迎加入 SkillHub！</h2>
          <p>亲爱的 ${username}，</p>
          <p>感谢您注册 SkillHub！我们很高兴欢迎您的加入。</p>
          <p>SkillHub 是一个 AI 资源共享平台，您可以在这里：</p>
          <ul>
            <li>发现和使用各种 AI 技能</li>
            <li>分享您创建的技能和提示词</li>
            <li>与社区成员交流学习</li>
          </ul>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">开始探索</a>
          </p>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>&copy; ${new Date().getFullYear()} SkillHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `
欢迎加入 SkillHub！

亲爱的 ${username}，

感谢您注册 SkillHub！我们很高兴欢迎您的加入。

SkillHub 是一个 AI 资源共享平台，您可以在这里：
- 发现和使用各种 AI 技能
- 分享您创建的技能和提示词
- 与社区成员交流学习

立即开始探索：${process.env.FRONTEND_URL || 'http://localhost:5173'}

此邮件由系统自动发送，请勿回复。
© ${new Date().getFullYear()} SkillHub. All rights reserved.
    `;
    return { subject: '欢迎加入 SkillHub！', html, text };
  },

  passwordChanged: (username: string): { subject: string; html: string; text: string } => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; }
          .alert { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SkillHub</div>
          </div>
          <h2>密码已更改</h2>
          <p>亲爱的 ${username}，</p>
          <p>您的账户密码已成功更改。</p>
          <div class="alert">
            <strong>安全提示：</strong> 如果您没有进行此操作，请立即联系我们的支持团队并修改密码。
          </div>
          <p>为了保护您的账户安全，建议您：</p>
          <ul>
            <li>使用强密码（包含大小写字母、数字和特殊字符）</li>
            <li>不要在多个网站使用相同的密码</li>
            <li>定期更换密码</li>
          </ul>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>&copy; ${new Date().getFullYear()} SkillHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `
SkillHub 密码已更改

亲爱的 ${username}，

您的账户密码已成功更改。

【安全提示】如果您没有进行此操作，请立即联系我们的支持团队并修改密码。

为了保护您的账户安全，建议您：
- 使用强密码（包含大小写字母、数字和特殊字符）
- 不要在多个网站使用相同的密码
- 定期更换密码

此邮件由系统自动发送，请勿回复。
© ${new Date().getFullYear()} SkillHub. All rights reserved.
    `;
    return { subject: 'SkillHub 密码已更改', html, text };
  },
};
