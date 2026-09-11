declare module 'animate-ui' {
  import { ReactNode, CSSProperties } from 'react';

  export interface ButtonProps {
    children?: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    onClick?: () => void;
  }
  export const Button: React.FC<ButtonProps>;

  export interface InputProps {
    id?: string;
    name?: string;
    type?: string;
    value?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
  }
  export const Input: React.FC<InputProps>;

  export interface CheckboxProps {
    label?: string;
    checked?: boolean;
    disabled?: boolean;
    className?: string;
    onChange?: (checked: boolean) => void;
  }
  export const Checkbox: React.FC<CheckboxProps>;

  export interface AlertProps {
    type?: 'info' | 'success' | 'warning' | 'error';
    message?: string;
    className?: string;
    onClose?: () => void;
  }
  export const Alert: React.FC<AlertProps>;

  export interface DropdownProps {
    trigger: ReactNode;
    items: Array<{
      label?: string;
      onClick?: () => void;
      type?: 'divider';
    }>;
    className?: string;
  }
  export const Dropdown: React.FC<DropdownProps>;

  export interface AvatarProps {
    src?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
    style?: CSSProperties;
  }
  export const Avatar: React.FC<AvatarProps>;

  export interface CardProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  }
  export const Card: React.FC<CardProps>;

  export interface CardHeaderProps {
    children?: ReactNode;
    className?: string;
  }
  export const CardHeader: React.FC<CardHeaderProps>;

  export interface CardBodyProps {
    children?: ReactNode;
    className?: string;
  }
  export const CardBody: React.FC<CardBodyProps>;

  export interface ModalProps {
    open?: boolean;
    title?: string;
    children?: ReactNode;
    onClose?: () => void;
    className?: string;
  }
  export const Modal: React.FC<ModalProps>;

  export interface SelectProps {
    value?: string;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    onChange?: (value: string) => void;
  }
  export const Select: React.FC<SelectProps>;

  export interface PaginationProps {
    current?: number;
    total?: number;
    pageSize?: number;
    onChange?: (page: number) => void;
    className?: string;
  }
  export const Pagination: React.FC<PaginationProps>;

  export interface TagProps {
    children?: ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    className?: string;
  }
  export const Tag: React.FC<TagProps>;

  export interface BadgeProps {
    children?: ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    className?: string;
  }
  export const Badge: React.FC<BadgeProps>;

  export interface SpinProps {
    tip?: string;
    className?: string;
  }
  export const Spin: React.FC<SpinProps>;

  export interface TabsProps {
    activeKey?: string;
    items?: Array<{
      key: string;
      label: string;
      children?: ReactNode;
    }>;
    onChange?: (key: string) => void;
    className?: string;
  }
  export const Tabs: React.FC<TabsProps>;

  export interface MessageProps {
    content?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    onClose?: () => void;
  }
  export const message: {
    info: (content: string, duration?: number) => void;
    success: (content: string, duration?: number) => void;
    warning: (content: string, duration?: number) => void;
    error: (content: string, duration?: number) => void;
  };
}
