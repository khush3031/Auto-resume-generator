export type ResumeTemplate = {
  id: string
  name: string
  slug: string
  style: string
  thumbnail: string
  htmlPath: string
};

export type ResumeData = {
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  summary: string;
  experience: Array<{ title: string; company: string; date: string; description: string }>;
  education: Array<{ degree: string; school: string; date: string }>;
  skills: string[];
  languages: Array<{ name: string; level: string }>;
  certifications: string[];
};

export type ResumeRecord = {
  id: string;
  templateId: string;
  userId?: string;
  data: ResumeData;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export const HIDDEN_SENTINEL = '<span class="rf-hidden" aria-hidden="true"></span>';

const EMPTY_WRAPPER_CLASSES = [
  'section',
  'm-section',
  'main-section',
  's-sec',
  's-section',
  'summary-box',
  'top-bar',
  'panel',
  'panel-soft',
  'panel-inner',
  'panel-body',
  'panel-body--soft',
  'info',
  'rail-copy',
  'rail-card',
  'section-card',
  'card',
  'card-soft',
  'skill-list',
  'language-list',
  'sidebar-card',
  'support-card',
];

const HEADING_CLASSES = [
  'sec-title',
  'sec-head',
  's-sec-title',
  'm-title',
  'm-label',
  's-label',
  's-section-label',
  's-title',
  'section-title',
  'sidebar-section-title',
];

const STANDALONE_LABEL_CLASSES = ['s-label', 's-section-label', 's-title'];
const LEAF_WRAPPER_CLASSES = ['summary', 'rail-copy'];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasClass(openTag: string, classNames: string[]): boolean {
  const classAttr = openTag.match(/\bclass=(["'])([^"']*)\1/i)?.[2] ?? '';
  return classNames.some((className) => new RegExp(`(^|\\s)${escapeRegex(className)}(\\s|$)`, 'i').test(classAttr));
}

function addStyleDisplayNone(openTag: string, tagName: string): string {
  if (/\bstyle=(["'])/i.test(openTag)) {
    return openTag.replace(/\bstyle=(["'])([^"']*)\1/i, 'style="$2;display:none"');
  }
  return openTag.replace(new RegExp(`<${tagName}\\b`, 'i'), `<${tagName} style="display:none"`);
}

function stripMeaningfulContent(inner: string): string {
  const headingClassPattern = HEADING_CLASSES.map(escapeRegex).join('|');
  const headingLikePattern = new RegExp(
    `<(?:div|p|span|strong)[^>]*\\bclass=(["'])[^"']*\\b(?:${headingClassPattern})\\b[^"']*\\1[^>]*>[\\s\\S]*?<\\/(?:div|p|span|strong)>`,
    'gi',
  );

  let cleaned = inner
    .replace(/<span[^>]*\brf-hidden\b[^>]*>\s*<\/span>/gi, '')
    .replace(headingLikePattern, '')
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '');

  let previous = '';
  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned
      .replace(/<(p|div|span)[^>]*>\s*<\/\1>/gi, '')
      .replace(/<(p|div|span)[^>]*>\s*(?:<(?:p|div|span)[^>]*>\s*<\/(?:p|div|span)>\s*)+<\/\1>/gi, '')
      .replace(/<(p|div|span)[^>]*>\s*(?:<!--[\s\S]*?-->\s*)*<\/\1>/gi, '');
  }

  return cleaned
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatchingDivEnd(html: string, openStart: number, openEnd: number): number {
  let depth = 1;
  let cursor = openEnd;
  let closeStart = -1;

  while (depth > 0 && cursor < html.length) {
    const nextOpen = html.indexOf('<div', cursor);
    const nextClose = html.indexOf('</div>', cursor);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) closeStart = nextClose;
      cursor = nextClose + 6;
    }
  }

  return closeStart;
}

function hideEmptySectionTags(html: string): string {
  return html.replace(
    /(<section\b[^>]*>)([\s\S]*?)(<\/section>)/gi,
    (match, openTag: string, inner: string, closeTag: string) => {
      if (/display\s*:\s*none/i.test(openTag)) return match;
      return stripMeaningfulContent(inner)
        ? match
        : `${addStyleDisplayNone(openTag, 'section')}${inner}${closeTag}`;
    },
  );
}

function hideEmptyDivWrappers(html: string): string {
  let result = '';
  let remaining = html;

  while (true) {
    const openMatch = /<div\b[^>]*>/gi.exec(remaining);
    if (!openMatch || openMatch.index === undefined) {
      result += remaining;
      break;
    }

    const openTag = openMatch[0];
    const openStart = openMatch.index;
    const openEnd = openStart + openTag.length;

    if (!hasClass(openTag, EMPTY_WRAPPER_CLASSES)) {
      result += remaining.slice(0, openEnd);
      remaining = remaining.slice(openEnd);
      continue;
    }

    const closeStart = findMatchingDivEnd(remaining, openStart, openEnd);
    if (closeStart === -1) {
      result += remaining.slice(0, openEnd);
      remaining = remaining.slice(openEnd);
      continue;
    }

    const inner = remaining.slice(openEnd, closeStart);
    result += remaining.slice(0, openStart);
    result += stripMeaningfulContent(inner)
      ? `${openTag}${inner}</div>`
      : `${addStyleDisplayNone(openTag, 'div')}${inner}</div>`;
    remaining = remaining.slice(closeStart + 6);
  }

  return result;
}

function hideStandaloneLabelPairs(html: string): string {
  const labelClassPattern = STANDALONE_LABEL_CLASSES.map(escapeRegex).join('|');
  const labelPattern = `(<div\\b[^>]*\\bclass=(["'])[^"']*\\b(?:${labelClassPattern})\\b[^"']*\\2[^>]*>[\\s\\S]*?<\\/div>)`;
  const hiddenSpanPattern = `(<span[^>]*\\brf-hidden\\b[^>]*>\\s*<\\/span>)`;
  const hiddenParagraphPattern = `(<p\\b[^>]*>\\s*${hiddenSpanPattern}\\s*<\\/p>)`;
  const hiddenDivPattern = `(<div\\b[^>]*>\\s*(?:${hiddenSpanPattern}|${hiddenParagraphPattern})\\s*<\\/div>)`;

  return html
    .replace(new RegExp(`${labelPattern}(\\s*)${hiddenDivPattern}`, 'gi'), (match, labelBlock: string, _quote: string, gap: string, hiddenBlock: string) => {
      const labelOpenTag = labelBlock.match(/^<div\b[^>]*>/i)?.[0];
      const hiddenOpenTag = hiddenBlock.match(/^<div\b[^>]*>/i)?.[0];
      if (!labelOpenTag || !hiddenOpenTag) return match;
      return `${addStyleDisplayNone(labelOpenTag, 'div')}${labelBlock.slice(labelOpenTag.length)}${gap}${addStyleDisplayNone(hiddenOpenTag, 'div')}${hiddenBlock.slice(hiddenOpenTag.length)}`;
    })
    .replace(new RegExp(`${labelPattern}(\\s*)${hiddenParagraphPattern}`, 'gi'), (match, labelBlock: string, _quote: string, gap: string, hiddenBlock: string) => {
      const labelOpenTag = labelBlock.match(/^<div\b[^>]*>/i)?.[0];
      const hiddenOpenTag = hiddenBlock.match(/^<p\b[^>]*>/i)?.[0];
      if (!labelOpenTag || !hiddenOpenTag) return match;
      return `${addStyleDisplayNone(labelOpenTag, 'div')}${labelBlock.slice(labelOpenTag.length)}${gap}${addStyleDisplayNone(hiddenOpenTag, 'p')}${hiddenBlock.slice(hiddenOpenTag.length)}`;
    })
    .replace(new RegExp(`${labelPattern}(\\s*)${hiddenSpanPattern}`, 'gi'), (match, labelBlock: string, _quote: string, gap: string, hiddenBlock: string) => {
      const labelOpenTag = labelBlock.match(/^<div\b[^>]*>/i)?.[0];
      if (!labelOpenTag) return match;
      return `${addStyleDisplayNone(labelOpenTag, 'div')}${labelBlock.slice(labelOpenTag.length)}${gap}${hiddenBlock}`;
    });
}

function hideEmptyLeafWrappers(html: string): string {
  const leafClassPattern = LEAF_WRAPPER_CLASSES.map(escapeRegex).join('|');
  const leafPattern = new RegExp(
    `(<(p|div|span)\\b[^>]*\\bclass=(["'])[^"']*\\b(?:${leafClassPattern})\\b[^"']*\\3[^>]*>)([\\s\\S]*?)(<\\/\\2>)`,
    'gi',
  );

  return html.replace(leafPattern, (match, openTag: string, tagName: string, _quote: string, inner: string, closeTag: string) => {
    if (/display\s*:\s*none/i.test(openTag)) return match;
    return stripMeaningfulContent(inner)
      ? match
      : `${addStyleDisplayNone(openTag, tagName)}${inner}${closeTag}`;
  });
}

export function hideEmptyResumeSections(html: string): string {
  let result = hideStandaloneLabelPairs(html);
  result = hideEmptyLeafWrappers(result);
  result = hideEmptySectionTags(result);
  result = hideEmptyDivWrappers(result);
  return result;
}
