import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebNavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const WebNavbar: React.FC<WebNavbarProps> = ({ currentScreen, onNavigate }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  const navItems = [
    { key: 'Dashboard', label: 'Ana Sayfa', icon: 'home-outline' as const },
    { key: 'WordLearning', label: 'Kelime Öğren', icon: 'library-outline' as const },
    { key: 'WordLists', label: 'Kelime Listem', icon: 'list-outline' as const },
    { key: 'Tests', label: 'Testler', icon: 'school-outline' as const },
    { key: 'Dictionary', label: 'Sözlük', icon: 'book-outline' as const },
    { key: 'Profile', label: 'Profil', icon: 'person-outline' as const },
  ];

  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      const isMobileView = width <= 768;
      setIsMobile(isMobileView);
      setScreenHeight(height);
      if (!isMobileView) {
        setIsMenuOpen(false);
      }
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    
    return () => subscription?.remove();
  }, []);

  const handleNavItemPress = (key: string) => {
    onNavigate(key);
    if (isMobile) {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <View style={[styles.navbar, isMobile && styles.mobileNavbar]}>
        <View style={styles.brand}>
          <Text 
            style={[styles.brandText, isMobile && styles.mobileBrandText]}
            numberOfLines={isMobile ? 1 : undefined}
          >
            VocabularyApp
          </Text>
        </View>
        
        {isMobile ? (
          <TouchableOpacity 
            style={styles.hamburger}
            onPress={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Ionicons 
              name={isMenuOpen ? 'close' : 'menu'} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.navItems}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.navItem,
                  currentScreen === item.key.toLowerCase() && styles.activeNavItem
                ]}
                onPress={() => handleNavItemPress(item.key)}
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
        )}
      </View>
      
      {/* Mobile Menu Overlay */}
      {isMobile && isMenuOpen && (
        <View style={[styles.mobileMenuOverlay, { height: screenHeight }]}>
          <View style={styles.mobileMenu}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.mobileNavItem,
                  currentScreen === item.key.toLowerCase() && styles.activeMobileNavItem
                ]}
                onPress={() => handleNavItemPress(item.key)}
              >
                <Ionicons 
                  name={item.icon} 
                  size={22} 
                  color={currentScreen === item.key.toLowerCase() ? '#007AFF' : '#666'} 
                />
                <Text style={[
                  styles.mobileNavText,
                  currentScreen === item.key.toLowerCase() && styles.activeMobileNavText
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
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
    zIndex: 1000,
  },
  mobileNavbar: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  brand: {
    flex: 1,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    flexWrap: 'nowrap',
  },
  mobileBrandText: {
    fontSize: 18,
    flexShrink: 1,
  },
  hamburger: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
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
  mobileMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  mobileMenu: {
    position: 'absolute',
    top: 70,
    right: 15,
    left: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 300,
  },
  mobileNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  activeMobileNavItem: {
    backgroundColor: '#f0f8ff',
  },
  mobileNavText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeMobileNavText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default WebNavbar;