import { View, Platform, useColorScheme } from "react-native";
import React from 'react';
import SegmentedControl from '@react-native-segmented-control/segmented-control'; // iOS
import { SegmentedButtons } from 'react-native-paper'; // Android
import styles from '@/src/styles/segmentedToggle';

const SegmentedToggle = ({ campus, setCampus }: { campus: 'SGW' | 'Loyola', setCampus: (campus: 'SGW' | 'Loyola') => void }) => {
  const mode = useColorScheme() || 'light';
  if (Platform.OS === 'ios') {
      return (<SegmentedControl
        values={['Sir George Williams', 'Loyola']}
        selectedIndex={campus === 'SGW' ? 0 : 1}
        onChange={(event) => {setCampus(event.nativeEvent.selectedSegmentIndex === 0 ? 'SGW' : 'Loyola');}}
        appearance={mode}
        style={styles.segmentedIos}
      />);
  } else if (Platform.OS === 'android') {
      return (<SegmentedButtons
        value={campus}
        onValueChange={setCampus}
        buttons={[{value: 'SGW', label: 'Sir George Williams', showSelectedCheck: true}, {value: 'Loyola', label: 'Loyola', showSelectedCheck: true}]}
        style={styles.segmentedAndroid}
      />);
  } else {return (<View/>);}
}

export default SegmentedToggle;