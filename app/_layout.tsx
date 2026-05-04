/**
 * MuscleMemory — Root Layout
 * Sets up providers and global configuration.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { tokenCache } from '../src/utils/tokenCache';
import { DatabaseProvider, useDatabase } from '../src/database/DatabaseProvider';
import { UserRepository } from '../src/database/repositories';
import { SyncService } from '../src/services/SyncService';
import { Colors } from '../src/theme';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthManager() {
  const { isSignedIn, userId } = useAuth();
  const { db, isReady, isWeb } = useDatabase();
  const router = useRouter();

  React.useEffect(() => {
    if (!isReady || isWeb || !db || !isSignedIn || !userId) return;

    async function checkUser() {
      try {
        const repo = new UserRepository(db);
        const user = await repo.getUser(userId!);
        if (!user) {
          router.replace('/onboarding');
        }
      } catch (err) {
        console.error('AuthManager error:', err);
      }
    }

    checkUser();
  }, [isReady, isWeb, db, isSignedIn, userId, router]);

  return null;
}

function SyncManager() {
  const { getToken, isSignedIn } = useAuth();
  const { db, isReady, isWeb } = useDatabase();

  React.useEffect(() => {
    if (!isReady || isWeb || !db || !isSignedIn) return;

    async function runSync() {
      try {
        const token = await getToken();
        if (!token) return;
        const syncService = new SyncService(db);
        await syncService.pull(token);
        await syncService.sync(token);
      } catch (err) {
        console.error('SyncManager error:', err);
      }
    }

    runSync();
  }, [isReady, isWeb, db, isSignedIn, getToken]);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <ClerkLoaded>
        <DatabaseProvider>
          <AuthManager />
          <SyncManager />
          <View style={styles.container}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack>
          </View>
        </DatabaseProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
