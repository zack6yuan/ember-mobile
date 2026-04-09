import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@react-navigation/native';
import { CommunityCard } from '@/components/CommunityCard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DUMMY_COMMUNITIES = [
  { id: '1', name: 'ERNurses', members: 45000, category: 'Critical Care', description: 'For emergency room nurses to share stories and advice.' },
  { id: '2', name: 'NightShift', members: 120000, category: 'General', description: 'Creatures of the night unite!' },
  { id: '3', name: 'TravelNursing', members: 80000, category: 'General', description: 'Tips, tricks, and contracts for travel RNs.' },
  { id: '4', name: 'StudentNurses', members: 200000, category: 'Education', description: 'For those currently braving nursing school.' },
  { id: '5', name: 'ICU_Life', members: 35000, category: 'Critical Care', description: 'Intensive care unit discussions and support.' },
  { id: '6', name: 'PediatricsRN', members: 42000, category: 'Specialty', description: 'Everything related to caring for our littlest patients.' },
  { id: '7', name: 'LND_Nurses', members: 28000, category: 'Specialty', description: 'Labor & Delivery nurses sharing the miracle of life.' },
  { id: '8', name: 'PsychNursing', members: 33000, category: 'Specialty', description: 'For psychiatric and mental health nurses.' },
  { id: '9', name: 'OR_Nurses', members: 50000, category: 'Specialty', description: 'Operating Room nurses - behind the double doors.' },
  { id: '10', name: 'MedSurg', members: 95000, category: 'General', description: 'The backbone of the hospital: Medical-Surgical floor.' },
];

const FILTERS = ['All', 'Large (>50k)', 'Small (<50k)', 'Critical Care', 'Specialty', 'General', 'Education'];

export default function CommunitiesScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const insets = useSafeAreaInsets();

  const filteredCommunities = DUMMY_COMMUNITIES.filter(comm => {
    const matchesSearch = comm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comm.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter === 'Large (>50k)') matchesFilter = comm.members >= 50000;
    else if (activeFilter === 'Small (<50k)') matchesFilter = comm.members < 50000;
    else if (activeFilter !== 'All') matchesFilter = comm.category === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerText, { color: colors.text }]}>Explore Communities</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontFamily: 'Outfit_400Regular' }]}
            placeholder="Search communities..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {FILTERS.map((filter) => (
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
      </View>
      
      <FlatList
        data={filteredCommunities}
        contentContainerStyle={{ paddingBottom: 150 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommunityCard
            name={item.name}
            members={(item.members / 1000).toFixed(0) + 'k'}
            description={item.description}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterWrapper: {
    // Keeping this wrapper empty to avoid clipping shadows if added later
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
    justifyContent: 'center',
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
});
