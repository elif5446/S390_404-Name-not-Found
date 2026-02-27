import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface MetroIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

export const MetroIcon = ({ width = 25, height = 25, color = '#333333' }: MetroIconProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100">
      <Circle
        cx="50"
        cy="50"
        r="38"
        stroke={color}
        strokeWidth="12"
        fill="none"
      />
      
      <Path
        d="
          M 44 12 
          H 56 
          V 58 
          L 70 42 
          L 80 52 
          L 50 82 
          L 20 52 
          L 30 42 
          L 44 58 
          Z
        "
        fill={color}
      />
    </Svg>
  );
};
