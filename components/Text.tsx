import React from 'react';
import { Text as NativeText, TextProps, StyleSheet } from 'react-native';
import { Ember, Fonts } from '@/constants/theme';

type Props = TextProps & {
  /** Use the Newsreader serif face (for headlines / literary body). */
  serif?: boolean;
  /** Italic accent — pairs with `serif` for the headline accent word. */
  italic?: boolean;
};

/**
 * App text primitive. Defaults to Hanken Grotesk (body/UI) and maps the
 * `fontWeight` style to the matching bundled weight, since custom fonts carry
 * their own weight geometry. Pass `serif` to switch to Newsreader for headlines.
 */
export function Text({ style, serif, italic, ...rest }: Props) {
  const flat = StyleSheet.flatten(style) || ({} as any);
  const weight = flat.fontWeight;

  let fontFamily: string;
  if (serif) {
    if (italic) fontFamily = Fonts.serifItalic;
    else if (weight === '400' || weight === 'normal') fontFamily = Fonts.serifRegular;
    else fontFamily = Fonts.serif;
  } else if (weight === 'bold' || weight === '700' || weight === '800' || weight === '900') {
    fontFamily = Fonts.sansBold;
  } else if (weight === '600') {
    fontFamily = Fonts.sansSemiBold;
  } else if (weight === '500') {
    fontFamily = Fonts.sansMedium;
  } else {
    fontFamily = Fonts.sans;
  }

  return (
    <NativeText
      {...rest}
      style={[{ color: Ember.textPrimary, fontFamily }, style, { fontWeight: undefined }]}
    />
  );
}
