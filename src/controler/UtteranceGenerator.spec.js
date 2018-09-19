const i18n = require('i18next');
const { expect } = require('chai');
const R = require('ramda');
const generateUtterances = require('./UtteranceGenerator');

describe('utterances', () => {
  it('audio', () => {
    expect(generateUtterances(['{bonjour|salut} {ca|} va ?'])).to.be.eql([
      'bonjour ca va ?',
      'bonjour va ?',
      'salut ca va ?',
      'salut va ?',
    ]);
  });
});
