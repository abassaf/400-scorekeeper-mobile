const { expo: base } = require('./app.json');

export default {
  expo: {
    ...base,
    extra: {
      feedbackEndpoint: 'https://400-scorekeeper-feedback.anthonyassaf.workers.dev/',
    },
  },
};
