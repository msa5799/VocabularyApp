import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [soundEffects, setSoundEffects] = React.useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="settings-outline" size={48} color="#6366f1" />
          <Text style={styles.title}>Ayarlar</Text>
          <Text style={styles.subtitle}>Uygulama tercihlerinizi yönetin</Text>
        </View>
        
        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#6366f1" />
              <Text style={styles.settingText}>Push Bildirimleri</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor={notifications ? '#fff' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color="#6366f1" />
              <Text style={styles.settingText}>Karanlık Mod</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor={darkMode ? '#fff' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ses</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high-outline" size={24} color="#6366f1" />
              <Text style={styles.settingText}>Ses Efektleri</Text>
            </View>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor={soundEffects ? '#fff' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="person-outline" size={24} color="#6366f1" />
              <Text style={styles.settingText}>Profil Düzenle</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#6366f1" />
              <Text style={styles.settingText}>Şifre Değiştir</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diğer</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={24} color="#6366f1" />
              <Text style={styles.settingText}>Gizlilik Politikası</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-outline" size={24} color="#6366f1" />
              <Text style={styles.settingText}>Kullanım Şartları</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
});

export default SettingsScreen;