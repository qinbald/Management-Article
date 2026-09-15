'use client';
import { useEffect, useState } from 'react';

// ponytail: native dialog + CSS, no Radix. Add Radix when need focus-trap/nested modals.
export function Modal({
  open, onClose, title, children, onConfirm,
}: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; onConfirm?: () => void;
}) {
  const [visible, setVisible] = useState(open);
  useEffect(() => {
    if (open) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [open ]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transition-all duration-200 will-change-transform ${
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <div className="mt-2 text-sm text-slate-600">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-full hover:bg-slate-100 transition-colors">
            Batal
          </button>
          {onConfirm && (
            <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
