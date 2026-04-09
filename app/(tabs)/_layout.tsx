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
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
