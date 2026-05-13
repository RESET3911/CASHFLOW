import type { User } from '../types';

interface Props {
  onSelect: (user: User) => void;
}

export default function UserSelectScreen({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">💰</div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent tracking-tight">
          CASHFLOW
        </h1>
        <p className="text-sm text-gray-400 mt-2">フリーランス収支・税金管理</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {[
          { id: 'takahashi' as User, emoji: '🎬', label: 'けんしん', desc: '' },
          { id: 'saku' as User, emoji: '📚', label: 'れな', desc: '' },
        ].map(u => (
          <button
            key={u.id}
            onClick={() => onSelect(u.id)}
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent active:scale-95 transition-transform text-left"
          >
            <span className="text-4xl">{u.emoji}</span>
            <div>
              <div className="font-bold text-gray-900 text-lg">{u.label}</div>
              {u.desc && <div className="text-xs text-gray-400">{u.desc}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
