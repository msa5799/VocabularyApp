import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebNavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const WebNavbar: React.FC<WebNavbarProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { key: 'Dashboard', label: 'Ana Sayfa', icon: 'home-outline' as const },
    { key: 'Tests', label: 'Testler', icon: 'school-outline' as const },
    { key: 'Dictionary', label: 'Sözlük', icon: 'book-outline' as const },
    { key: 'Profile', label: 'Profil', icon: 'person-outline' as const },
  ];

  return (
    <View style={styles.navbar}>
      <View style={styles.brand}>
        <Text style={styles.brandText}>VocabularyApp</Text>
      </View>
      
      <View style={styles.navItems}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navItem,
              currentScreen === item.key.toLowerCase() && styles.activeNavItem
            ]}
            onPress={() => onNavigate(item.key)}
          >
            <Ionicons 
              name={item.icon} 
              size={20} 
              color={currentScreen === item.key.toLowerCase() ? '#007AFF' : '#666'} 
            />
            <Text style={[
              styles.navText,
              currentScreen === item.key.toLowerCase() && styles.activeNavText
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  brand: {
    flex: 1,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  activeNavItem: {
    backgroundColor: '#f0f8ff',
  },
  navText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default WebNavbar;