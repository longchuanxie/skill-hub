# SkillHub 后端 - OAuth2认证拓展设计

## 1. 概述

### 1.1 需求背景

企业私部署场景下，通常需要与企业现有的身份管理系统（IdP）集成，实现单点登录（SSO）。OAuth2是目前企业级SSO的事实标准，支持与Okta、Azure AD、Keycloak、Auth0等主流身份提供商对接。

### 1.2 设计目标

- 支持多种OAuth2/OIDC身份提供商
- 支持Authorization Code Flow（推荐）和Client Credentials Flow
- 支持SCIM协议进行用户目录同步
- 保持现有邮箱密码认证方式不受影响
- 支持混合认证模式（本地+OAuth2）

### 1.3 支持的OAuth2提供者

| 提供商 | 类型 | 支持协议 | 说明 |
|--------|------|----------|------|
| Azure AD | 企业 | OAuth2/OIDC | Microsoft生态 |
| Okta | 企业 | OAuth2/OIDC | 通用IdP |
| Keycloak | 开源 | OAuth2/OIDC | 自托管 |
| Auth0 | SaaS | OAuth2/OIDC | 通用IdP |
| Google Workspace | 企业 | OAuth2 | Google生态 |
| GitHub Enterprise | 企业 | OAuth2 | GitHub组织 |

## 2. 数据模型设计

### 2.1 OAuth2客户端模型

```typescript
// src/models/OAuthClient.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthClient extends Document {
  clientId: string;
  clientSecret: string;
  name: string;
  description?: string;
  provider: 'azure' | 'okta' | 'keycloak' | 'auth0' | 'google' | 'github' | 'custom';
  providerConfig: {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    userInfoEndpoint: string;
    jwksUri?: string;
    scopes: string[];
    issuer?: string;
    tenantId?: string;
    organizationId?: string;
  };
  redirectUris: string[];
  grantTypes: ('authorization_code' | 'client_credentials' | 'refresh_token')[];
  responseTypes: ('code' | 'token')[];
  tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'none';
  allowedOrigins: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthClientSchema = new Schema<IOAuthClient>(
  {
    clientId: { type: String, required: true, unique: true },
    clientSecret: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    provider: { 
      type: String, 
      required: true, 
      enum: ['azure', 'okta', 'keycloak', 'auth0', 'google', 'github', 'custom'] 
    },
    providerConfig: {
      authorizationEndpoint: { type: String, required: true },
      tokenEndpoint: { type: String, required: true },
      userInfoEndpoint: { type: String },
      jwksUri: { type: String },
      scopes: [{ type: String }],
      issuer: { type: String },
      tenantId: { type: String },
      organizationId: { type: String },
    },
    redirectUris: [{ type: String, required: true }],
    grantTypes: [{
      type: String,
      enum: ['authorization_code', 'client_credentials', 'refresh_token'],
    }],
    responseTypes: [{
      type: String,
      enum: ['code', 'token'],
    }],
    tokenEndpointAuthMethod: {
      type: String,
      enum: ['client_secret_basic', 'client_secret_post', 'none'],
      default: 'client_secret_post',
    },
    allowedOrigins: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const OAuthClient = mongoose.model<IOAuthClient>('OAuthClient', OAuthClientSchema);
```

### 2.2 OAuth2授权码模型

```typescript
// src/models/OAuthAuthorizationCode.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthAuthorizationCode extends Document {
  code: string;
  clientId: string;
  userId: mongoose.Types.ObjectId;
  redirectUri: string;
  scope: string[];
  expiresAt: Date;
  usedAt?: Date;
  codeChallenge?: string;
  codeChallengeMethod?: 'plain' | 'S256';
}

const OAuthAuthorizationCodeSchema = new Schema<IOAuthAuthorizationCode>({
  code: { type: String, required: true, unique: true, index: true },
  clientId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  redirectUri: { type: String, required: true },
  scope: [{ type: String }],
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date },
  codeChallenge: { type: String },
  codeChallengeMethod: { type: String, enum: ['plain', 'S256'] },
});

export const OAuthAuthorizationCode = mongoose.model<IOAuthAuthorizationCode>(
  'OAuthAuthorizationCode', 
  OAuthAuthorizationCodeSchema
);
```

### 2.3 OAuth2令牌模型

```typescript
// src/models/OAuthToken.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthToken extends Document {
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  userId: mongoose.Types.ObjectId;
  scope: string[];
  expiresAt: Date;
  tokenType: string;
  idToken?: string;
  provider: string;
  providerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthTokenSchema = new Schema<IOAuthToken>({
  accessToken: { type: String, required: true, unique: true, index: true },
  refreshToken: { type: String, index: true },
  clientId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scope: [{ type: String }],
  expiresAt: { type: Date, required: true, index: true },
  tokenType: { type: String, default: 'Bearer' },
  idToken: { type: String },
  provider: { type: String, required: true },
  providerUserId: { type: String, required: true },
}, { timestamps: true });

OAuthTokenSchema.index({ userId: 1, provider: 1 });

export const OAuthToken = mongoose.model<IOAuthToken>('OAuthToken', OAuthTokenSchema);
```

### 2.4 用户模型扩展

```typescript
// 在现有User模型中添加OAuth2相关字段
const UserSchemaExtension = {
  // OAuth2关联账户
  oauthAccounts: [{
    provider: { type: String, required: true },
    providerUserId: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    profile: { type: Schema.Types.Mixed },
    linkedAt: { type: Date, default: Date.now },
  }],
  
  // 认证方式
  authProviders: {
    type: [String],
    enum: ['email', 'azure', 'okta', 'keycloak', 'auth0', 'google', 'github'],
    default: ['email'],
  },
  
  // SSO强制标志（企业管理员可设置）
  ssoRequired: { type: Boolean, default: false },
  ssoProvider: { type: String },
  
  // 最后一次通过OAuth2登录的时间
  lastOAuthLoginAt: { type: Date },
};
```

### 2.5 企业SSO配置模型

```typescript
// src/models/EnterpriseSSO.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IEnterpriseSSO extends Document {
  enterpriseId: mongoose.Types.ObjectId;
  enabled: boolean;
  provider: 'azure' | 'okta' | 'keycloak' | 'custom';
  config: {
    clientId: string;
    clientSecret: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    userInfoEndpoint: string;
    jwksUri?: string;
    issuer: string;
    scopes: string[];
    tenantId?: string;
    organizationId?: string;
  };
  mappings: {
    emailField: string;
    usernameField?: string;
    firstNameField?: string;
    lastNameField?: string;
    groupsField?: string;
  };
  autoProvision: boolean;
  allowedDomains: string[];
  enforceSSO: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EnterpriseSSOSchema = new Schema<IEnterpriseSSO>({
  enterpriseId: { type: Schema.Types.ObjectId, ref: 'Enterprise', required: true, unique: true },
  enabled: { type: Boolean, default: false },
  provider: { 
    type: String, 
    enum: ['azure', 'okta', 'keycloak', 'custom'],
    required: true 
  },
  config: {
    clientId: { type: String, required: true },
    clientSecret: { type: String, required: true },
    authorizationEndpoint: { type: String, required: true },
    tokenEndpoint: { type: String, required: true },
    userInfoEndpoint: { type: String },
    jwksUri: { type: String },
    issuer: { type: String, required: true },
    scopes: [{ type: String }],
    tenantId: { type: String },
    organizationId: { type: String },
  },
  mappings: {
    emailField: { type: String, default: 'email' },
    usernameField: { type: String },
    firstNameField: { type: String },
    lastNameField: { type: String },
    groupsField: { type: String },
  },
  autoProvision: { type: Boolean, default: true },
  allowedDomains: [{ type: String }],
  enforceSSO: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const EnterpriseSSO = mongoose.model<IEnterpriseSSO>('EnterpriseSSO', EnterpriseSSOSchema);
```

## 3. API接口设计

### 3.1 OAuth2授权端点

#### 3.1.1 授权请求

```
GET /api/oauth/authorize
```

**参数：**

| 参数 | 必填 | 类型 | 说明 |
|------|------|------|------|
| response_type | 是 | string | `code` 或 `token` |
| client_id | 是 | string | OAuth2客户端ID |
| redirect_uri | 是 | string | 回调URI |
| scope | 是 | string | 空格分隔的权限列表 |
| state | 推荐 | string | CSRF防护状态码 |
| code_challenge | 否 | string | PKCE代码挑战 |
| code_challenge_method | 否 | string | `plain` 或 `S256` |

**响应（需要用户登录）：**

```html
<!-- 用户已登录，直接跳转 -->
HTTP 302 Location: {redirect_uri}?code={authorization_code}&state={state}
```

```html
<!-- 用户未登录，返回登录页面，带回OAuth2参数 -->
HTTP 302 Location: /login?oauth_params={base64_encoded_params}
```

#### 3.1.2 令牌交换

```
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded
```

**Authorization Code Flow：**

| 参数 | 必填 | 说明 |
|------|------|------|
| grant_type | 是 | `authorization_code` |
| code | 是 | 授权码 |
| redirect_uri | 是 | 回调URI |
| client_id | 是 | 客户端ID |
| client_secret | 是 | 客户端密钥 |
| code_verifier | 否 | PKCE代码验证器 |

**Response：**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "scope": "openid profile email",
  "id_token": "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6..."
}
```

**Client Credentials Flow：**

| 参数 | 必填 | 说明 |
|------|------|------|
| grant_type | 是 | `client_credentials` |
| scope | 否 | 请求的权限 |

#### 3.1.3 刷新令牌

```
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={refresh_token}&client_id={client_id}&client_secret={client_secret}
```

#### 3.1.4 撤销令牌

```
POST /api/oauth/revoke
Content-Type: application/x-www-form-urlencoded

token={token_to_revoke}&client_id={client_id}&client_secret={client_secret}
```

### 3.2 用户信息端点

```
GET /api/oauth/userinfo
Authorization: Bearer {access_token}
```

**响应：**

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://example.com/avatar.jpg",
  "groups": ["developers", "admins"]
}
```

### 3.3 OpenID Connect发现

```
GET /.well-known/openid-configuration
```

**响应：**

```json
{
  "issuer": "https://skillhub.example.com",
  "authorization_endpoint": "https://skillhub.example.com/api/oauth/authorize",
  "token_endpoint": "https://skillhub.example.com/api/oauth/token",
  "userinfo_endpoint": "https://skillhub.example.com/api/oauth/userinfo",
  "jwks_uri": "https://skillhub.example.com/api/oauth/keys",
  "revocation_endpoint": "https://skillhub.example.com/api/oauth/revoke",
  "response_types_supported": ["code", "token"],
  "grant_types_supported": ["authorization_code", "client_credentials", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "claims_supported": ["sub", "iss", "aud", "exp", "iat", "email", "email_verified", "name"]
}
```

### 3.4 JWKS端点

```
GET /api/oauth/keys
```

**响应：**

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "skillhub-key-1",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZpt... (公钥指数)",
      "e": "AQAB"
    }
  ]
}
```

### 3.5 OAuth2客户端管理API

#### 创建OAuth2客户端（管理员）

```
POST /api/oauth/clients
权限: admin
```

**请求：**

```json
{
  "name": "企业应用A",
  "description": "用于企业内部系统集成",
  "provider": "azure",
  "providerConfig": {
    "authorizationEndpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    "tokenEndpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "userInfoEndpoint": "https://graph.microsoft.com/oidc/userinfo",
    "jwksUri": "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
    "scopes": ["openid", "profile", "email", "User.Read"],
    "issuer": "https://login.microsoftonline.com/{tenant}/v2.0"
  },
  "redirectUris": ["https://app.example.com/callback"],
  "grantTypes": ["authorization_code", "refresh_token"],
  "responseTypes": ["code"],
  "tokenEndpointAuthMethod": "client_secret_post",
  "allowedOrigins": ["https://app.example.com"]
}
```

**响应：**

```json
{
  "clientId": "a1b2c3d4e5f6",
  "clientSecret": "secret_generated_at_runtime",
  "name": "企业应用A",
  "redirectUris": ["https://app.example.com/callback"],
  "grantTypes": ["authorization_code", "refresh_token"],
  "status": "active"
}
```

### 3.6 企业SSO管理API

#### 获取企业SSO配置

```
GET /api/enterprises/:id/sso
权限: enterprise_admin
```

#### 配置企业SSO

```
PUT /api/enterprises/:id/sso
权限: enterprise_admin
```

**请求：**

```json
{
  "enabled": true,
  "provider": "azure",
  "config": {
    "clientId": "enterprise-client-id",
    "clientSecret": "enterprise-client-secret",
    "authorizationEndpoint": "https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize",
    "tokenEndpoint": "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
    "issuer": "https://login.microsoftonline.com/tenant/v2.0",
    "scopes": ["openid", "profile", "email", "User.Read"]
  },
  "mappings": {
    "emailField": "email",
    "usernameField": "upn",
    "firstNameField": "givenName",
    "lastNameField": "surname",
    "groupsField": "groups"
  },
  "autoProvision": true,
  "allowedDomains": ["example.com"],
  "enforceSSO": true
}
```

### 3.7 账户关联API

#### 关联OAuth2账户

```
POST /api/users/me/oauth/link
权限: 需要认证
```

**请求：**

```json
{
  "provider": "azure",
  "authorizationCode": "user_provided_code"
}
```

#### 解除OAuth2账户关联

```
DELETE /api/users/me/oauth/link/:provider
权限: 需要认证
```

#### 获取已关联的OAuth2账户

```
GET /api/users/me/oauth/linked
权限: 需要认证
```

**响应：**

```json
{
  "accounts": [
    {
      "provider": "azure",
      "email": "user@company.com",
      "linkedAt": "2024-01-15T10:30:00Z"
    },
    {
      "provider": "github",
      "email": "user@github.com",
      "linkedAt": "2024-02-20T14:20:00Z"
    }
  ]
}
```

## 4. 中间件设计

### 4.1 OAuth2授权中间件

```typescript
// src/middleware/oauth.ts
import { Request, Response, NextFunction } from 'express';
import { OAuthClient } from '../models/OAuthClient';
import { OAuthAuthorizationCode } from '../models/OAuthAuthorizationCode';

export const validateOAuthClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { client_id, redirect_uri } = req.query;

  if (!client_id) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'client_id is required' });
  }

  const client = await OAuthClient.findOne({ 
    clientId: client_id, 
    status: 'active' 
  });

  if (!client) {
    return res.status(400).json({ error: 'invalid_client', error_description: 'unknown client_id' });
  }

  if (!client.redirectUris.includes(redirect_uri as string)) {
    return res.status(400).json({ 
      error: 'invalid_request', 
      error_description: 'invalid redirect_uri' 
    });
  }

  req.oauthClient = client;
  next();
};

export const validateAuthorizationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code, client_id, redirect_uri } = req.body;

  const authCode = await OAuthAuthorizationCode.findOne({
    code,
    clientId: client_id,
    redirectUri: redirect_uri,
  });

  if (!authCode) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'invalid or expired code' });
  }

  if (authCode.expiresAt < new Date()) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'code expired' });
  }

  if (authCode.usedAt) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'code already used' });
  }

  req.oauthAuthCode = authCode;
  next();
};

export const validatePKCE = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code_verifier, code_challenge, code_challenge_method } = req.body;
  const authCode = req.oauthAuthCode;

  if (!code_challenge) {
    return next();
  }

  if (!code_verifier) {
    return res.status(400).json({ 
      error: 'invalid_request', 
      error_description: 'code_verifier required' 
    });
  }

  if (authCode.codeChallengeMethod === 'S256') {
    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(code_verifier)
      .digest('base64url');
    
    if (hash !== code_challenge) {
      return res.status(400).json({ 
        error: 'invalid_grant', 
        error_description: 'code_verifier does not match code_challenge' 
      });
    }
  } else if (code_verifier !== code_challenge) {
    return res.status(400).json({ 
      error: 'invalid_grant', 
      error_description: 'code_verifier does not match code_challenge' 
    });
  }

  next();
};
```

### 4.2 企业SSO验证中间件

```typescript
// src/middleware/enterprise-sso.ts
import { Request, Response, NextFunction } from 'express';
import { EnterpriseSSO } from '../models/EnterpriseSSO';
import { User } from '../models/User';

export const enforceEnterpriseSSO = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  
  if (!userId) {
    return next();
  }

  const user = await User.findById(userId);
  
  if (!user?.enterpriseId) {
    return next();
  }

  const ssoConfig = await EnterpriseSSO.findOne({
    enterpriseId: user.enterpriseId,
    enabled: true,
    enforceSSO: true,
  });

  if (ssoConfig && !user.authProviders.includes(ssoConfig.provider)) {
    return res.status(403).json({
      error: 'sso_required',
      error_description: 'This enterprise requires SSO authentication. Please link your SSO account.',
      ssoProvider: ssoConfig.provider,
    });
  }

  next();
};
```

## 5. OAuth2服务实现

### 5.1 OAuth2授权服务

```typescript
// src/services/oauth-authorization.ts
import crypto from 'crypto';
import { OAuthClient } from '../models/OAuthClient';
import { OAuthAuthorizationCode } from '../models/OAuthAuthorizationCode';
import { User } from '../models/User';
import { generateJWT, generateRefreshToken } from './jwt';

export class OAuthAuthorizationService {
  async generateAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scope: string[],
    options?: {
      codeChallenge?: string;
      codeChallengeMethod?: 'plain' | 'S256';
    }
  ): Promise<string> {
    const code = crypto.randomBytes(32).toString('base64url');
    
    await OAuthAuthorizationCode.create({
      code,
      clientId,
      userId: new Types.ObjectId(userId),
      redirectUri,
      scope,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      codeChallenge: options?.codeChallenge,
      codeChallengeMethod: options?.codeChallengeMethod,
    });

    return code;
  }

  async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<TokenResponse> {
    const client = await OAuthClient.findOne({ clientId, clientSecret });
    if (!client) {
      throw new Error('invalid_client');
    }

    const authCode = await OAuthAuthorizationCode.findOne({
      code,
      clientId,
      redirectUri,
    });

    if (!authCode || authCode.expiresAt < new Date()) {
      throw new Error('invalid_grant');
    }

    if (authCode.usedAt) {
      throw new Error('invalid_grant');
    }

    authCode.usedAt = new Date();
    await authCode.save();

    const user = await User.findById(authCode.userId);
    if (!user) {
      throw new Error('user_not_found');
    }

    const accessToken = await generateJWT(user, client, authCode.scope);
    const refreshTokenValue = await generateRefreshToken(user, client);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshTokenValue,
      scope: authCode.scope.join(' '),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<TokenResponse> {
    const tokenRecord = await this.validateRefreshToken(refreshToken, clientId);
    const user = await User.findById(tokenRecord.userId);
    
    if (!user) {
      throw new Error('invalid_grant');
    }

    const client = await OAuthClient.findOne({ clientId, clientSecret });
    const accessToken = await generateJWT(user, client, tokenRecord.scope);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: tokenRecord.scope.join(' '),
    };
  }
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token?: string;
}
```

### 5.2 OAuth2提供商集成服务

```typescript
// src/services/oauth-provider.ts
import axios from 'axios';

export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  groups?: string[];
}

export class OAuthProviderService {
  async getUserInfo(
    provider: string,
    accessToken: string,
    providerConfig: any
  ): Promise<OAuthUserInfo> {
    switch (provider) {
      case 'azure':
        return this.getAzureUserInfo(accessToken, providerConfig);
      case 'okta':
        return this.getOktaUserInfo(accessToken, providerConfig);
      case 'google':
        return this.getGoogleUserInfo(accessToken);
      case 'github':
        return this.getGitHubUserInfo(accessToken);
      default:
        return this.getGenericUserInfo(accessToken, providerConfig);
    }
  }

  private async getAzureUserInfo(accessToken: string, config: any): Promise<OAuthUserInfo> {
    const response = await axios.get(config.userInfoEndpoint || 'https://graph.microsoft.com/oidc/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.sub,
      email: response.data.email || response.data.preferred_username,
      name: response.data.name,
      firstName: response.data.given_name,
      lastName: response.data.surname,
      picture: response.data.picture,
    };
  }

  private async getOktaUserInfo(accessToken: string, config: any): Promise<OAuthUserInfo> {
    const response = await axios.get(config.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.sub,
      email: response.data.email,
      name: response.data.name,
      firstName: response.data.given_name,
      lastName: response.data.family_name,
      picture: response.data.picture,
      groups: response.data.groups,
    };
  }

  private async getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.id,
      email: response.data.email,
      name: response.data.name,
      firstName: response.data.given_name,
      lastName: response.data.family_name,
      picture: response.data.picture,
    };
  }

  private async getGitHubUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const emailsResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const primaryEmail = emailsResponse.data.find((e: any) => e.primary)?.email;

    return {
      id: String(response.data.id),
      email: primaryEmail || response.data.email,
      name: response.data.name,
      firstName: response.data.name?.split(' ')[0],
      lastName: response.data.name?.split(' ').slice(1).join(' '),
      picture: response.data.avatar_url,
    };
  }

  private async getGenericUserInfo(accessToken: string, config: any): Promise<OAuthUserInfo> {
    const response = await axios.get(config.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.sub || response.data.id,
      email: response.data.email,
      name: response.data.name,
      firstName: response.data.given_name,
      lastName: response.data.family_name,
      picture: response.data.picture,
    };
  }

  async exchangeCodeForTokens(
    provider: string,
    code: string,
    redirectUri: string,
    config: any
  ): Promise<{ accessToken: string; refreshToken?: string; idToken?: string }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const response = await axios.post(config.tokenEndpoint, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      idToken: response.data.id_token,
    };
  }
}
```

## 6. 安全性设计

### 6.1 安全措施

1. **PKCE支持**
   - 强制公共客户端使用PKCE
   - 支持S256代码挑战方法

2. **令牌安全**
   - 访问令牌短期有效（默认1小时）
   - 刷新令牌长期有效，可撤销
   - 令牌存储加密

3. **CSRF防护**
   - 授权请求强制使用state参数
   - 回调验证state一致性

4. **客户端密钥管理**
   - 密钥哈希存储
   - 支持客户端密钥轮换

5. **范围限制**
   - 最小权限原则
   - 范围白名单

### 6.2 审计日志

```typescript
// src/models/AuditLog.ts
const AuditLogSchema = new Schema({
  event: { type: String, required: true },
  provider: { type: String },
  clientId: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  ipAddress: { type: String },
  userAgent: { type: String },
  success: { type: Boolean },
  error: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

// OAuth2审计事件
const OAUTH_AUDIT_EVENTS = {
  AUTHORIZATION_REQUEST: 'oauth.authorization_request',
  AUTHORIZATION_SUCCESS: 'oauth.authorization_success',
  TOKEN_ISSUED: 'oauth.token_issued',
  TOKEN_REFRESHED: 'oauth.token_refreshed',
  TOKEN_REVOKED: 'oauth.token_revoked',
  TOKEN_EXCHANGE_FAILED: 'oauth.token_exchange_failed',
  USER_INFO_REQUESTED: 'oauth.userinfo_requested',
  SSO_LINKED: 'oauth.sso_linked',
  SSO_UNLINKED: 'oauth.sso_unlinked',
};
```

## 7. 企业IdP配置模板

### 7.1 Azure AD配置

```json
{
  "provider": "azure",
  "config": {
    "authorizationEndpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    "tokenEndpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "userInfoEndpoint": "https://graph.microsoft.com/oidc/userinfo",
    "jwksUri": "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
    "issuer": "https://login.microsoftonline.com/{tenant}/v2.0",
    "scopes": [
      "openid",
      "profile",
      "email",
      "User.Read"
    ],
    "tenantId": "your-tenant-id"
  },
  "mappings": {
    "emailField": "email",
    "usernameField": "preferred_username",
    "firstNameField": "given_name",
    "lastNameField": "family_name",
    "groupsField": "groups"
  }
}
```

### 7.2 Okta配置

```json
{
  "provider": "okta",
  "config": {
    "authorizationEndpoint": "https://{your-domain}.okta.com/oauth2/default/v1/authorize",
    "tokenEndpoint": "https://{your-domain}.okta.com/oauth2/default/v1/token",
    "userInfoEndpoint": "https://{your-domain}.okta.com/oauth2/default/v1/userinfo",
    "jwksUri": "https://{your-domain}.okta.com/oauth2/default/v1/keys",
    "issuer": "https://{your-domain}.okta.com/oauth2/default",
    "scopes": [
      "openid",
      "profile",
      "email"
    ]
  },
  "mappings": {
    "emailField": "email",
    "usernameField": "preferred_username",
    "firstNameField": "given_name",
    "lastNameField": "family_name",
    "groupsField": "groups"
  }
}
```

### 7.3 Keycloak配置

```json
{
  "provider": "keycloak",
  "config": {
    "authorizationEndpoint": "https://keycloak.example.com/realms/{realm}/protocol/openid-connect/auth",
    "tokenEndpoint": "https://keycloak.example.com/realms/{realm}/protocol/openid-connect/token",
    "userInfoEndpoint": "https://keycloak.example.com/realms/{realm}/protocol/openid-connect/userinfo",
    "jwksUri": "https://keycloak.example.com/realms/{realm}/protocol/openid-connect/certs",
    "issuer": "https://keycloak.example.com/realms/{realm}",
    "scopes": [
      "openid",
      "profile",
      "email"
    ]
  },
  "mappings": {
    "emailField": "email",
    "usernameField": "username",
    "firstNameField": "firstName",
    "lastNameField": "lastName",
    "groupsField": "groups"
  }
}
```
