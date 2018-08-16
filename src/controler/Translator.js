const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const AmazonSpeech = require('ssml-builder/amazon_speech');
const R = require('ramda');

const s = () => new AmazonSpeech();

const translatorForLanguages = (translations, fallbackLng = 'fr') => {
  const resources = R.map(translation => translation({ s }), translations);

  const translator = (request) => {
    const localizationClient = i18n.use(sprintf).init({
      lng: request.data.request.locale,
      fallbackLng,
      overloadTranslationOptionHandler:
        sprintf.overloadTranslationOptionHandler,
      resources,
      returnObjects: true,
    });
    return {
      t: (...args) => `haha ${localizationClient.t(...args)}`,
    };
  };

  return translator;
};

module.exports = translatorForLanguages;
