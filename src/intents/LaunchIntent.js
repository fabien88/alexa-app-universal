module.exports = {
  handler: ({ t, player, user }) => (request, response) => {
    response.say(t('LAUNCHING'));

    response.shouldEndSession(false);
    user.launchCount += 1;

    player.play();
  },
  invocationName: {
    fr: 'gymnastique',
    en: 'workout',
  },
};
