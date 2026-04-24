import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, ViewToken,
  Share, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';

import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getCourseById } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/theme';
import { Reel } from '../types';

// Helper to extract YouTube video ID from url
const getYouTubeVideoId = (url: string): string | null => {
  if (url.startsWith('youtube:')) {
    return url.replace('youtube:', '');
  }
  return null;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ReelPlayer'>;
const { width, height } = Dimensions.get('window');
const REEL_HEIGHT = height;

const MOCK_COMMENTS = [
  { id: '1', user: 'Priya', text: 'Very helpful! 🙏', time: '2m ago' },
  { id: '2', user: 'Anita', text: 'Can you show more?', time: '5m ago' },
  { id: '3', user: 'Meera', text: 'I learned so much!', time: '10m ago' },
];

interface ReelItemProps {
  reel: Reel; isActive: boolean; language: 'hindi' | 'english' | 'tamil'; showCaptions: boolean;
  onComplete: () => void; likedReels: Set<string>; onLike: (id: string) => void;
  onComment: (id: string) => void; onShare: (reel: Reel) => void; likeCounts: Record<string, number>;
}

function ReelItem({ reel, isActive, language, showCaptions, onComplete, likedReels, onLike, onComment, onShare, likeCounts }: ReelItemProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const isLiked = likedReels.has(reel.id);
  const likeCount = likeCounts[reel.id] || 0;
  
  // Check if this is a YouTube video
  const youtubeVideoId = getYouTubeVideoId(reel.videoUrl);
  const isYouTube = !!youtubeVideoId;

  React.useEffect(() => {
    if (!isYouTube) {
      if (isActive) { videoRef.current?.playAsync(); setIsPlaying(true); }
      else { videoRef.current?.pauseAsync(); videoRef.current?.setPositionAsync(0); setIsPlaying(false); setProgress(0); }
    } else {
      setIsPlaying(isActive);
    }
  }, [isActive, isYouTube]);

  React.useEffect(() => {
    if (!isActive || !showCaptions) return;
    const interval = setInterval(() => setCaptionIndex(p => (p + 1) % reel.captions[language].length), 3000);
    return () => clearInterval(interval);
  }, [isActive, language, showCaptions, reel.captions]);

  const handleStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis);
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) onComplete();
    }
  };

  const togglePlay = async () => {
    if (isYouTube) {
      setIsPlaying(!isPlaying);
    } else if (videoRef.current) {
      isPlaying ? await videoRef.current.pauseAsync() : await videoRef.current.playAsync();
      setIsPlaying(!isPlaying);
    }
  };

  const onYouTubeStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      onComplete();
      setIsPlaying(false);
    }
  }, [onComplete]);

  return (
    <View style={[styles.reelContainer, { height: REEL_HEIGHT }]}>
      {/* Teal gradient background */}
      <View style={styles.tealBackground} />
      
      {isYouTube ? (
        // YouTube Player
        <View style={styles.youtubeContainer}>
          <YoutubePlayer
            height={REEL_HEIGHT * 0.5}
            width={width}
            play={isActive && isPlaying}
            videoId={youtubeVideoId}
            onChangeState={onYouTubeStateChange}
          />
        </View>
      ) : (
        // Regular Video Player
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={togglePlay} activeOpacity={1}>
          <Video ref={videoRef} source={{ uri: reel.videoUrl }} style={styles.video} resizeMode={ResizeMode.COVER}
            shouldPlay={isActive && isPlaying} isLooping={false} onPlaybackStatusUpdate={handleStatus} isMuted={false} />
        </TouchableOpacity>
      )}

      {!isPlaying && !isYouTube && (
        <TouchableOpacity style={styles.playOverlay} onPress={togglePlay} activeOpacity={1}>
          <View style={styles.playButton}><Text style={styles.playIcon}>▶</Text></View>
        </TouchableOpacity>
      )}

      {showCaptions && (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{reel.captions[language][captionIndex] || ''}</Text>
        </View>
      )}

      {/* Side actions - teal themed */}
      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(reel.id)}>
          <View style={[styles.actionCircle, isLiked && styles.actionCircleLiked]}>
            <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
          </View>
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(reel.id)}>
          <View style={styles.actionCircle}><Text style={styles.actionIcon}>💬</Text></View>
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(reel)}>
          <View style={styles.actionCircle}><Text style={styles.actionIcon}>↗️</Text></View>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Instagram-style progress bar at bottom */}
      {!isYouTube && (
        <View style={styles.progressBarBottom}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }]} />
          </View>
        </View>
      )}
    </View>
  );
}


export default function ReelPlayerScreen({ route, navigation }: Props) {
  const { courseId, reelId } = route.params;
  const course = getCourseById(courseId);
  const { language, toggleLanguage, markReelComplete } = useApp();
  const [showCaptions, setShowCaptions] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState(false);
  const [currentReelId, setCurrentReelId] = useState('');
  const [comments, setComments] = useState<Record<string, typeof MOCK_COMMENTS>>({});
  const [newComment, setNewComment] = useState('');
  const flatListRef = useRef<FlatList>(null);

  React.useEffect(() => {
    if (course) {
      const counts: Record<string, number> = {};
      const comms: Record<string, typeof MOCK_COMMENTS> = {};
      course.reels.forEach(r => { counts[r.id] = Math.floor(Math.random() * 100) + 10; comms[r.id] = [...MOCK_COMMENTS]; });
      setLikeCounts(counts); setComments(comms);
    }
  }, [course]);

  React.useEffect(() => {
    if (course) {
      const idx = course.reels.findIndex(r => r.id === reelId);
      if (idx >= 0) { setActiveIndex(idx); setTimeout(() => flatListRef.current?.scrollToIndex({ index: idx, animated: false }), 100); }
    }
  }, [course, reelId]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstViewableItem = viewableItems[0];
    if (firstViewableItem?.index != null) {
      setActiveIndex(firstViewableItem.index);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const handleLike = (id: string) => {
    setLikedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) { newSet.delete(id); setLikeCounts(c => ({ ...c, [id]: (c[id] || 1) - 1 })); }
      else { newSet.add(id); setLikeCounts(c => ({ ...c, [id]: (c[id] || 0) + 1 })); }
      return newSet;
    });
  };

  const handleShare = async (reel: Reel) => {
    try { await Share.share({ message: `Check out "${reel.title}" on StreeSkill! 🎓 #StreeSkill #LearnAndEarn` }); } catch (e) {}
  };

  const handleAddComment = () => {
    if (newComment.trim() && currentReelId) {
      setComments(prev => ({ ...prev, [currentReelId]: [{ id: Date.now().toString(), user: 'You', text: newComment.trim(), time: 'Just now' }, ...(prev[currentReelId] || [])] }));
      setNewComment('');
    }
  };

  if (!course) return <View style={styles.container}><Text style={styles.errorText}>Course not found</Text></View>;

  return (
    <View style={styles.container}>
      <FlatList ref={flatListRef} data={course.reels} keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ReelItem reel={item} isActive={index === activeIndex} language={language} showCaptions={showCaptions}
            onComplete={() => markReelComplete(courseId, item.id)} likedReels={likedReels} onLike={handleLike}
            onComment={id => { setCurrentReelId(id); setShowComments(true); }} onShare={handleShare} likeCounts={likeCounts} />
        )}
        pagingEnabled horizontal={false} showsVerticalScrollIndicator={false} snapToInterval={REEL_HEIGHT}
        snapToAlignment="start" decelerationRate="fast" bounces={false} onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig} getItemLayout={(_, i) => ({ length: REEL_HEIGHT, offset: REEL_HEIGHT * i, index: i })}
        onScrollToIndexFailed={info => setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: false }), 100)} />

      {/* Top controls - teal themed */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.rightControls}>
          <TouchableOpacity style={[styles.topBtn, showCaptions && styles.topBtnActive]} onPress={() => setShowCaptions(!showCaptions)}>
            <Text style={styles.topBtnText}>CC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={toggleLanguage}>
            <Text style={styles.topBtnText}>{language === 'hindi' ? 'हिंदी' : language === 'english' ? 'EN' : 'தமிழ்'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress - teal themed */}
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>{activeIndex + 1} / {course.reels.length}</Text>
        <View style={styles.progressDots}>
          {course.reels.map((_, i) => <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive, i < activeIndex && styles.dotDone]} />)}
        </View>
      </View>

      {/* Comments Modal - teal themed */}
      <Modal visible={showComments} animationType="slide" transparent onRequestClose={() => setShowComments(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowComments(false)} />
          <View style={styles.commentsSheet}>
            <View style={styles.commentsHeader}>
              <View style={styles.handle} />
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.commentsList}>
              {(comments[currentReelId] || []).map(c => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{c.user[0]}</Text></View>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUser}>{c.user}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <Text style={styles.commentTime}>{c.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder="Add comment..." placeholderTextColor={COLORS.gray}
                value={newComment} onChangeText={setNewComment} multiline />
              <TouchableOpacity style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]} onPress={handleAddComment} disabled={!newComment.trim()}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  reelContainer: { width, backgroundColor: COLORS.primary },
  tealBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.primary },
  video: { width: '100%', height: '100%', position: 'absolute' },
  youtubeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(26,86,83,0.4)' },
  playButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.screenBg, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
  playIcon: { fontSize: 32, color: COLORS.primary, marginLeft: 4 },
  captionContainer: { position: 'absolute', bottom: 100, left: 16, right: 80, backgroundColor: 'rgba(26, 86, 83, 0.3)', padding: 14, borderRadius: 16 },
  captionText: { color: COLORS.screenBg, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  sideActions: { position: 'absolute', right: 12, bottom: 80, alignItems: 'center', gap: 20 },
  actionBtn: { alignItems: 'center' },
  actionCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.screenBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  actionCircleLiked: { backgroundColor: '#FFE4E4', borderColor: '#FF6B6B' },
  actionIcon: { fontSize: 24 },
  actionText: { color: COLORS.screenBg, fontSize: 11, marginTop: 4, fontWeight: '600' },

  topControls: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
  topBtn: { backgroundColor: COLORS.screenBg, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, borderWidth: 2, borderColor: COLORS.primary },
  topBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.screenBg },
  topBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  rightControls: { flexDirection: 'row', gap: 10 },
  progressBar: { position: 'absolute', top: 110, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  progressText: { color: COLORS.screenBg, fontSize: 14, fontWeight: '600', marginBottom: 8, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  progressDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(232,244,243,0.3)' },
  dotActive: { backgroundColor: COLORS.screenBg, width: 20 },
  dotDone: { backgroundColor: COLORS.accent },
  errorText: { color: COLORS.screenBg, fontSize: 16, textAlign: 'center', marginTop: 100 },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,86,83,0.6)' },
  commentsSheet: { backgroundColor: COLORS.screenBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.6, paddingBottom: 20, borderWidth: 2, borderColor: COLORS.primary, borderBottomWidth: 0 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  handle: { position: 'absolute', top: 8, left: '50%', marginLeft: -20, width: 40, height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  commentsTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, flex: 1, textAlign: 'center' },
  closeBtn: { fontSize: 20, color: COLORS.primary, padding: 4 },
  commentsList: { padding: 16, maxHeight: height * 0.35 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: COLORS.screenBg, fontSize: 16, fontWeight: 'bold' },
  commentContent: { flex: 1 },
  commentUser: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 2 },
  commentText: { fontSize: 14, color: COLORS.darkGray, marginBottom: 4 },
  commentTime: { fontSize: 12, color: COLORS.gray },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 2, borderTopColor: COLORS.primary, gap: 12 },
  input: { flex: 1, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 80 },
  sendBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: COLORS.screenBg, fontSize: 14, fontWeight: '600' },
  progressBarBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingBottom: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});
