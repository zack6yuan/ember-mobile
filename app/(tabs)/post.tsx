import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '@/components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CATEGORIES = ['Question', 'Venting', 'Support', 'Humor', 'Success'];

export default function PostScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const { colors } = useTheme();
  const router = useRouter();

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'question': return '#00C4CC'; 
      case 'venting': return '#FF3B30';
      case 'support': return '#AF52DE';
      case 'success': return '#34C759';
      case 'humor': return '#FF9500';
      default: return colors.text;
    }
  };

  const handlePost = () => {
    setTitle('');
    setBody('');
    setCategory('');
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* User Profile Header */}
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>CodeBlueVeteran</Text>
        </View>

        {/* Input Area */}
        <TextInput
          style={[styles.inputTitle, { color: colors.text, fontFamily: 'Outfit_700Bold' }]}
          placeholder="What's on your mind? (e.g., Best shoes for a 12-hour shift?)"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
          multiline
        />
        
        <TextInput
          style={[styles.inputBody, { color: colors.text, fontFamily: 'Outfit_400Regular' }]}
          placeholder="Share your stories, ask for advice, or vent about your shift... Remember to keep it PHI-free!"
          placeholderTextColor="#888"
          multiline
          value={body}
          onChangeText={setBody}
          textAlignVertical="top"
        />

        {/* Category Sticky Bottom */}
        <View style={styles.categorySection}>
          <Text style={[styles.categoryHeader, { color: colors.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              const catColor = getCategoryColor(cat);
              return (
                <TouchableOpacity 
                  key={cat} 
                  style={[
                    styles.categoryPill, 
                    { 
                      backgroundColor: isActive ? catColor : 'transparent',
                      borderColor: isActive ? catColor : colors.border,
                      borderWidth: 1,
                    }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryText, 
                    { color: isActive ? '#fff' : colors.text }
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Privacy Disclaimer */}
        <View style={[styles.disclaimerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="shield-half" size={20} color="#FF9500" style={styles.disclaimerIcon} />
          <View style={styles.disclaimerTextContainer}>
            <Text style={[styles.disclaimerTitle, { color: colors.text }]}>Protect Patient Privacy</Text>
            <Text style={styles.disclaimerText}>
              Do not share any Protected Health Information (PHI) or identifiable patient details. Any posts violating HIPAA or hospital privacy policies will be removed and result in a permanent ban from Scrubs.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Floating Action Area */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[styles.submitButton, (!title || !body || !category) && styles.submitButtonDisabled]}
          disabled={!title || !body || !category}
          onPress={handlePost}
        >
          <Text style={styles.submitText}>Post to Scrubs</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputTitle: {
    fontSize: 26,
    marginBottom: 16,
    padding: 0,
  },
  inputBody: {
    fontSize: 18,
    minHeight: 180,
    padding: 0,
    lineHeight: 28,
  },
  categorySection: {
    marginTop: 20,
  },
  categoryHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryScroll: {
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerBox: {
    flexDirection: 'row',
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  disclaimerTextContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 110, // Extra for safe area and floating tab bar
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.3,
    shadowOpacity: 0,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
