import { useEffect } from 'react';
import { X } from 'lucide-react';
import Login from '../pages/Auth/Login';

export default function LoginModal({ open, onClose, initialMode = 'login' }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="modal-panel relative w-full max-w-104" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-soft shadow-md transition-colors hover:text-terracotta"
        >
          <X className="h-5 w-5" />
        </button>

        {/* key forces a clean remount so the right tab (login/signup) shows each time it opens */}
        <Login key={initialMode} embedded initialMode={initialMode} />
      </div>
    </div>
  );
}
