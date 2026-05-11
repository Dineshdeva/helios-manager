/**
 * Badge — colour-coded label chip.
 * variant: 'gray' | 'green' | 'blue' | 'yellow' | 'red' | 'purple'
 */
const variantClasses = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-100 text-indigo-700',
};

export default function Badge({ children, variant = 'gray' }) {
  return (
    <span className={`badge ${variantClasses[variant] || variantClasses.gray}`}>
      {children}
    </span>
  );
}
