import { Tabs } from 'expo-router';
import React from 'react';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          headerTitle: 'SCRUBS',
          headerTitleStyle: { fontFamily: 'DynaPuff_700Bold', fontSize: 28 },
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
