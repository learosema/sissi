import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { markdown } from '../../src/transforms/markdown.js';

const MD1 = `Lorem Ipsum

Dolor Sit

amet!
`;

const HTML1 = `<p>Lorem Ipsum</p>
<p>Dolor Sit</p>
<p>amet!</p>`;

const MD2 = `# Placeholder Text

Lorem Ipsum Dolor Sit amet consetetur adipiscing elit

## Headline 2

### Headline 3

#### Headline 4

##### Headline 5

###### Headline 6
`;

const HTML2 = `<h1>Placeholder Text</h1>
<p>Lorem Ipsum Dolor Sit amet consetetur adipiscing elit</p>
<h2>Headline 2</h2>
<h3>Headline 3</h3>
<h4>Headline 4</h4>
<h5>Headline 5</h5>
<h6>Headline 6</h6>`

const MD_IMG = `![Lea](lea.jpg)`
const HTML_IMG = `<p><img src="lea.jpg" alt="Lea" /></p>`

const MD_LIST = `# Unordered List

- Eat
- Sleep
- Code
- Repeat
`

const HTML_LIST = `<h1>Unordered List</h1>
<ul><li>Eat</li><li>Sleep</li><li>Code</li><li>Repeat</li></ul>`

const MD_NESTED_LIST = `# Lea

- Pronouns
  - she/her
- Likes
  - Pasta
  - Coding
  - Accessibility
`

const HTML_NESTED_LIST = `<h1>Lea</h1>
<ul><li>Pronouns<ul><li>she/her</li></ul></li><li>Likes<ul><li>Pasta</li><li>Coding</li><li>Accessibility</li></ul></li></ul>`

const MD_ORDERED_LIST = `# Lea

1. Frontend Dev
2. Loves Accessibility
3. Hates Ordered Lists
`


const HTML_ORDERED_LIST = `<h1>Lea</h1>
<ol><li>Frontend Dev</li><li>Loves Accessibility</li><li>Hates Ordered Lists</li></ol>`

const MD_NESTED_OL = `# Table of contents

1. Accessibility Fundamentals
   1.1. Disability Etiquette
2. Accessibility Myths debunked
   2.1. Accessibility is expensive
   2.2. Accessibility is ugly
3. Quiz
`

const HTML_NESTED_OL = `<h1>Table of contents</h1>
<ol><li>Accessibility Fundamentals<ol><li>Disability Etiquette</li></ol>` + 
`</li><li>Accessibility Myths debunked<ol><li>Accessibility is expensive</li>` + 
`<li>Accessibility is ugly</li></ol></li><li>Quiz</li></ol>`

describe('markdown transform', () => {

  it('transforms chunks of text into paragraphs', () => {
    assert.equal(markdown(MD1), HTML1);
  });

  it('transforms headline correctly', () => {
    assert.equal(markdown(MD2), HTML2);
  });

  it('transforms links correctly', () => {
    const MD_LINK = `This is a [link](https://lea.codes/)`
    const HTML_LINK = `<p>This is a <a href="https://lea.codes/">link</a></p>`

    const MD_LINK2 = `This is another link: <https://test.de>.`
    const HTML_LINK2 = `<p>This is another link: <a href="https://test.de">https://test.de</a>.</p>`

    assert.equal(markdown(MD_LINK), HTML_LINK);
    assert.equal(markdown(MD_LINK2), HTML_LINK2);
  });

  it('transforms images correctly', () => {
    assert.equal(markdown(MD_IMG), HTML_IMG);
  })

  it('transforms unordered lists correctly', () => {
    assert.equal(markdown(MD_LIST), HTML_LIST);
  });

  it('transforms unordered nested lists correctly', () => {
    assert.equal(markdown(MD_NESTED_LIST), HTML_NESTED_LIST);
  });

  it('transforms ordered lists correctly', () => {
    assert.equal(markdown(MD_ORDERED_LIST), HTML_ORDERED_LIST);
  });

  it('transforms ordered nested lists correctly', () => {
    assert.equal(markdown(MD_NESTED_OL), HTML_NESTED_OL);
  });

});
