import { useEffect } from 'react';

interface Props {
  message: string;
  type?: 'error' | 'success';
  onClose: () => void;
}

export default function Toast({ message, type = 'error', onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2 text-sm font-medium ${
      type === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-emerald-500 text-white'
    }`}>
      <span>{type === 'error' ? '⚠️' : '✓'}</span>
      <span>{message}</span>
    </div>
  );
}
