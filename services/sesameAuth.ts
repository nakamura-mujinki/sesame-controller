import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

// SESAME AWS Cognito Configuration (from official SDK)
const COGNITO_CONFIG = {
  region: 'ap-northeast-1',
  userPoolId: 'ap-northeast-1_bY2byhlCa',
  appClientId: '6ialca0p8u0lsgvbmvsljfm305',
};

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.userPoolId,
  ClientId: COGNITO_CONFIG.appClientId,
});

// Dummy password used by official SESAME app
const DUMMY_PASSWORD = 'dummypwk';

export type AuthState = 'idle' | 'awaiting_code' | 'authenticated' | 'error';

export interface SesameAuthResult {
  success: boolean;
  state: AuthState;
  email?: string;
  error?: string;
}

let currentCognitoUser: CognitoUser | null = null;

/**
 * Step 1: Start login with email
 * - First tries signUp (for new users)
 * - Then signIn (triggers custom challenge -> email code)
 */
export const startLogin = async (email: string): Promise<SesameAuthResult> => {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Try signup first (will fail if user exists, that's OK)
    await trySignUp(normalizedEmail);
    console.log('SignUp succeeded for new user');
  } catch (err: unknown) {
    // UsernameExistsException is expected for existing users
    const error = err as { code?: string; message?: string };
    console.log('SignUp error:', error.code, error.message);
    // Continue to signIn regardless of signup result
  }

  // Now sign in - this triggers the custom challenge (email code)
  try {
    console.log('Starting signIn...');
    const result = await signIn(normalizedEmail);
    console.log('SignIn result:', result);
    return result;
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('SignIn error:', error);
    return {
      success: false,
      state: 'error',
      error: error.message || 'Login failed',
    };
  }
};

/**
 * Step 2: Verify the 4-digit code from email
 */
export const verifyCode = async (code: string): Promise<SesameAuthResult> => {
  if (!currentCognitoUser) {
    return {
      success: false,
      state: 'error',
      error: 'No active login session',
    };
  }

  return new Promise((resolve) => {
    currentCognitoUser!.sendCustomChallengeAnswer(code, {
      onSuccess: (session) => {
        const email = session.getIdToken().payload['email'] as string;
        resolve({
          success: true,
          state: 'authenticated',
          email,
        });
      },
      onFailure: (err) => {
        resolve({
          success: false,
          state: 'error',
          error: err.message || 'Code verification failed',
        });
      },
      customChallenge: () => {
        // Still in challenge mode - code was wrong
        resolve({
          success: false,
          state: 'awaiting_code',
          error: 'Invalid code, please try again',
        });
      },
    });
  });
};

/**
 * Get current authenticated user's email
 */
export const getCurrentUser = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: { isValid: () => boolean } | null) => {
      if (err || !session?.isValid()) {
        resolve(null);
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err || !attributes) {
          resolve(null);
          return;
        }
        const emailAttr = attributes.find((a) => a.Name === 'email');
        resolve(emailAttr?.Value || null);
      });
    });
  });
};

/**
 * Get current session's ID token (for API calls if needed)
 */
export const getIdToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: { isValid: () => boolean; getIdToken: () => { getJwtToken: () => string } } | null) => {
      if (err || !session?.isValid()) {
        resolve(null);
        return;
      }
      resolve(session.getIdToken().getJwtToken());
    });
  });
};

/**
 * Sign out
 */
export const signOut = (): void => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  currentCognitoUser = null;
};

// Internal: Try to sign up (will throw if user exists)
const trySignUp = (email: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];

    userPool.signUp(email, DUMMY_PASSWORD, attributeList, [], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Internal: Sign in (triggers custom challenge)
const signIn = (email: string): Promise<SesameAuthResult> => {
  return new Promise((resolve) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: DUMMY_PASSWORD,
    });

    currentCognitoUser = cognitoUser;

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        // Immediate success (shouldn't happen with custom challenge)
        const userEmail = session.getIdToken().payload['email'] as string;
        resolve({
          success: true,
          state: 'authenticated',
          email: userEmail,
        });
      },
      onFailure: (err) => {
        currentCognitoUser = null;
        resolve({
          success: false,
          state: 'error',
          error: err.message || 'Authentication failed',
        });
      },
      customChallenge: () => {
        // This is expected - now waiting for email code
        resolve({
          success: true,
          state: 'awaiting_code',
          email,
        });
      },
    });
  });
};
