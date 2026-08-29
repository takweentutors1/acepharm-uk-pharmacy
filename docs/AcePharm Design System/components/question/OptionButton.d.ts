export interface OptionButtonProps {
  label: string;
  content: string;
  selected?: boolean;
  feedback?: 'correct' | 'wrong' | null;
  disabled?: boolean;
  onClick?: () => void;
}
