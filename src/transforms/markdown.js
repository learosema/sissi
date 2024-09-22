const MAGIC = [
  [/^###### (.+)$/g, '<h6>$1</h6>'],
  [/^##### (.+)$/g, '<h5>$1</h5>'],
  [/^#### (.+)$/g, '<h4>$1</h4>'],
  [/^### (.+)$/g, '<h3>$1</h3>'],
  [/^## (.+)$/g, '<h2>$1</h2>'],
  [/^# (.+)$/g, '<h1>$1</h1>'],
  [/ $/g, '<br/>'],
  [/_(.+)_/g, '<u>$1</u>'],
  [/\*(.+)\*/g, '<em>$1</em>'],
  [/\*\*(.+)\*\*/g, '<strong>$1</strong>'],
  [/<(https?:\/\/.+)>/g, '<a href="$1">$1</a>'],
  [
    /\!\[(.+)\]\((.+)\)/g,
    '<img src="$2" alt="$1" />'
  ],
  [
    /\[(.+)\]\((.+)\)/g,
    '<a href="$2">$1</a>'
  ]
];

const UL_PATTERN = /((\s*)(\-|(?:(?:\d+\.)+)) (.+)\n)+/
const ULLI_PATTERN = /(\s*)(\-|(?:(?:\d+\.)+)) (.+)\n?/g

function inlines(str) {
  let result = str
  for (const [search, replace] of MAGIC) {
    result = result.replace(search, replace);
  }
  return result
}

function renderList(list) {
  let u = Number.isNaN(list.start)
  let html = u ? '<ul>' : `<ol${list.start!==1?` start="${list.start}"`:''}>`;
  for (const li of list.items) {
    html += '<li>' + inlines(li.content);
    if (li.childList) {
      html+=renderList(li.childList);
    }
    html += '</li>';
  }
  return html + (u?'</ul>':'</ol>');
}

function parseList(block) {
  const matches = block.matchAll(ULLI_PATTERN);
  if (! matches) {
    throw new Error('could not be parsed', block);
  }
  const m = Array.from(matches);
  const listItems = m.map(match => ({
    indent: match[1].length,
    prefix: match[2],
    content: match[3],
  }));
  const parseStart = (str) => {
    const idxPattern = str.match(/(\d+)\.$/);
    return idxPattern ? parseInt(idxPattern[1]): NaN;
  }

  const list = {start: parseStart(listItems[0].prefix), items: []};
  let currentList = list;
  let stack = [];
  let last = null;

  for (const li of listItems) {
    if (last !== null && li.indent > last.indent) {
      stack.push(currentList);
      currentList = last.childList  = {
        start: parseStart(li.prefix),
        items: []
      };
    } else
    if (last && li.indent < last.indent && stack.length > 0) {
      currentList = stack.pop();
    }
    const item = {...li, childList: null};
    currentList.items.push(item);
    last = item;
  }
  return renderList(list);
}

export function markdown(input) {
  return input.replace(/\r\n/g,'\n').split('\n\n')
    .map(block => inlines(block.trim()))
    .map(block => {
    if (UL_PATTERN.test(block)) {
      return parseList(block);
    }
    if (/^<\w+>/.test(block)) {
      return block;
    }
    return `<p>${block}</p>`
  }).join('\n').trim();
}
