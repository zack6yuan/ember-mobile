import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INITIAL_NOTIFICATIONS = [
  { id: '1', type: 'upvote', user: null, text: 'Someone upvoted your post "Tips for surviving..."', time: '10m ago', unread: true },
  { id: '2', type: 'comment', user: 'NightShiftNinja', text: 'commented on your post.', time: '1h ago', unread: true },
  { id: '3', type: 'upvote', user: null, text: 'Your comment got 50 upvotes!', time: '3h ago', unread: false },
  { id: '4', type: 'mention', user: 'TravelRN101', text: 'mentioned you in ERNurses', time: '1d ago', unread: false },
  { id: '5', type: 'system', user: 'Scrubs Team', text: 'Welcome to Scrubs! Find your community today.', time: '2d ago', unread: false },
];

const FILTERS = ['All', 'Mentions', 'Replies'];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('All');
  const insets = useSafeAreaInsets();

  const getIconData = (type: string) => {
    switch(type) {
      case 'upvote': return { name: 'arrow-up', color: '#fff', bg: '#FF4500' };
      case 'comment': return { name: 'chatbubble', color: '#fff', bg: '#007AFF' };
      case 'mention': return { name: 'at', color: '#fff', bg: '#AF52DE' };
      case 'system': return { name: 'medical', color: '#fff', bg: '#34C759' };
      default: return { name: 'notifications', color: '#fff', bg: '#888' };
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({...n, unread: false})));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Mentions') return n.type === 'mention';
    if (activeFilter === 'Replies') return n.type === 'comment';
    return true;
  });

  const renderHeader = () => (
    <View style={[styles.headerBlock, { backgroundColor: colors.background }]}>
      <View style={styles.headerTopRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Activity</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map(filter => (
          <TouchableOpacity 
            key={filter}
            style={[
              styles.filterPill,
              activeFilter === filter ? styles.filterPillActive : { backgroundColor: colors.card, borderColor: colors.border }
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter ? styles.filterTextActive : { color: colors.text }
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 150 }}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          const iconData = getIconData(item.type);
          return (
            <TouchableOpacity 
              style={[
                styles.card, 
                { 
                  backgroundColor: item.unread ? 'rgba(0, 122, 255, 0.08)' : colors.card, 
                  borderBottomColor: colors.border 
                }
              ]}
              onPress={() => {
                setNotifications(prev => prev.map(n => n.id === item.id ? {...n, unread: false} : n));
              }}
            >
              {item.unread && <View style={styles.unreadDot} />}
              <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
                <Ionicons name={iconData.name as any} size={20} color={iconData.color} />
              </View>
              <View style={styles.content}>
                <Text style={[styles.text, { color: colors.text }]}>
                  {item.user ? <Text style={styles.boldUser}>{item.user} </Text> : null}
                  {item.text}
                </Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  markReadText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingLeft: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    position: 'absolute',
    left: 6,
    top: '50%',
    marginTop: -4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  boldUser: {
    fontWeight: 'bold',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
});
