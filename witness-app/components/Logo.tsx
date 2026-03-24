import { View, Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'default' | 'small';
}

export function Logo({ size = 'default' }: LogoProps) {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <Image
        source={require('@/public/logo-war-room-transp.png')}
        style={[styles.logo, isSmall && styles.logoSmall]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  containerSmall: {
    paddingVertical: 0,
  },
  logo: {
    width: 200,
    height: 80,
  },
  logoSmall: {
    width: 120,
    height: 48,
  },
});
