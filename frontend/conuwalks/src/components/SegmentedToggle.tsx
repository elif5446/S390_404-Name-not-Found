import { View, Platform, useColorScheme } from "react-native";
import React from 'react';
import SegmentedControl from '@react-native-segmented-control/segmented-control'; // iOS
import { SegmentedButtons } from 'react-native-paper'; // Android
import styles from '@/src/styles/segmentedToggle';
import { BlurView } from 'expo-blur'; // Liquid Glass effect
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SegmentedToggle = ({ campus, setCampus }: { campus: 'SGW' | 'Loyola', setCampus: (campus: 'SGW' | 'Loyola') => void }) => {
  const mode = useColorScheme() || 'light';
  return (<View style={[styles.overlay, {paddingTop: useSafeAreaInsets().top + 10}]}>
    {/* Safe area insets are things like notches or software indicators */}
    {Platform.OS === 'ios' &&
      <View style={styles.shadowiOS}>
        <BlurView intensity={10} tint="light" style={styles.blurContainer}>
          <SegmentedControl
            values={['Sir George Williams', 'Loyola']}
            selectedIndex={campus === 'SGW' ? 0 : 1}
            onChange={(event) => {setCampus(event.nativeEvent.selectedSegmentIndex === 0 ? 'SGW' : 'Loyola');}}
            tintColor="#FF2D55CC"
            appearance={mode}
            backgroundColor="transparent"
            activeFontStyle={{ color: mode === 'light' ? 'white' : 'black', fontWeight: '600' }}
            fontStyle={{ color: mode === 'light' ? 'black' : 'white' }}
            style={styles.segmentedIos}
          />
        </BlurView>
      </View> ||
    Platform.OS === 'android' &&
    <View style={[styles.shadowAndroid, { backgroundColor: mode === 'dark' ? '#1C1B1F' : '#FFFFFF' }]}>
      <SegmentedButtons
        value={campus}
        onValueChange={setCampus}
        buttons={[{value: 'SGW', label: 'Sir George Williams', showSelectedCheck: true}, {value: 'Loyola', label: 'Loyola', showSelectedCheck: true}]}
        theme={{
          colors: {
            secondaryContainer: '#FF2D55',
            onSecondaryContainer: mode === 'dark' ? '#1C1B1F' : '#FFFFFF', // Selected button
            onSurface: mode === 'dark' ? '#FFFFFF' : '#1C1B1F', // Unselected button
            outline: 'rgba(121, 116, 126, 0.3)', 
          }
        }}
      />
    </View> || <View/>}
  </View>)
}

export default SegmentedToggle;