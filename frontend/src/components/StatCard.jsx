/**
 * StatCard — dashboard summary card.
 */
export default function StatCard({ title, value, icon, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card p-6 flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[color] || colorMap.brand}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  );
}
