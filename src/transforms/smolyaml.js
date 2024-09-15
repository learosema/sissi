// smolYAML is a subset of YAML

const parseValue = (str) => str === 'NaN' ? NaN : str === 'undefined' ? undefined : /^\-?\d+(?:\.\d+)?(?:e\d+)?$/.test(str) ||
  ['true', 'false', 'null'].includes(str) || /^['"\{\}\[\]\/]/.test(str) ? JSON.parse(str) : str;

function buildObject(lines) {
  if (lines.length === 0) {
    return null;
  }
  if (lines.length === 1 && lines[0].t === 3) {
    return parseValue(lines[0].v)
  }
  const result = lines[0].t === 0 ? {} : [];
  let ref = result;
  const stack = [];
  let temp = null;
  
  for (let i = 0; i < lines.length; i++) { 
    const line = lines[i];
    if (line.t >= 3) {
      throw new Error('unsupported Syntax');
    }
    const nextLine = i < lines.length - 1 ? lines[i + 1] : null;
    if (line.t === 2 && line.k && ref instanceof Array) {
      temp = {[line.k]: parseValue(line.v)};
      ref.push(temp);
      stack.push([ref, line.i]);
      ref = temp;
    }
    if (line.t === 0 && line.k && ref instanceof Array === false) {
      if (line.v) {
        ref[line.k] = parseValue(line.v);
      } else {
        ref[line.k] = nextLine.t === 0 ? {} : [];
      }
      if (nextLine && nextLine.i > line.i) {
        stack.push([ref, line.i]);
        ref = ref[line.k];
        continue;
      }
    }
    if (line.t === 1 && line.v && ref instanceof Array) {
      ref.push(parseValue(line.v));
    }
    if (nextLine && nextLine.i < line.i) {
      let indent = line.i;
      while (indent > nextLine.i) {
        const stackItem = stack.pop();
        if (!stackItem) {
          throw new Error('stack underflow');
        }
        const [formerRef, formerIndent] = stackItem;
        ref =  formerRef;
        indent = formerIndent;
      }
    }
  }
  return result;
}

export function smolYAML(str) {
  const analyzed = str.split(/\r?\n/).map(line => {
    const m0 = line.match(/^(\s*)(\w+):\s*(.+)?$/);
    if (m0) {
      return {t: 0, i: m0[1].length, k: m0[2], v: m0[3]};
    }
    const m2 = line.match(/^(\s*)- (\w+):\s*(.+)$/)
    if (m2) {
      return {t: 2, i: m2[1].length, k: m2[2], v: m2[3]};
    }
    const m1 = line.match(/^(\s*)- (.+)$/);
    if (m1) {
      return {t:1, i: m1[1].length, v: m1[2]};
    }
    if (line.trim() === '' || /\s*#|(\/\/)/.test(line)) {
      return undefined;
    }
    const m3 = line.match(/^(\s*)(.+)\s*$/);
    return {t: 3, i: m3[1].length, v: m3[2]};
  }).filter(Boolean);
  return buildObject(analyzed);
}
