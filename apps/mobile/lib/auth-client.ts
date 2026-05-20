import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'https://flux-api.kepler-industries.com';

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: 'flux',
      storagePrefix: 'flux',
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
