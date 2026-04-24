import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, FlatList,
  TouchableOpacity, Image, Dimensions, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from '../navigation/types';
import { COURSES, FEATURED_COURSES } from '../data/mockData';
import { useApp } from '../context/AppContext';
import CourseCard from '../components/CourseCard';
import { COLORS, SIZES } from '../constants/theme';
import { searchApi, analyticsApi, youtubeApi } from '../services/api';
import { SkillCategory, YouTubeShort } from '../services/api/youtubeApi';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

// Skill categories with display names
const SKILL_CATEGORIES = [
  { key: 'mehendi', label: 'Mehndi', emoji: '🌸' },
  { key: 'embroidery', label: 'Embroidery', emoji: '🧵' },
  { key: 'tailoring', label: 'Tailoring', emoji: '✂️' },
  { key: 'knitting', label: 'Knitting', emoji: '🧶' },
  { key: 'baking', label: 'Baking', emoji: '🧁' },
  { key: 'beauty', label: 'Beauty', emoji: '💄' },
  { key: 'candles', label: 'Candles', emoji: '🕯️' },
  { key: 'cooking', label: 'Cooking', emoji: '🍳' },
  { key: 'pottery', label: 'Pottery', emoji: '🏺' },
  { key: 'rangoli', label: 'Rangoli', emoji: '🎨' },
  { key: 'soap', label: 'Soap Making', emoji: '🧼' },
  { key: 'beadwork', label: 'Beadwork', emoji: '📿' },
  { key: 'macrame', label: 'Macrame', emoji: '🪢' },
  { key: 'quilling', label: 'Quilling', emoji: '📜' },
  { key: 'packaging', label: 'Packaging', emoji: '🎁' },
  { key: 'meesho', label: 'Online Selling', emoji: '🛒' },
] as const;

export default function DashboardScreen({ navigation }: { navigation: NavigationProp }) {
  const { getProgress } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [youtubeShorts, setYoutubeShorts] = useState<Partial<Record<SkillCategory, YouTubeShort[]>>>({});
  const [shortsLoading, setShortsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('mehendi');

  // Track screen view
  useEffect(() => {
    analyticsApi.trackEvent(analyticsApi.events.SCREEN_VIEW, { screen: 'Dashboard' });
  }, []);

  // Fetch YouTube Shorts for all categories
  useEffect(() => {
    const fetchShorts = async () => {
      setShortsLoading(true);
      const results: Partial<Record<SkillCategory, YouTubeShort[]>> = {};
      
      // Fetch shorts for each category
      await Promise.all(
        SKILL_CATEGORIES.map(async (cat) => {
          try {
            const response = await youtubeApi.getShortsByCategory(cat.key, 6);
            if (response.success && response.data) {
              results[cat.key] = response.data.data || [];
            } else {
              results[cat.key] = [];
            }
          } catch (error) {
            results[cat.key] = [];
          }
        })
      );
      
      setYoutubeShorts(results);
      setShortsLoading(false);
    };

    fetchShorts();
  }, []);

  // Search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSearchLoading(true);
      const timer = setTimeout(async () => {
        const result = await searchApi.getSuggestions(searchQuery);
        if (result.success && result.data) {
          setSuggestions(result.data.map(s => s.text));
          setShowSuggestions(true);
        }
        setSearchLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const filteredCourses = COURSES.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    analyticsApi.trackEvent(analyticsApi.events.SEARCH, { query: suggestion });
  };

  // Get ongoing courses (started but not completed)
  const ongoingCourses = COURSES.filter(course => {
    const p = getProgress(course.id, course.reels.length);
    return p.completed > 0 && p.completed < p.total;
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveSlide(Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH));
  };

  const renderFeaturedCard = ({ item }: { item: typeof FEATURED_COURSES[0] }) => (
    <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.courseId, courseTitle: item.title })}>
      <Image source={{ uri: item.image }} style={styles.featuredImage} resizeMode="cover" />
      <View style={styles.featuredOverlay}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
        <View style={styles.startButton}><Text style={styles.startButtonText}>Start Learning →</Text></View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Profile */}
      <View style={styles.headerRow}>
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} placeholder="Search courses..." placeholderTextColor={COLORS.gray}
            value={searchQuery} onChangeText={setSearchQuery} onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)} />
          <View style={styles.searchIcon}>
            {searchLoading ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text>🔍</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => handleSuggestionPress(suggestion)}>
              <Text style={styles.suggestionText}>🔍 {suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Featured Courses Carousel */}
        <View style={styles.featuredSection}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredHeaderTitle}>Learn New Skills</Text>
            <Text style={styles.swipeHint}>← Swipe →</Text>
          </View>
          <FlatList data={FEATURED_COURSES} renderItem={renderFeaturedCard} keyExtractor={item => item.id}
            horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + 12}
            snapToAlignment="start" decelerationRate="fast" contentContainerStyle={styles.featuredList}
            onScroll={handleScroll} scrollEventThrottle={16} />
          <View style={styles.pagination}>
            {FEATURED_COURSES.map((_, i) => (
              <View key={i} style={[styles.paginationDot, i === activeSlide && styles.paginationDotActive]} />
            ))}
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}><Text style={styles.statNumber}>{COURSES.length}</Text><Text style={styles.statLabel}>Courses</Text></View>
          <View style={styles.statItem}><Text style={styles.statNumber}>100+</Text><Text style={styles.statLabel}>Lessons</Text></View>
          <View style={styles.statItem}><Text style={styles.statNumber}>Free</Text><Text style={styles.statLabel}>Forever</Text></View>
        </View>

        {/* YouTube Shorts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionTitleBold}>SKILL </Text>
            <Text style={styles.sectionTitleLight}>TUTORIALS</Text>
          </Text>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryList}>
          {SKILL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryPill, selectedCategory === cat.key && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, selectedCategory === cat.key && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* YouTube Shorts Grid */}
        {shortsLoading ? (
          <View style={styles.shortsLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading tutorials...</Text>
          </View>
        ) : (
          <View style={styles.shortsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortsList}>
              {(youtubeShorts[selectedCategory] || []).map((short, index) => (
                <TouchableOpacity
                  key={short.id + index}
                  style={styles.shortCard}
                  onPress={() => navigation.navigate('YouTubePlayer', {
                    videoId: short.id,
                    title: short.title,
                    channelTitle: short.channelTitle,
                  })}
                >
                  <Image source={{ uri: short.thumbnail }} style={styles.shortThumbnail} />
                  <View style={styles.shortOverlay}>
                    <View style={styles.playButton}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                  </View>
                  <View style={styles.shortInfo}>
                    <Text style={styles.shortTitle} numberOfLines={2}>{short.title}</Text>
                    <Text style={styles.shortChannel} numberOfLines={1}>{short.channelTitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {(youtubeShorts[selectedCategory] || []).length === 0 && (
                <View style={styles.noShorts}>
                  <Text style={styles.noShortsText}>No tutorials available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Ongoing Courses */}
        {ongoingCourses.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.sectionTitleBold}>CONTINUE </Text>
                <Text style={styles.sectionTitleLight}>LEARNING</Text>
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ongoingScroll} contentContainerStyle={styles.ongoingList}>
              {ongoingCourses.map(course => {
                const p = getProgress(course.id, course.reels.length);
                const percent = Math.round((p.completed / p.total) * 100);
                return (
                  <TouchableOpacity key={course.id} style={styles.ongoingCard}
                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseTitle: course.title })}>
                    <View style={styles.ongoingProgress}>
                      <Text style={styles.ongoingPercent}>{percent}%</Text>
                    </View>
                    <Text style={styles.ongoingTitle} numberOfLines={1}>{course.title}</Text>
                    <Text style={styles.ongoingLessons}>{p.completed}/{p.total} lessons</Text>
                    <View style={styles.ongoingBar}>
                      <View style={[styles.ongoingBarFill, { width: `${percent}%` }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* All Courses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionTitleLight}>ALL </Text>
            <Text style={styles.sectionTitleBold}>COURSES</Text>
            <Text style={styles.sectionTitleLight}> ({filteredCourses.length})</Text>
          </Text>
        </View>

        <View style={styles.courseGrid}>
          {filteredCourses.map(course => {
            const progress = getProgress(course.id, course.reels.length);
            return (
              <View key={course.id} style={styles.courseCardWrapper}>
                <CourseCard course={course} progress={progress}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseTitle: course.title })} />
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingTop: 8, paddingBottom: 8, gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, overflow: 'hidden' },
  searchInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: COLORS.darkGray },
  searchIcon: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 10 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  profileIcon: { fontSize: 22 },
  suggestionsContainer: { position: 'absolute', top: 60, left: SIZES.padding, right: SIZES.padding + 54, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  suggestionItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { fontSize: 14, color: COLORS.darkGray },
  scrollView: { flex: 1 },
  featuredSection: { marginTop: 12 },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, marginBottom: 12 },
  featuredHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  swipeHint: { fontSize: 12, color: COLORS.accent, fontStyle: 'italic' },
  featuredList: { paddingLeft: SIZES.padding, paddingRight: 8 },
  featuredCard: { width: CARD_WIDTH, height: 160, marginRight: 12, borderRadius: SIZES.cardRadius, overflow: 'hidden', backgroundColor: COLORS.cardBg, borderWidth: 2, borderColor: COLORS.primary },
  featuredImage: { width: '100%', height: '100%', position: 'absolute' },
  featuredOverlay: { flex: 1, backgroundColor: 'rgba(26,86,83,0.75)', padding: 16, justifyContent: 'flex-end' },
  featuredTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.screenBg, marginBottom: 4 },
  featuredSubtitle: { fontSize: 14, color: COLORS.screenBg, opacity: 0.9, marginBottom: 12 },
  startButton: { backgroundColor: COLORS.screenBg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 2, borderColor: COLORS.primary },
  startButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 8 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, opacity: 0.3 },
  paginationDotActive: { opacity: 1, width: 24 },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: SIZES.padding, marginTop: 20, backgroundColor: COLORS.primary, borderRadius: SIZES.cardRadius, padding: 16 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: COLORS.screenBg },
  statLabel: { fontSize: 12, color: COLORS.screenBg, opacity: 0.8 },
  sectionHeader: { marginHorizontal: SIZES.padding, marginTop: 24, marginBottom: 12, backgroundColor: COLORS.screenBg, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  sectionTitle: { fontSize: 14, letterSpacing: 1 },
  sectionTitleLight: { color: COLORS.primary, fontWeight: '400' },
  sectionTitleBold: { color: COLORS.primary, fontWeight: '700' },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.padding - 6 },
  courseCardWrapper: { width: '50%', padding: 6 },
  ongoingScroll: { marginTop: 8 },
  ongoingList: { paddingHorizontal: SIZES.padding, gap: 12 },
  ongoingCard: { width: 140, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.primary },
  ongoingProgress: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  ongoingPercent: { fontSize: 11, fontWeight: 'bold', color: COLORS.screenBg },
  ongoingTitle: { fontSize: 13, fontWeight: '600', color: COLORS.darkGray, marginBottom: 4 },
  ongoingLessons: { fontSize: 11, color: COLORS.gray, marginBottom: 8 },
  ongoingBar: { height: 4, backgroundColor: COLORS.screenBg, borderRadius: 2, overflow: 'hidden' },
  ongoingBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  // YouTube Shorts styles
  categoryScroll: { marginTop: 8 },
  categoryList: { paddingHorizontal: SIZES.padding, gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary, gap: 6 },
  categoryPillActive: { backgroundColor: COLORS.primary },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  categoryLabelActive: { color: COLORS.white },
  shortsLoading: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: COLORS.gray, fontSize: 14 },
  shortsContainer: { marginTop: 12 },
  shortsList: { paddingHorizontal: SIZES.padding, gap: 12 },
  shortCard: { width: 140, backgroundColor: COLORS.white, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primary },
  shortThumbnail: { width: '100%', height: 180, backgroundColor: COLORS.gray },
  shortOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 18, color: COLORS.primary, marginLeft: 3 },
  shortInfo: { padding: 8 },
  shortTitle: { fontSize: 11, fontWeight: '600', color: COLORS.darkGray, lineHeight: 14 },
  shortChannel: { fontSize: 10, color: COLORS.gray, marginTop: 4 },
  noShorts: { width: 200, height: 180, justifyContent: 'center', alignItems: 'center' },
  noShortsText: { color: COLORS.gray, fontSize: 14 },
});
