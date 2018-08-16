module.exports = {
  name: 'NoMotivationIntent',
  options: {
    slots: { VEGETABLE: 'VEGETABLE' },
    utterances: {
      fr: [
        'je veux manger {un|une|des|} {-|VEGETABLE}',
        "j'ai pas le moral",
        "j'en peux plus",
      ],
      en: [
        "I can't do it",
        'I feel discouraged',
        'I want to eat {-|VEGETABLE}',
      ],
    },
  },
  handler: ({ t, sayNow, slots: { VEGETABLE } }) => async (
    request,
    response,
  ) => {
    sayNow(t('COURAGE'));
    if (VEGETABLE.matched) {
      response.say(t('I_LOVE', VEGETABLE.id, VEGETABLE.value));
    }
    console.log({ VEGETABLE });
    response.say(t('COURAGE'));
    response.shouldEndSession(false);
  },
};
