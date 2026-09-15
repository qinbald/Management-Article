'use client';
import { ReactNode } from 'react';

// ponytail: CSS-only stagger, ceiling 50 items. Upgrade to Framer Motion when need drag/gesture.
export function StaggeredGrid({ children }: { children: ReactNode[] }) {
  return (
    <>
      {children.map((child, i) => (
        <div
          key={i}
          className="animate-[fadeInUp_0.4s_ease-out_both]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {child}
        </div>
      ))}
    </>
  );
}

// Usage:
// <div className="grid grid-cols-3 gap-6">
//   <StaggeredGrid>{articles.map(a => <Card key={a.id} {...a} />)}</StaggeredGrid>
// </div>
