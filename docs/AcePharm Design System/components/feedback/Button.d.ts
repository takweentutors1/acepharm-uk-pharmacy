/**
 * Button Component Props
 * @startingPoint section="Components" subtitle="Reusable button with multiple variants" viewport="300x200"
 */

import { Button } from './Button';

export interface ButtonProps {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: 'default' | 'sm' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Button label and content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
}
