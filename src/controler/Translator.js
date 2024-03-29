const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const AmazonSpeech = require('ssml-builder/amazon_speech');
const R = require('ramda');
const ssmd = require('ssmd');
const utt = require('./UtteranceGenerator');

const md = text => ssmd(text, false);
const s = () => new AmazonSpeech();
const r = (...items) => items[Math.floor(Math.random() * items.length)];

const translatorForLanguages = (translations, fallbackLng = 'fr') => {
  const resources = R.map(
    translation => translation({
      s,
      r,
      md,
      utt,
      mdd: (utterances) => {
        const res = R.map(md, utt(utterances));
        if (res.length === 1) {
          return R.head(res);
        }
        return res;
      },
    }),
    translations,
  );

  const translator = (request) => {
    const localizationClient = i18n
      .use({
        name: 'sprintf',
        type: 'postProcessor',
        process: (arg0, ...args) => sprintf.process(R.replace(/%'/, "%%'", arg0), ...args),
        overloadTranslationOptionHandler: (...args) => sprintf.overloadTranslationOptionHandler(...args),
      })
      .init({
        lng: request.data.request.locale,
        fallbackLng,
        overloadTranslationOptionHandler:
          sprintf.overloadTranslationOptionHandler,
        resources,
        returnObjects: true,
      });
    const t = (...args) => localizationClient.t(...args);

    const { intent } = request.data.request;
    const name = (intent && request.data.request.intent.name) || request.data.request.type;

    return {
      t,
      tr: (...arg) => {
        const tr = R.curryN(2, t)(name);
        if (arg.length === 0) {
          return tr(null);
        }
        return tr(...arg);
      },
    };
  };

  return translator;
};

module.exports = translatorForLanguages;
