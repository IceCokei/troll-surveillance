import { cn } from '@/lib/cn';

interface Props {
  children: React.ReactNode;
  delay?: number;
  reverse?: boolean;
  className?: string;
}

/** 纯 CSS 入场动画：不依赖 hydration，SSR/截图都能正常显示 */
const AnimationContainer = ({ children, className, reverse, delay = 0 }: Props) => (
  <div
    className={cn(className)}
    style={{
      animation: `${reverse ? 'fadeDown' : 'fadeUp'} 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
    }}
  >
    {children}
  </div>
);

export default AnimationContainer;
