import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { OAuthProvider } from '../models/OAuthProvider';
import { OAuthSession } from '../models/OAuthSession';
import { User } from '../models/User';
import { generateAccessToken } from '../utils/jwt';
import axios from 'axios';

const getProviderConfig = (provider: string): { authorizationURL: string; tokenURL: string; userInfoURL: string; scope: string } | undefined => {
  const configs: Record<string, { authorizationURL: string; tokenURL: string; userInfoURL: string; scope: string }> = {
    google: {
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid profile email',
    },
    github: {
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      userInfoURL: 'https://api.github.com/user',
      scope: 'user:email',
    },
    microsoft: {
      authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoURL: 'https://graph.microsoft.com/v1.0/me',
      scope: 'openid profile email User.Read',
    },
  };
  return configs[provider];
};

const getNestedValue = (obj: any, path: string | undefined): string | undefined => {
  if (!path) return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj) as string | undefined;
};

export const getAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider: providerName } = req.params;
    const provider = Array.isArray(providerName) ? providerName[0] : (providerName || '');
    const { enterpriseId } = req.query;

    const oauthProvider = await OAuthProvider.findOne({
      provider: provider,
      $or: [
        { enterpriseId: null },
        { enterpriseId }
      ],
      isEnabled: true
    });

    if (!oauthProvider) {
      res.status(404).json({
        success: false,
        error: 'OAuth provider not found or not enabled'
      });
      return;
    }

    const config = getProviderConfig(provider as string);
    const isCustom = oauthProvider.provider === 'custom';

    if (!config && !isCustom) {
      res.status(400).json({
        success: false,
        error: 'Invalid OAuth provider'
      });
      return;
    }

    const callbackBaseUrl = process.env.OAUTH_CALLBACK_BASE_URL || 'http://localhost:3002';
    const callbackURL = isCustom 
      ? `${callbackBaseUrl}${oauthProvider.callbackPath}`
      : `${callbackBaseUrl}/api/oauth/callback/${provider}`;

    const state = Buffer.from(JSON.stringify({
      providerId: oauthProvider._id,
      redirectUri: callbackURL,
      enterpriseId: oauthProvider.enterpriseId
    })).toString('base64');

    if (isCustom) {
      const authUrl = new URL(oauthProvider.authorizationURL);
      authUrl.searchParams.set('client_id', oauthProvider.clientId);
      authUrl.searchParams.set('redirect_uri', callbackURL);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', oauthProvider.scope || '');
      authUrl.searchParams.set('state', state);

      res.json({
        success: true,
        data: {
          authUrl: authUrl.toString()
        }
      });
      return;
    }

    const authUrl = new URL(config!.authorizationURL);
    authUrl.searchParams.set('client_id', oauthProvider.clientId);
    authUrl.searchParams.set('redirect_uri', callbackURL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oauthProvider.scope || config!.scope);
    authUrl.searchParams.set('state', state);

    res.json({
      success: true,
      data: {
        authUrl: authUrl.toString()
      }
    });
  } catch (error) {
    console.error('获取授权URL时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate auth URL'
    });
  }
};

export const handleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider: providerName } = req.params;
    const provider = Array.isArray(providerName) ? providerName[0] : (providerName || '');
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({
        success: false,
        error: 'Missing code or state'
      });
      return;
    }

    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const { providerId, redirectUri, enterpriseId } = stateData;

    const oauthProvider = await OAuthProvider.findById(providerId);
    if (!oauthProvider) {
      res.status(404).json({
        success: false,
        error: 'OAuth provider not found'
      });
      return;
    }

    const effectiveProvider = oauthProvider.provider === 'custom' ? provider : oauthProvider.provider;
    const config = getProviderConfig(effectiveProvider);
    const isCustom = oauthProvider.provider === 'custom';

    if (!config && !isCustom) {
      res.status(400).json({
        success: false,
        error: 'Invalid OAuth provider'
      });
      return;
    }
    
    const tokenResponse = await axios.post(
      isCustom ? oauthProvider.tokenURL : config!.tokenURL, 
      isCustom 
        ? new URLSearchParams({
            client_id: oauthProvider.clientId,
            client_secret: oauthProvider.clientSecret,
            code: code as string,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }).toString()
        : new URLSearchParams({
            client_id: oauthProvider.clientId,
            client_secret: oauthProvider.clientSecret,
            code: code as string,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    let providerUserId: string;
    let email: string | undefined;
    let name: string | undefined;

    if (isCustom && oauthProvider.userInfoConfig) {
      const userInfoConfig = oauthProvider.userInfoConfig;
      
      const userInfoResponse = await axios({
        method: userInfoConfig.method,
        url: userInfoConfig.url,
        headers: {
          Authorization: `Bearer ${access_token}`,
          ...userInfoConfig.headers,
        },
        data: userInfoConfig.body,
      });

      providerUserId = getNestedValue(userInfoResponse.data, userInfoConfig.userIdPath) || String(Date.now());
      email = getNestedValue(userInfoResponse.data, userInfoConfig.emailPath);
      name = getNestedValue(userInfoResponse.data, userInfoConfig.namePath);
    } else {
      const userInfoResponse = await axios.get(config!.userInfoURL, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      providerUserId = userInfoResponse.data.id || userInfoResponse.data.sub;
      email = userInfoResponse.data.email;
      name = userInfoResponse.data.name || userInfoResponse.data.login;
    }

    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        username: name || `user_${providerUserId}`,
        email,
        password: `oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        role: 'user',
        isEmailVerified: true,
        enterpriseId: oauthProvider.enterpriseId,
      });
      await user.save();
    } else if (!user.enterpriseId && oauthProvider.enterpriseId) {
      user.enterpriseId = oauthProvider.enterpriseId;
      await user.save();
    }

    let oauthSession = await OAuthSession.findOne({
      userId: user._id,
      provider: provider
    });

    if (oauthSession) {
      oauthSession.accessToken = access_token;
      oauthSession.refreshToken = refresh_token;
      oauthSession.expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : undefined;
      await oauthSession.save();
    } else {
      oauthSession = new OAuthSession({
        userId: user._id,
        providerId: oauthProvider._id,
        provider: provider,
        providerUserId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined,
      });
      await oauthSession.save();
    }

    const token = generateAccessToken(user as any);

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth回调处理时出错:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth callback failed'
    });
  }
};

export const getProviders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enterpriseId } = req.query;

    const providers = await OAuthProvider.find({
      isEnabled: true,
      $or: [
        { enterpriseId: null },
        { enterpriseId }
      ]
    }).select('-clientSecret');

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('获取OAuth提供商列表时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch providers'
    });
  }
};

export const linkAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { provider: providerName } = req.params;
    const provider = Array.isArray(providerName) ? providerName[0] : (providerName || '');
    const userId = req.user?.userId;
    const { enterpriseId } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const oauthProvider = await OAuthProvider.findOne({
      provider: provider,
      isEnabled: true,
      $or: [
        { enterpriseId: null },
        { enterpriseId }
      ]
    });

    if (!oauthProvider) {
      res.status(404).json({
        success: false,
        error: 'OAuth provider not found'
      });
      return;
    }

    const config = getProviderConfig(provider as string);
    const isCustom = oauthProvider.provider === 'custom';

    if (!config && !isCustom) {
      res.status(400).json({
        success: false,
        error: 'Invalid OAuth provider'
      });
      return;
    }

    const callbackBaseUrl = process.env.OAUTH_CALLBACK_BASE_URL || 'http://localhost:3002';
    const callbackURL = isCustom 
      ? `${callbackBaseUrl}${oauthProvider.callbackPath}`
      : `${callbackBaseUrl}/api/oauth/callback/${provider}`;

    const state = Buffer.from(JSON.stringify({
      providerId: oauthProvider._id,
      redirectUri: callbackURL,
      action: 'link',
      userId,
      enterpriseId: oauthProvider.enterpriseId
    })).toString('base64');

    const authUrl = new URL(isCustom ? oauthProvider.authorizationURL : config!.authorizationURL);
    authUrl.searchParams.set('client_id', oauthProvider.clientId);
    authUrl.searchParams.set('redirect_uri', callbackURL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oauthProvider.scope || (isCustom ? '' : config!.scope));
    authUrl.searchParams.set('state', state);

    res.json({
      success: true,
      data: { authUrl: authUrl.toString() }
    });
  } catch (error) {
    console.error('链接账户时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link account'
    });
  }
};

export const createProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      name, provider, clientId, clientSecret, 
      authorizationURL, tokenURL, userInfoURL, scope,
      callbackPath, isEnabled, enterpriseId, userInfoConfig 
    } = req.body;

    const existingProvider = await OAuthProvider.findOne({ provider, enterpriseId });
    if (existingProvider) {
      res.status(400).json({
        success: false,
        error: 'OAUTH_PROVIDER_EXISTS',
        message: `OAuth provider '${provider}' is already configured for this enterprise`
      });
      return;
    }

    const oauthProvider = new OAuthProvider({
      name,
      provider,
      clientId,
      clientSecret,
      authorizationURL,
      tokenURL,
      userInfoURL,
      scope,
      callbackPath,
      isEnabled: isEnabled || false,
      enterpriseId,
      userInfoConfig
    });

    await oauthProvider.save();
    res.status(201).json({
      success: true,
      data: oauthProvider
    });
  } catch (error) {
    console.error('创建OAuth提供商时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create OAuth provider'
    });
  }
};

export const updateProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const oauthProvider = await OAuthProvider.findById(id);
    if (!oauthProvider) {
      res.status(404).json({
        success: false,
        error: 'OAuth provider not found'
      });
      return;
    }

    const allowedUpdates = ['name', 'clientId', 'clientSecret', 'authorizationURL', 'tokenURL', 'userInfoURL', 'scope', 'callbackPath', 'isEnabled', 'userInfoConfig'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        (oauthProvider as any)[field] = updates[field];
      }
    });

    await oauthProvider.save();
    res.json({
      success: true,
      data: oauthProvider
    });
  } catch (error) {
    console.error('更新OAuth提供商时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update OAuth provider'
    });
  }
};

export const deleteProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const oauthProvider = await OAuthProvider.findById(id);
    if (!oauthProvider) {
      res.status(404).json({
        success: false,
        error: 'OAuth provider not found'
      });
      return;
    }

    await OAuthProvider.findByIdAndDelete(id);
    res.json({
      success: true,
      message: 'OAuth provider deleted'
    });
  } catch (error) {
    console.error('删除OAuth提供商时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete OAuth provider'
    });
  }
};

export const getEnterpriseProviders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enterpriseId } = req.query;

    const providers = await OAuthProvider.find({
      enterpriseId: enterpriseId || null
    }).select('-clientSecret');

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('获取企业OAuth提供商列表时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enterprise providers'
    });
  }
};
