import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: 'Sign In',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: 'Create Account',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}
