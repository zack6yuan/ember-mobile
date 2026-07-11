import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ember, EmberGradientAlt } from '@/constants/theme';
import { Text } from '@/components/Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, IconName> = {
  feed: 'home',
  communities: 'grid',
  explore: 'search',
  notifications: 'notifications',
  profile: 'person',
};

const AnimatedTabBarItem = ({
  isFocused,
  onPress,
  onLongPress,
  label,
  iconName,
}: {
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  label: string;
  iconName: IconName;
}) => {
  const width = useSharedValue(isFocused ? 116 : 46);
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    width.value = withTiming(isFocused ? 116 : 46, { duration: 240 });
    opacity.value = withTiming(isFocused ? 1 : 0, { duration: 240 });
  }, [isFocused, width, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ width: width.value }));
  const animatedTextStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      style={styles.itemContainer}
    >
      <Animated.View style={animatedStyle}>
        {isFocused ? (
          <LinearGradient colors={EmberGradientAlt} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.itemActive}>
            <Ionicons name={iconName} size={20} color={Ember.onGradient} />
            <Animated.View style={animatedTextStyle}>
              <Text style={styles.labelActive} numberOfLines={1}>
                {label}
              </Text>
            </Animated.View>
          </LinearGradient>
        ) : (
          <View style={styles.itemIdle}>
            <Ionicons name={`${iconName}-outline` as IconName} size={20} color={Ember.textMutedDeep} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { bottom: insets.bottom > 0 ? insets.bottom : 18 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <AnimatedTabBarItem
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            label={label as string}
            iconName={ICONS[route.name] ?? 'ellipse'}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Ember.surface2,
    borderWidth: 1,
    borderColor: Ember.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  itemContainer: { paddingHorizontal: 2 },
  itemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    gap: 7,
  },
  itemIdle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
  },
  labelActive: { color: Ember.onGradient, fontWeight: '700', fontSize: 13 },
});
