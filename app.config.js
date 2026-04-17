export default {
  expo: {
    name: '400 Scorekeeper',
    slug: '400-scorekeeper',
    scheme: 'fourhundredscorekeeper',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    newArchEnabled: true,
    splash: { backgroundColor: '#09090b' },
    ios: {
      bundleIdentifier: 'com.abassaf.fourhundredscorekeeper',
      supportsTablet: false,
      config: { usesNonExemptEncryption: false },
    },
    android: {
      package: 'com.abassaf.fourhundredscorekeeper',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#09090b',
      },
      edgeToEdgeEnabled: true,
    },
    plugins: [],
    extra: {
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? '',
    },
  },
};
