import { body } from 'express-validator';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH })
    .withMessage(`用户名长度必须在 ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} 个字符之间`)
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('邮箱地址过长'),
  body('password')
    .trim()
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`密码长度必须在 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 个字符之间`)
    .matches(passwordStrengthRegex)
    .withMessage('密码必须包含大写字母、小写字母、数字和特殊字符'),
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('邮箱地址过长'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('请输入密码')
    .isLength({ max: PASSWORD_MAX_LENGTH })
    .withMessage('密码格式无效'),
];

export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空')
    .isLength({ max: 500 })
    .withMessage('令牌格式无效'),
];

export const sendCodeValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('邮箱地址过长'),
];

export const verifyCodeValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('邮箱地址过长'),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('请输入6位数字验证码'),
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('邮箱地址过长'),
];

export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空')
    .isLength({ max: 500 })
    .withMessage('令牌格式无效'),
  body('password')
    .trim()
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`密码长度必须在 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 个字符之间`)
    .matches(passwordStrengthRegex)
    .withMessage('密码必须包含大写字母、小写字母、数字和特殊字符'),
];

export const changePasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('请输入当前密码')
    .isLength({ max: PASSWORD_MAX_LENGTH })
    .withMessage('密码格式无效'),
  body('newPassword')
    .trim()
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`新密码长度必须在 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 个字符之间`)
    .matches(passwordStrengthRegex)
    .withMessage('新密码必须包含大写字母、小写字母、数字和特殊字符')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('新密码不能与当前密码相同');
      }
      return true;
    }),
];

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`密码长度至少需要 ${PASSWORD_MIN_LENGTH} 个字符`);
  }
  
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`密码长度不能超过 ${PASSWORD_MAX_LENGTH} 个字符`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符');
  }
  
  const commonPasswords = [
    'password', 'Password1!', '12345678', 'Qwerty123!',
    'Admin123!', 'Welcome1!', 'Passw0rd!', 'Password123!'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    errors.push('密码不能包含常见弱密码');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
