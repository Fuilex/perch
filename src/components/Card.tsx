import type { ReactNode } from 'react';
import { cardVariants } from '@/design/animations';
import { Glass } from './Glass';

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Card({ children, onClick, className }: CardProps) {
  return (
    <Glass
      variant="card"
      interactive={!!onClick}
      radius="var(--radius-lg)"
      padding="var(--space-4)"
      className={className}
      variants={onClick ? cardVariants : undefined}
      initial="idle"
      whileHover={onClick ? 'hover' : undefined}
      whileTap={onClick ? 'tap' : undefined}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </Glass>
  );
}
