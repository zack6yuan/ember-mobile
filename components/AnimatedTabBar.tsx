import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const AnimatedTabBarItem = ({ 
  isFocused, 
  onPress, 
  onLongPress, 
  label, 
  iconName 
}: {
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  label: string;
  iconName: IconName;
}) => {
  const width = useSharedValue(isFocused ? 120 : 50);
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    width.value = withTiming(isFocused ? 120 : 50, { duration: 250 });
    opacity.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <TouchableOpacity
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={styles.tabItemContainer}
    >
      <Animated.View style={[styles.tabItem, animatedStyle, isFocused && styles.tabItemActive]}>
        <Ionicons 
          name={iconName} 
          size={22} 
          color={isFocused ? '#111' : '#888'} 
        />
        {isFocused && (
          <Animated.Text style={[styles.tabLabel, animatedTextStyle]} numberOfLines={1}>
            {label}
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { bottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName: IconName = 'home';
        if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === 'communities') iconName = isFocused ? 'search' : 'search-outline'; // using search based on image
        else if (route.name === 'post') iconName = isFocused ? 'add-circle' : 'add-circle-outline';
        else if (route.name === 'notifications') iconName = isFocused ? 'notifications' : 'notifications-outline';
        else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';
        
        // Based on the user's reference image, maybe use cart/offers for other things, but they specifically said:
        // "keep the same name of tabs that we already have"
        // So I'll just map the existing tabs to similar icons as the reference or what we used before.
        
        if (route.name === 'communities') iconName = isFocused ? 'search' : 'search-outline'; // In reference image, 2nd icon is search
        else if (route.name === 'post') iconName = isFocused ? 'pricetag' : 'pricetag-outline'; // percent in reference
        else if (route.name === 'notifications') iconName = isFocused ? 'basket' : 'basket-outline'; // basket in ref

        // actually, let's keep the semantic icons from our previous implementation as that makes more sense for a Reddit clone!
        if (route.name === 'index') iconName = 'home';
        else if (route.name === 'communities') iconName = 'search';
        else if (route.name === 'post') iconName = 'add';
        else if (route.name === 'notifications') iconName = 'notifications';
        else if (route.name === 'profile') iconName = 'person';
        // for simplicity, outline versions can just be outline suffix
        if (!isFocused && iconName !== 'add') {
          iconName = `${iconName}-outline` as IconName;
        }

        return (
          <AnimatedTabBarItem
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            label={label as string}
            iconName={iconName}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItemContainer: {
    paddingHorizontal: 4, // tight spacing
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 30, // Pill shape
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, // expand more when active
  },
  tabLabel: {
    color: '#111',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
});
