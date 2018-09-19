const Parser = require('simple-text-parser');
const xmlFormat = require('xml-formatter');
const R = require('ramda');
const AmazonSpeech = require('ssml-builder/amazon_speech');

const parser = new Parser();
parser.addRule(/\*\*(.+?)\*\*/gi, (tag, text) => ({
  type: s => s.emphasis('strong', text),
}));
parser.addRule(/~\*(.+?)\*~/gi, (tag, text) => ({
  type: s => s.emphasis('reduced', text),
}));
parser.addRule(/\*(.+?)\*/gi, (tag, text) => ({
  type: s => s.emphasis('moderate', text),
  text,
}));
parser.addRule(/~(.+?)~/gi, (tag, text) => ({
  type: s => s.prosody({ volume: 'silent' }, text),
}));
parser.addRule(/-(.+?)-/gi, (tag, text) => ({
  type: s => s.prosody({ volume: 'soft' }, text),
}));
parser.addRule(/<<(.+?)<</gi, (tag, text) => ({
  type: s => s.prosody({ rate: 'x-slow' }, text),
}));
parser.addRule(/<(.+?)</gi, (tag, text) => ({
  type: s => s.prosody({ rate: 'slow' }, text),
}));
parser.addRule(/>>(.+?)>>/gi, (tag, text) => ({
  type: s => s.prosody({ rate: 'x-fast' }, text),
}));
parser.addRule(/>(.+?)>/gi, (tag, text) => ({
  type: s => s.prosody({ rate: 'fast' }, text),
}));
parser.addRule(/__(.+?)__/gi, (tag, text) => ({
  type: s => s.prosody({ pitch: 'x-low' }, text),
}));
parser.addRule(/_(.+?)_/gi, (tag, text) => ({
  type: s => s.prosody({ pitch: 'low' }, text),
}));
parser.addRule(/\^\^(.+?)\^\^/gi, (tag, text) => ({
  type: s => s.prosody({ pitch: 'x-high' }, text),
}));
parser.addRule(/\^(.+?)\^/gi, (tag, text) => ({
  type: s => s.prosody({ pitch: 'high' }, text),
}));
parser.addRule(/\+\+(.+?)\+\+/gi, (tag, text) => ({
  type: s => s.prosody({ volume: 'x-loud' }, text),
}));
parser.addRule(/\+(.+?)\+/gi, (tag, text) => ({
  type: s => s.prosody({ volume: 'loud' }, text),
}));
parser.addRule(/( \.\.\. )/gi, (tag, text) => ({
  type: s => s.pause('1000ms'),
}));

parser.addRule(/( \.\.\.(\d+)(s|ms) )/gi, (tag, text) => {
  const [other, time, unit] = /(\d+)(s|ms)/gi.exec(tag);

  return {
    type: s => s.pause(time + unit),
  };
});

const addParseFunc = (name, callback) => {
  const regex = new RegExp(`\\[(.+?)\\]\\(${name}: \\S+\\)`, 'gi');
  parser.addRule(regex, (tag, text) => {
    const [oth, param] = new RegExp(
      `\\[.+?\\]\\(${name}: (\\S+)\\)`,
      'gi',
    ).exec(tag);
    return {
      type: s => callback(s, text, param),
    };
  });
};

const volumes = ['silent', 'x-soft', 'soft', 'medium', 'loud', 'x-loud'];
const rate = ['', 'x-slow', 'slow', 'medium', 'fast', 'x-fast'];
const pitch = ['', 'x-low', 'low', 'medium', 'high', 'x-high'];
addParseFunc('vrp', (s, text, param) => {
  const [vIdx, rIdx, pIdx] = param;
  return s.prosody(
    {
      volume: volumes[vIdx],
      rate: rate[rIdx],
      pitch: pitch[pIdx],
    },
    text,
  );
});

addParseFunc('as', (s, text, params) => s.sayAs({
  word: text,
  interpret: params,
}));

const extensions = {
  whisper: (s, text) => s.whisper(text),
};
addParseFunc('ext', (s, text, extension) => extensions[extension](s, text));

const speechReducer = R.reduce((s, { type, text }) => {
  switch (type) {
    case 'text':
      return s.say(text);
    default:
      return type(s);
  }
});

const parseGeneric = (separator, tag, subCall) => (text) => {
  const results = R.compose(
    R.map(splitText => subCall(splitText)),
    R.split(separator),
  )(text);
  let withParagraph;
  if (results.length === 1) {
    withParagraph = R.head(results);
  } else {
    withParagraph = `<${tag}>${R.join(`</${tag}><${tag}>`)(results)}</${tag}>`;
  }
  return withParagraph;
};

const s = () => new AmazonSpeech();
const parseSentence = parseGeneric('\n', 's', sentence => speechReducer(s(), parser.toTree(sentence)).ssml(true));
const parseParagraph = parseGeneric('\n\n', 'p', parseSentence);

const md = text => xmlFormat(`<speak>${parseParagraph(text)}</speak>`);

module.exports = md;
