const { expo: base } = require('./app.json');

export default {
  expo: {
    ...base,
    extra: {
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? '',
    },
  },
};
