// Render a Portable Text tree to email-safe HTML.
// Email clients hate complex CSS — keep this minimal and use inline styles only.

import * as React from 'react';
import type { PortableTextBlock } from '@sanity/types';
import { renderPortableText, type TemplateVars } from '../templating';

interface Span {
  _type: 'span';
  text: string;
  marks?: string[];
}

interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

interface BlockNode {
  _type: 'block';
  children?: Array<Span | { _type: string; [key: string]: unknown }>;
  markDefs?: MarkDef[];
  style?: string;
}

export function PortableTextEmail({
  value,
  vars,
  textColor,
  linkColor,
  fontFamily,
}: {
  value: PortableTextBlock[];
  vars?: TemplateVars;
  textColor: string;
  linkColor: string;
  fontFamily: string;
}) {
  const rendered = renderPortableText(value, vars);
  return (
    <>
      {rendered.map((block, i) => {
        if (block._type !== 'block') return null;
        return (
          <Block
            key={i}
            block={block as unknown as BlockNode}
            textColor={textColor}
            linkColor={linkColor}
            fontFamily={fontFamily}
          />
        );
      })}
    </>
  );
}

function Block({
  block,
  textColor,
  linkColor,
  fontFamily,
}: {
  block: BlockNode;
  textColor: string;
  linkColor: string;
  fontFamily: string;
}) {
  const baseStyle: React.CSSProperties = {
    color: textColor,
    fontFamily,
    fontSize: block.style === 'h3' ? '18px' : '14px',
    lineHeight: '1.55',
    margin: block.style === 'h3' ? '24px 0 8px' : '0 0 12px',
    fontWeight: block.style === 'h3' ? 600 : 400,
  };

  const inner = (block.children ?? []).map((child, i) => {
    if (child._type !== 'span') return null;
    const span = child as Span;
    return (
      <Span
        key={i}
        span={span}
        markDefs={block.markDefs ?? []}
        linkColor={linkColor}
      />
    );
  });

  if (block.style === 'h3') {
    return <h3 style={baseStyle}>{inner}</h3>;
  }
  return <p style={baseStyle}>{inner}</p>;
}

function Span({
  span,
  markDefs,
  linkColor,
}: {
  span: Span;
  markDefs: MarkDef[];
  linkColor: string;
}) {
  let node: React.ReactNode = span.text;
  for (const mark of span.marks ?? []) {
    if (mark === 'strong') node = <strong>{node}</strong>;
    else if (mark === 'em') node = <em>{node}</em>;
    else {
      const def = markDefs.find((m) => m._key === mark);
      if (def?._type === 'link' && def.href) {
        node = (
          <a href={def.href} style={{ color: linkColor, textDecoration: 'underline' }}>
            {node}
          </a>
        );
      }
    }
  }
  return <>{node}</>;
}
