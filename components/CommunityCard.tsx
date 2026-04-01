import { Text } from '@/components/Text';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface CommunityCardProps {
  name: string;
  members: string;
  description: string;
}

export function CommunityCard({ name, members, description }: CommunityCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.iconPlaceholder}>
        <Text style={styles.iconText}>{name.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={styles.members}>{members} members</Text>
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>{description}</Text>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinText}>Join</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  members: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  description: {
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  joinText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
