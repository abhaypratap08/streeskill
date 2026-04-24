import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Share, Alert, ActivityIndicator, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COURSES } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/theme';
import { userApi, authApi, analyticsApi, UserStats } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const FUN_FACTS = [
  "💡 Did you know? Women entrepreneurs contribute 3.09% to India's GDP!",
  "✨ Fun fact: Handmade products sell 40% faster on marketplaces!",
  "🌟 You're amazing! Keep learning, keep growing!",
  "💪 Every expert was once a beginner. You've got this!",
  "🎯 Small steps every day lead to big achievements!",
  "🚀 Your skills are your superpower. Use them wisely!",
  "💖 Believe in yourself - you're capable of amazing things!",
  "📚 Learning is a treasure that follows you everywhere!",
  "🌈 Today's effort is tomorrow's success!",
  "⭐ Financial independence starts with one skill at a time!",
];

export default function ProfileScreen({ navigation }: Props) {
  const { progress, getProgress } = useApp();
  const [funFact, setFunFact] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('StreeSkill Learner');

  useEffect(() => {
    const randomFact =
      FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)] ??
      FUN_FACTS[0] ??
      'Keep learning with StreeSkill.';
    setFunFact(randomFact);
    loadUserData();
    analyticsApi.trackEvent(analyticsApi.events.SCREEN_VIEW, { screen: 'Profile' });
  }, []);

  const loadUserData = async () => {
    try {
      const [userResult, statsResult] = await Promise.all([
        authApi.getCurrentUser(),
        userApi.getStats()
      ]);
      if (userResult.success && userResult.data) {
        setUserName(userResult.data.name);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = async () => {
    setMenuVisible(false);
    try {
      await Share.share({
        message: `Check out my StreeSkill profile! I've completed ${completedCourses.length} courses and learned for ${totalMinutes} minutes. Join me on StreeSkill! 🌟`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share profile');
    }
  };

  const handleLogout = () => {
    setMenuVisible(false);
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await authApi.logout();
    analyticsApi.trackEvent(analyticsApi.events.LOGOUT);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  // Calculate stats
  const completedCourses = COURSES.filter(course => {
    const p = getProgress(course.id, course.reels.length);
    return p.completed === p.total && p.total > 0;
  });

  const ongoingCourses = COURSES.filter(course => {
    const p = getProgress(course.id, course.reels.length);
    return p.completed > 0 && p.completed < p.total;
  });

  const totalLessonsCompleted = Object.values(progress.completedReels).reduce(
    (sum, reels) => sum + reels.length, 0
  );

  // Use API stats if available, otherwise calculate locally
  const totalMinutes = stats?.minutesLearned ?? totalLessonsCompleted * 1;
  const currentStreak = stats?.longestStreak ?? completedCourses.length;
  const totalSessions = stats?.totalSessions ?? completedCourses.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background Geometric Shapes */}
      <View style={styles.backgroundShapes}>
        <View style={styles.triangleLeft} />
        <View style={styles.triangleRight} />
        <View style={styles.triangleBottom} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          {/* Hamburger Menu Button */}
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.headerTitle}>Profile</Text>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.avatarText}>👩</Text>}
            </View>
            <Text style={styles.userName}>{userName}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>😊</Text>
              <Text style={styles.statLabel}>TOTAL SESSIONS</Text>
              <Text style={styles.statValue}>{totalSessions}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statLabel}>MINUTES LEARNED</Text>
              <Text style={styles.statValue}>{totalMinutes}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={styles.statLabel}>LONGEST STREAK</Text>
              <Text style={styles.statValue}>{currentStreak}</Text>
            </View>
          </View>
        </View>

        {/* Currently Learning Section */}
        {ongoingCourses.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📖 Currently Learning</Text>
            {ongoingCourses.map(course => {
              const p = getProgress(course.id, course.reels.length);
              const percent = Math.round((p.completed / p.total) * 100);
              return (
                <TouchableOpacity 
                  key={course.id} 
                  style={styles.courseItem}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, courseTitle: course.title })}
                >
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseProgress}>{p.completed}/{p.total} lessons • {percent}%</Text>
                  </View>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressPercent}>{percent}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fun Fact / Motivation */}
        <View style={styles.funFactContainer}>
          <Text style={styles.funFactText}>{funFact}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.dropdownIcon}>⚙️</Text>
              <Text style={styles.dropdownText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dropdownItem} onPress={handleShareProfile}>
              <Text style={styles.dropdownIcon}>📤</Text>
              <Text style={styles.dropdownText}>Share Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dropdownItem, styles.dropdownItemLast]} onPress={handleLogout}>
              <Text style={styles.dropdownIcon}>🚪</Text>
              <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutMessage}>Are you sure you want to logout?</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity 
                style={[styles.logoutBtn, styles.cancelBtn]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.logoutBtn, styles.confirmBtn]} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d4e8e8',
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  // Left right-angled triangle - right angle at bottom-left corner
  // Goes from bottom-left, up the left edge, then diagonally to center-bottom
  triangleLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightWidth: SCREEN_WIDTH / 2,
    borderBottomWidth: SCREEN_HEIGHT * 0.55,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#7fb5b5',
  },
  // Right right-angled triangle - right angle at bottom-right corner
  // Goes from bottom-right, up the right edge, then diagonally to center-bottom
  triangleRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: SCREEN_WIDTH / 2,
    borderRightWidth: 0,
    borderBottomWidth: SCREEN_HEIGHT * 0.55,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#5a9090',
  },
  // Bottom center triangle - pointing upward (light colored) creating the V shape
  triangleBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: SCREEN_WIDTH / 2,
    borderRightWidth: SCREEN_WIDTH / 2,
    borderBottomWidth: SCREEN_HEIGHT * 0.28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#d4e8e8',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingBottom: 30,
  },
  backBtn: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '300',
    marginTop: -2,
  },
  menuBtn: {
    position: 'absolute',
    top: 10,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 8,
  },
  hamburgerLine: {
    width: 18,
    height: 2,
    backgroundColor: COLORS.white,
    marginVertical: 2,
    borderRadius: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#d4e8e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 50,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  courseProgress: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  funFactContainer: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    padding: 16,
  },
  funFactText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 60,
    marginRight: 16,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: COLORS.darkGray,
  },
  logoutText: {
    color: '#e74c3c',
  },
  logoutModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    alignItems: 'center',
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  logoutMessage: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  cancelBtnText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#e74c3c',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
