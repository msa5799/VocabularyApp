import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const navigateToProgress = () => {
    navigation.navigate('Progress');
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#6366f1" />
          </View>
          <Text style={styles.username}>{user?.username || 'Kullanıcı'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{user?.current_level || 'A1'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToProgress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="trending-up-outline" size={24} color="#6366f1" />
              <Text style={styles.menuItemText}>İlerleme</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={24} color="#6366f1" />
              <Text style={styles.menuItemText}>Ayarlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#6366f1" />
              <Text style={styles.menuItemText}>Yardım</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
              <Text style={styles.menuItemText}>Hakkında</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
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
  userCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;