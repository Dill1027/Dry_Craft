function Spinner({ size = 'md', color = 'purple' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    indigo: 'border-indigo-500'
  };

  return (
    <div className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}/>
  );
}

export default Spinner;
