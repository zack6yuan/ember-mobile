import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, FlatList } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Appearance } from 'react-native';
import { PostCard } from '@/components/PostCard';
import { usePosts } from '@/store/PostsContext';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');
  const { posts } = usePosts();

  const toggleDarkMode = (value: boolean) => {
    setIsDark(value);
    Appearance.setColorScheme(value ? 'dark' : 'light');
  };

  const profilePosts = posts.filter(p => p.author === 'CodeBlueVeteran');

  const renderHeader = () => (
    <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
      <View style={styles.profileInfo}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>C</Text>
        </View>
        <Text style={[styles.username, { color: colors.text }]}>CodeBlueVeteran</Text>
        <Text style={styles.bio}>Registered Nurse | ER | Coffee Addict</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>1,204</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>342</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Ionicons name="moon" size={20} color={colors.text} style={styles.settingIcon} />
          <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
          <Switch 
            value={isDark} 
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#34C759' }}
          />
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Posts</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={profilePosts}
        contentContainerStyle={{ paddingBottom: 150 }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard id={item.id} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  profileInfo: { alignItems: 'center', marginBottom: 20 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  username: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  bio: { fontSize: 14, color: '#666', marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 12, width: '100%' },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888' },
  statDivider: { width: 1, height: 30 },
  actionsContainer: { width: '100%', marginBottom: 20 },
  editButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12 },
  settingIcon: { marginRight: 12 },
  settingText: { flex: 1, fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10 }
});
