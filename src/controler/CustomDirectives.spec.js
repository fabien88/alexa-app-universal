const { expect } = require('chai');
const CustomDirectives = require('./CustomDirectives');

describe('CustomDirectives test', () => {
  it('regex matches', async () => {
    const { regexDot } = new CustomDirectives({}, {});
    expect('ca va.'.match(regexDot)).to.not.be.null;
    expect('ca va'.match(regexDot)).to.be.null;
    expect('hello !'.match(regexDot)).to.not.be.null;
    expect('<prosody rate="slow">bla bla</prosody>'.match(regexDot)).to.not.be
      .null;
    expect('<speak rate="slow">bla bla</speak>'.match(regexDot)).to.not.be.null;
    expect('ca va ?'.match(regexDot)).to.not.be.null;
    expect('très bien '.match(regexDot)).to.not.be.null;
    expect('très bien'.match(regexDot)).to.be.null;
  });
});
