import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, Alert, Linking, ActivityIndicator, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants/theme';
import { UserPreferences, userApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
const CAPTION_LANGUAGES = ['Hindi', 'English', 'Tamil'];
type BooleanPreferenceKey = keyof Pick<UserPreferences, 'notifications' | 'autoPlay' | 'downloadOverWifi'>;

export default function SettingsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [downloadOverWifi, setDownloadOverWifi] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);
  const [captionModal, setCaptionModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [termsModal, setTermsModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  
  // Form states
  const [userName, setUserName] = useState('StreeSkill Learner');
  const [userEmail, setUserEmail] = useState('streeskill@example.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCaptions, setSelectedCaptions] = useState(['Hindi', 'English', 'Tamil']);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const result = await userApi.updateProfile({ name: userName });
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setEditProfileModal(false);
      } else {
        Alert.alert('Error', result.error || 'Could not update profile');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await userApi.changePassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Success', 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePasswordModal(false);
      } else {
        Alert.alert('Error', result.error || 'Could not change password');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async (key: BooleanPreferenceKey, value: boolean) => {
    const updates: Partial<UserPreferences> = { [key]: value };
    
    if (key === 'notifications') setNotifications(value);
    if (key === 'autoPlay') setAutoPlay(value);
    if (key === 'downloadOverWifi') setDownloadOverWifi(value);
    
    await userApi.updateSettings(updates);
  };

  const handleLanguageSelect = async (language: string) => {
    setSelectedLanguage(language);
    setLanguageModal(false);
    await userApi.updateSettings({ language });
  };

  const toggleCaption = async (lang: string) => {
    let nextCaptions = selectedCaptions;

    if (selectedCaptions.includes(lang)) {
      if (selectedCaptions.length === 1) {
        return;
      }
      nextCaptions = selectedCaptions.filter(l => l !== lang);
    } else {
      nextCaptions = [...selectedCaptions, lang];
    }

    setSelectedCaptions(nextCaptions);
    await userApi.updateSettings({ captionLanguages: nextCaptions });
  };

  const handleChangePasswordOld = () => {
    // Keeping for backwards compatibility
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordModal(false);
  };

  const handleSaveEmail = () => {
    if (!userEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    Alert.alert('Success', 'Email updated successfully!');
    setEmailModal(false);
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate StreeSkill',
      'Would you like to rate us on the App Store?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Rate Now', onPress: () => Linking.openURL('https://play.google.com/store') }
      ]
    );
  };

  const SettingItem = ({ 
    icon, title, subtitle, hasSwitch, switchValue, onSwitchChange, onPress 
  }: {
    icon: string; title: string; subtitle?: string; hasSwitch?: boolean;
    switchValue?: boolean; onSwitchChange?: (value: boolean) => void; onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={hasSwitch}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {hasSwitch ? (
        <Switch value={switchValue} onValueChange={onSwitchChange}
          trackColor={{ false: '#ddd', true: COLORS.primary }} thumbColor={COLORS.white} />
      ) : (
        <Text style={styles.settingArrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  const ModalWrapper = ({ visible, onClose, title, children }: { 
    visible: boolean; onClose: () => void; title: string; children: React.ReactNode 
  }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backgroundShapes}>
        <View style={styles.triangleLeft} />
        <View style={styles.triangleRight} />
        <View style={styles.triangleBottom} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon="👤" title="Edit Profile" subtitle={userName} onPress={() => setEditProfileModal(true)} />
          <SettingItem icon="🔒" title="Change Password" subtitle="Update your password" onPress={() => setChangePasswordModal(true)} />
          <SettingItem icon="📧" title="Email" subtitle={userEmail} onPress={() => setEmailModal(true)} />
        </View>

        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon="🔔" title="Notifications" subtitle={notifications ? 'On' : 'Off'}
            hasSwitch switchValue={notifications} onSwitchChange={(value) => void handleSettingsChange('notifications', value)} />
          <SettingItem icon="🌙" title="Dark Mode" subtitle="Coming soon"
            hasSwitch switchValue={darkMode} onSwitchChange={(v) => { setDarkMode(v); Alert.alert('Coming Soon', 'Dark mode will be available in a future update!'); setDarkMode(false); }} />
          <SettingItem icon="▶️" title="Auto-play Videos" subtitle={autoPlay ? 'On' : 'Off'}
            hasSwitch switchValue={autoPlay} onSwitchChange={(value) => void handleSettingsChange('autoPlay', value)} />
          <SettingItem icon="📶" title="Download over Wi-Fi only" subtitle={downloadOverWifi ? 'On' : 'Off'}
            hasSwitch switchValue={downloadOverWifi} onSwitchChange={(value) => void handleSettingsChange('downloadOverWifi', value)} />
        </View>

        <Text style={styles.sectionHeader}>Language</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon="🌐" title="App Language" subtitle={selectedLanguage} onPress={() => setLanguageModal(true)} />
          <SettingItem icon="🎬" title="Video Captions" subtitle={selectedCaptions.join(', ')} onPress={() => setCaptionModal(true)} />
        </View>

        <Text style={styles.sectionHeader}>Support</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon="❓" title="Help Center" subtitle="FAQs and guides" onPress={() => setHelpModal(true)} />
          <SettingItem icon="💬" title="Contact Us" subtitle="Get in touch" onPress={() => setContactModal(true)} />
          <SettingItem icon="⭐" title="Rate App" subtitle="Share your feedback" onPress={handleRateApp} />
        </View>

        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon="📄" title="Terms of Service" onPress={() => setTermsModal(true)} />
          <SettingItem icon="🔐" title="Privacy Policy" onPress={() => setPrivacyModal(true)} />
          <SettingItem icon="ℹ️" title="App Version" subtitle="1.0.0" onPress={() => Alert.alert('StreeSkill', 'Version 1.0.0\nBuild 2024.1\n\nMade with ❤️ for women entrepreneurs')} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <ModalWrapper visible={editProfileModal} onClose={() => setEditProfileModal(false)} title="Edit Profile">
        <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Your Name" placeholderTextColor={COLORS.gray} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ModalWrapper>

      {/* Change Password Modal */}
      <ModalWrapper visible={changePasswordModal} onClose={() => setChangePasswordModal(false)} title="Change Password">
        <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current Password" secureTextEntry placeholderTextColor={COLORS.gray} />
        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New Password" secureTextEntry placeholderTextColor={COLORS.gray} />
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" secureTextEntry placeholderTextColor={COLORS.gray} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
          <Text style={styles.saveBtnText}>Update Password</Text>
        </TouchableOpacity>
      </ModalWrapper>

      {/* Email Modal */}
      <ModalWrapper visible={emailModal} onClose={() => setEmailModal(false)} title="Update Email">
        <TextInput style={styles.input} value={userEmail} onChangeText={setUserEmail} placeholder="Email Address" keyboardType="email-address" placeholderTextColor={COLORS.gray} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEmail}>
          <Text style={styles.saveBtnText}>Save Email</Text>
        </TouchableOpacity>
      </ModalWrapper>

      {/* Language Modal */}
      <ModalWrapper visible={languageModal} onClose={() => setLanguageModal(false)} title="Select Language">
        {LANGUAGES.map(lang => (
          <TouchableOpacity key={lang} style={styles.optionItem} onPress={() => void handleLanguageSelect(lang)}>
            <Text style={styles.optionText}>{lang}</Text>
            {selectedLanguage === lang && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ModalWrapper>

      {/* Caption Modal */}
      <ModalWrapper visible={captionModal} onClose={() => setCaptionModal(false)} title="Video Captions">
        {CAPTION_LANGUAGES.map(lang => (
          <TouchableOpacity key={lang} style={styles.optionItem} onPress={() => void toggleCaption(lang)}>
            <Text style={styles.optionText}>{lang}</Text>
            {selectedCaptions.includes(lang) && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ModalWrapper>

      {/* Help Modal */}
      <ModalWrapper visible={helpModal} onClose={() => setHelpModal(false)} title="Help Center">
        <Text style={styles.helpText}>📚 How to start a course?{'\n'}Go to Dashboard and tap on any course card.{'\n\n'}🎬 How to watch lessons?{'\n'}Tap on any lesson thumbnail to start watching.{'\n\n'}💰 How to sell products?{'\n'}Go to Sell tab and list your handmade items.{'\n\n'}📞 Need more help?{'\n'}Contact us at support@streeskill.com</Text>
      </ModalWrapper>

      {/* Contact Modal */}
      <ModalWrapper visible={contactModal} onClose={() => setContactModal(false)} title="Contact Us">
        <Text style={styles.helpText}>📧 Email: support@streeskill.com{'\n\n'}📞 Phone: +91 98765 43210{'\n\n'}🕐 Hours: Mon-Sat, 9AM-6PM{'\n\n'}📍 Address: StreeSkill HQ, Bangalore, India</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={() => Linking.openURL('mailto:support@streeskill.com')}>
          <Text style={styles.saveBtnText}>Send Email</Text>
        </TouchableOpacity>
      </ModalWrapper>

      {/* Terms Modal */}
      <ModalWrapper visible={termsModal} onClose={() => setTermsModal(false)} title="Terms of Service">
        <ScrollView style={{ maxHeight: 300 }}>
          <Text style={styles.helpText}>1. Acceptance of Terms{'\n'}By using StreeSkill, you agree to these terms.{'\n\n'}2. User Accounts{'\n'}You are responsible for maintaining your account security.{'\n\n'}3. Content{'\n'}All course content is owned by StreeSkill and its creators.{'\n\n'}4. Selling{'\n'}Sellers must provide accurate product descriptions.{'\n\n'}5. Privacy{'\n'}We respect your privacy as outlined in our Privacy Policy.</Text>
        </ScrollView>
      </ModalWrapper>

      {/* Privacy Modal */}
      <ModalWrapper visible={privacyModal} onClose={() => setPrivacyModal(false)} title="Privacy Policy">
        <ScrollView style={{ maxHeight: 300 }}>
          <Text style={styles.helpText}>Data Collection{'\n'}We collect minimal data to provide our services.{'\n\n'}Data Usage{'\n'}Your data is used only to improve your experience.{'\n\n'}Data Security{'\n'}We use industry-standard encryption.{'\n\n'}Your Rights{'\n'}You can request data deletion at any time.{'\n\n'}Contact{'\n'}privacy@streeskill.com</Text>
        </ScrollView>
      </ModalWrapper>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4e8e8' },
  backgroundShapes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  // Left right-angled triangle - right angle at bottom-left corner
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
  // Bottom center triangle - pointing upward (light colored)
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: COLORS.white, fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.primary },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginTop: 20, marginBottom: 10, marginLeft: 4, opacity: 0.7 },
  sectionCard: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  settingIcon: { fontSize: 22, marginRight: 14 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500', color: COLORS.primary },
  settingSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  settingArrow: { fontSize: 22, color: COLORS.primary, opacity: 0.4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '85%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20, textAlign: 'center' },
  modalCloseBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  modalCloseBtnText: { color: COLORS.gray, fontSize: 16 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, color: COLORS.darkGray },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 25, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionText: { fontSize: 16, color: COLORS.darkGray },
  checkmark: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold' },
  helpText: { fontSize: 14, color: COLORS.darkGray, lineHeight: 22 },
});
