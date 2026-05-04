import React from 'react';
import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="active" />
      <Stack.Screen 
        name="summary" 
        options={{ gestureEnabled: false }} // Prevent swiping back to active workout
      />
    </Stack>
  );
}
