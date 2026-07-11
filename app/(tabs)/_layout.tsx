import { Tabs } from 'expo-router';
import React from 'react';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';

export const unstable_settings = {
  initialRouteName: 'feed',
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="communities" options={{ title: 'Circles' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Warmth' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  );
}
