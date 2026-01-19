import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Campus Navigator</Text>
      <Text style={{ fontSize: 16, color: 'gray', marginTop: 10 }}>
        Ready to build!
      </Text>
    </View>
  );
}
