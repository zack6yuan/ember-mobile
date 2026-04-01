import React from 'react';
import { Text as NativeText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

export function Text(props: TextProps) {
  const { style, ...rest } = props;
  const { colors } = useTheme();

  // Extract font weight from styles to map to correct Outfit variant
  let fontFamily = 'Outfit_400Regular';
  const flattenedStyle = StyleSheet.flatten(style);
  
  if (flattenedStyle?.fontWeight === 'bold' || flattenedStyle?.fontWeight === '700' || flattenedStyle?.fontWeight === '800' || flattenedStyle?.fontWeight === '900') {
    fontFamily = 'Outfit_700Bold';
  } else if (flattenedStyle?.fontWeight === '500' || flattenedStyle?.fontWeight === '600') {
    fontFamily = 'Outfit_500Medium';
  }

  // Pass dynamic colors and override fontWeight since custom fonts handle their own bold geometry.
  return (
    <NativeText 
      {...rest} 
      style={[{ color: colors.text, fontFamily }, style, { fontWeight: undefined }]} 
    />
  );
}
