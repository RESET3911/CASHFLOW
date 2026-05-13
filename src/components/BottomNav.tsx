type Screen = 'dashboard' | 'income' | 'expense' | 'business';

interface Props {
  current: Screen;
  onChange: (s: Screen) => void;
}

const tabs: { id: Screen; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'ホーム' },
  { id: 'income',    icon: '💴', label: '収入' },
  { id: 'expense',   icon: '📌', label: '支出' },
  { id: 'business',  icon: '🧾', label: '経費' },
];

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40 pb-safe">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
            current === t.id
              ? 'text-violet-600 font-semibold'
              : 'text-gray-400'
          }`}
        >
          <span className="text-xl leading-none">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
