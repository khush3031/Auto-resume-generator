interface ContainerProps {
  children: React.ReactNode;
  size?: '6xl' | '7xl';
  className?: string;
}

export function Container({ children, size = '7xl', className = '' }: ContainerProps) {
  return (
    <div className={`container container--${size}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
