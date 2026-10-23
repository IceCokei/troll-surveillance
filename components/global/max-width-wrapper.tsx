import React from 'react';
import { cn } from '@/lib/cn';

const MaxWidthWrapper = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <section className={cn('h-full mx-auto w-full max-w-full md:max-w-screen-xl px-4 md:px-12 lg:px-20', className)}>
    {children}
  </section>
);

export default MaxWidthWrapper;
