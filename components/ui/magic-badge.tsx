import React from 'react';
import { cn } from '@/lib/cn';

interface Props {
  title: string;
  className?: string;
}

/** linkify 同款：conic 渐旋边框胶囊 */
const MagicBadge = ({ title, className }: Props) => {
  return (
    <div className={cn('relative inline-flex h-8 overflow-hidden rounded-full p-[1.5px] select-none', className)}>
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#6d28d9_0%,#d8b4fe_50%,#6d28d9_100%)]" />
      <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-background px-4 py-1 text-sm font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-3xl">
        {title}
      </span>
    </div>
  );
};

export default MagicBadge;
