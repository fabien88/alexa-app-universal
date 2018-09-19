const i18n = require('i18next');
const { expect } = require('chai');
const R = require('ramda');
const md = require('./MarcdownSSMLParser');

describe('parser', () => {
  const rNl = text => R.replace(/\s+/gi, ' ')(text);
  it('whisper', () => {
    expect(rNl(md("[c'est un secret](ext: whisper) !"))).to.be.eql(
      '<speak><amazon:effect name="whispered">c&apos;est un secret</amazon:effect> !</speak>',
    );
  });
  it('interpret', () => {
    expect(rNl(md('[Waouh](as: interjection) tes trop fort !'))).to.be.eql(
      "<speak><say-as interpret-as='interjection'>Waouh</say-as> tes trop fort !</speak>",
    );
  });
  it('pause', () => {
    expect(rNl(md('hello ... tu vas bien ?'))).to.be.eql(
      "<speak>hello <break time='1000ms'/> tu vas bien ?</speak>",
    );
  });
  it('pause5ms', () => {
    expect(rNl(md('hello ...5ms tu vas bien ?'))).to.be.eql(
      "<speak>hello <break time='5ms'/> tu vas bien ?</speak>",
    );
  });
  it('pause2s', () => {
    expect(rNl(md('hello ...2s tu vas bien ?'))).to.be.eql(
      "<speak>hello <break time='2s'/> tu vas bien ?</speak>",
    );
  });
  it('pause0.5s', () => {
    expect(rNl(md('...0.5s tu vas bien ?'))).to.be.eql(
      "<speak><break time='0.5s'/> tu vas bien ?</speak>",
    );
  });
  it('paragraph', () => {
    expect(
      rNl(md('hello ~*coucou toto*~ va ? \n\n **oui et toi** *tu vas bien* ?')),
    ).to.be.eql(
      "<speak><p>hello <emphasis level='reduced'>coucou toto</emphasis> va ?</p><p><emphasis level='strong'>oui et toi</emphasis> <emphasis level='moderate'>tu vas bien</emphasis> ?</p></speak>",
    );
  });
  it('sentences', () => {
    expect(
      rNl(
        md(
          'hello ~*coucou toto*~ va ? \n\n **oui jai bien dormi et toi** \n *tu vas bien* ?',
        ),
      ),
    ).to.be.eql(
      "<speak><p>hello <emphasis level='reduced'>coucou toto</emphasis> va ?</p><p><s><emphasis level='strong'>oui jai bien dormi et toi</emphasis></s><s><emphasis level='moderate'>tu vas bien</emphasis> ?</s></p></speak>",
    );
  });
  it('emphasis', async () => {
    expect(
      rNl(md('hello ~*coucou toto*~ va **oui et toi** *tu vas bien* ?')),
    ).to.be.eql(
      "<speak>hello <emphasis level='reduced'>coucou toto</emphasis> va <emphasis level='strong'>oui et toi</emphasis> <emphasis level='moderate'>tu vas bien</emphasis> ?</speak>",
    );
  });
  it('prosody', async () => {
    expect(rNl(md('hello [tu vas](vrp: 123) ?'))).to.be.eql(
      "<speak>hello <prosody rate='slow' pitch='medium' volume='x-soft'>tu vas</prosody> ?</speak>",
    );
    expect(rNl(md('hello ~tu vas~ -bien- ?'))).to.be.eql(
      "<speak>hello <prosody volume='silent'>tu vas</prosody> <prosody volume='soft'>bien</prosody> ?</speak>",
    );
    expect(rNl(md('hello +tu vas+ ++bien++ ?'))).to.be.eql(
      "<speak>hello <prosody volume='loud'>tu vas</prosody> <prosody volume='x-loud'>bien</prosody> ?</speak>",
    );
    expect(rNl(md('hello <tu vas< <<bien<< ?'))).to.be.eql(
      "<speak>hello <prosody rate='slow'>tu vas</prosody> <prosody rate='x-slow'>bien</prosody> ?</speak>",
    );
    expect(rNl(md('hello >tu vas> >>bien>> ?'))).to.be.eql(
      "<speak>hello <prosody rate='fast'>tu vas</prosody> <prosody rate='x-fast'>bien</prosody> ?</speak>",
    );
    expect(rNl(md('hello __tu vas__ _bien_ ?'))).to.be.eql(
      "<speak>hello <prosody pitch='x-low'>tu vas</prosody> <prosody pitch='low'>bien</prosody> ?</speak>",
    );
    expect(rNl(md('hello ^^tu vas^^ ^bien^ ?'))).to.be.eql(
      "<speak>hello <prosody pitch='x-high'>tu vas</prosody> <prosody pitch='high'>bien</prosody> ?</speak>",
    );
    expect(
      md(`
      hello
    `),
    ).to.be.eql('<speak>hello</speak>');
    expect(
      md(`
      hello.
      ça va ?

      oui
    `),
    ).to.be.eql('<speak><p><s>hello.</s><s>ça va ?</s></p><p>oui</p></speak>');
  });
});
