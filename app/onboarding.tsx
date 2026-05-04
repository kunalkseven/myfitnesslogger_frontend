/**
 * MuscleMemory — Onboarding Screen
 * Feature highlights and getting started flow.
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../src/theme';
import { Button } from '../src/components';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    icon: 'barbell',
    iconColor: Colors.primary,
    title: 'Track Every Rep',
    subtitle: 'Log your sets quickly with smart defaults and auto-fill from your last session. Built for speed in the gym.',
  },
  {
    icon: 'calendar',
    iconColor: Colors.success,
    title: 'Structured Plans',
    subtitle: 'Follow proven splits like Push-Pull-Legs, Full Body, or Upper-Lower. Or create your own custom program.',
  },
  {
    icon: 'stats-chart',
    iconColor: Colors.warning,
    title: 'See Your Progress',
    subtitle: 'Track estimated 1RMs, volume trends, and muscle group balance. Watch your strength grow over time.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Logo ── */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Ionicons name="fitness" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.appName}>MuscleMemory</Text>
      </View>

      {/* ── Slides ── */}
      <FlatList
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.slideIcon, { backgroundColor: `${item.iconColor}15` }]}>
              <Ionicons name={item.icon} size={48} color={item.iconColor} />
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* ── Dots ── */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* ── CTA ── */}
      <View style={styles.ctaArea}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          size="lg"
          icon="arrow-forward"
          iconPosition="right"
          fullWidth
        />
        <Text style={styles.guestText}>
          No account needed. Your data stays on your device.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: Spacing.huge,
    gap: Spacing.md,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...Typography.h1,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.huge,
  },
  slideIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  slideTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  ctaArea: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  guestText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
