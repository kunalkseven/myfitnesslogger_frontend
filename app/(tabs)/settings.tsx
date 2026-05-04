import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout } from '../../src/theme';
import { Card, Button } from '../../src/components';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { SyncService } from '../../src/services/SyncService';
import { UserRepository } from '../../src/database/repositories';
import { User } from '../../src/models';

export default function SettingsScreen() {
  const router = useRouter();
  const { isLoaded, userId, sessionId, getToken, signOut } = useAuth();
  const { user } = useUser();
  const { db } = useDatabase();
  
  const [localUser, setLocalUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!db) return;
      const repo = new UserRepository(db);
      const idToFetch = userId || 'guest_user';
      let u = await repo.getUser(idToFetch);
      
      // If no guest user exists yet, we just show defaults
      if (u) {
        setLocalUser(u);
      }
    }
    loadUser();
  }, [db, userId]);

  const updatePreference = async (key: string, value: any) => {
    if (!db || !localUser) return;
    const repo = new UserRepository(db);
    
    const newPrefs = { ...localUser.preferences, [key]: value };
    await repo.upsertUser(localUser.id, { preferences: newPrefs });
    setLocalUser({ ...localUser, preferences: newPrefs });
  };

  const toggleUnits = () => {
    const current = localUser?.preferences.units || 'metric';
    updatePreference('units', current === 'metric' ? 'imperial' : 'metric');
  };

  const toggleNotifications = () => {
    const current = localUser?.preferences.notificationsEnabled ?? true;
    updatePreference('notificationsEnabled', !current);
  };

  const cycleRestTimer = () => {
    const current = localUser?.preferences.restTimerDefaultSeconds || 90;
    let next = 60;
    if (current === 60) next = 90;
    else if (current === 90) next = 120;
    
    updatePreference('restTimerDefaultSeconds', next);
  };

  const handleSync = async () => {
    if (!db || !getToken) return;
    try {
      const token = await getToken();
      const syncService = new SyncService(db);
      await syncService.sync(token);
      Alert.alert('Sync Successful', 'Your local changes have been pushed to NeonDB.');
    } catch (error) {
      console.error(error);
      Alert.alert('Sync Failed', 'Please check your connection and try again.');
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.textSecondary }}>Loading Auth...</Text>
      </View>
    );
  }

  const prefs = localUser?.preferences || {
    units: 'metric',
    restTimerDefaultSeconds: 90,
    notificationsEnabled: true
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Settings</Text>

        {userId ? (
          <Card variant="elevated" style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.userName}>{user?.primaryEmailAddress?.emailAddress || 'User'}</Text>
                <Text style={styles.userSub}>Synced with NeonDB</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Button
              title="Sync Now"
              variant="secondary"
              icon="sync-outline"
              onPress={handleSync}
              style={{ marginBottom: Spacing.md }}
            />

            <Button
              title="Sign Out"
              variant="danger"
              icon="log-out-outline"
              onPress={handleSignOut}
            />
          </Card>
        ) : (
          <Card variant="highlighted" style={styles.authCard}>
            <Ionicons name="cloud-upload" size={48} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: Spacing.md }} />
            <Text style={styles.authTitle}>Backup to Cloud</Text>
            <Text style={styles.authDesc}>Sign in with Clerk to sync your workouts across devices using NeonDB.</Text>

            <Button
              title="Sign In / Sign Up"
              variant="primary"
              onPress={() => router.push('/(auth)/sign-in')}
            />
          </Card>
        )}

        <Text style={styles.sectionTitle}>App Preferences</Text>
        <Card variant="default" style={styles.settingsGroup}>
          <SettingItem 
            icon="notifications-outline" 
            label="Notifications" 
            value={prefs.notificationsEnabled ? "Enabled" : "Disabled"} 
            onPress={toggleNotifications}
          />
          <SettingItem 
            icon="barbell-outline" 
            label="Units" 
            value={prefs.units === 'metric' ? "Metric (kg)" : "Imperial (lbs)"} 
            onPress={toggleUnits}
          />
          <SettingItem 
            icon="timer-outline" 
            label="Rest Timer" 
            value={`${prefs.restTimerDefaultSeconds}s`} 
            onPress={cycleRestTimer}
          />
        </Card>

        <Text style={styles.sectionTitle}>Support</Text>
        <Card variant="default" style={styles.settingsGroup}>
          <SettingItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
          <SettingItem icon="star-outline" label="Rate the App" onPress={() => {}} />
          <SettingItem icon="information-circle-outline" label="Version" value="1.0.0" />
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ icon, label, value, onPress }: { icon: any, label: string, value?: string, onPress?: () => void }) {
  const content = (
    <View style={[styles.settingItem, !onPress && { opacity: 0.7 }]}>
      <View style={styles.settingLabel}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} />
        <Text style={styles.settingText}>{label}</Text>
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }
  return content;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: Layout.screenPaddingHorizontal },
  header: { ...Typography.displayMedium, color: Colors.textPrimary, marginBottom: Spacing.xl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  profileCard: { padding: Spacing.lg, marginBottom: Spacing.xl },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.primaryMuted },
  userName: { ...Typography.h3, color: Colors.textPrimary },
  userSub: { ...Typography.caption, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },

  authCard: { padding: Spacing.xl, marginBottom: Spacing.xl, alignItems: 'center' },
  authTitle: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  authDesc: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },

  sectionTitle: { ...Typography.labelSmall, color: Colors.textTertiary, marginLeft: Spacing.xs, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  settingsGroup: { padding: 0, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingText: { ...Typography.bodyLarge, color: Colors.textPrimary },
  settingValue: { ...Typography.bodyMedium, color: Colors.textSecondary, marginRight: Spacing.sm },
});
