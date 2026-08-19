import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: React.ReactNode;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmIcon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  itemName,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  confirmIcon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const badgeBg = isDanger
    ? 'rgba(251, 113, 133, 0.15)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.15)'
    : 'rgba(250, 240, 202, 0.15)';

  const badgeColor = isDanger
    ? '#fda4af'
    : isWarning
    ? '#fbbf24'
    : '#FAF0CA';

  const badgeBorder = isDanger
    ? '1px solid rgba(251, 113, 133, 0.35)'
    : isWarning
    ? '1px solid rgba(245, 158, 11, 0.35)'
    : '1px solid rgba(250, 240, 202, 0.35)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 18, 32, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '1.5rem',
        animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          maxWidth: 460,
          width: '100%',
          padding: '1.75rem',
          background: 'rgba(10, 43, 74, 0.98)',
          border: isDanger ? '1px solid rgba(251, 113, 133, 0.35)' : '1px solid rgba(250, 240, 202, 0.28)',
          boxShadow: isDanger
            ? '0 24px 64px rgba(4, 18, 32, 0.95), 0 0 32px rgba(251, 113, 133, 0.15)'
            : '0 24px 64px rgba(4, 18, 32, 0.95), 0 0 32px rgba(13, 59, 102, 0.8)',
          animation: 'modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: badgeBg,
                border: badgeBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: badgeColor,
                flexShrink: 0,
              }}
            >
              {confirmIcon ? (
                confirmIcon
              ) : isDanger ? (
                <Trash2 size={20} />
              ) : isWarning ? (
                <AlertTriangle size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#FAF0CA', fontSize: '1.15rem', fontWeight: 700 }}>{title}</h3>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
          {message ? (
            message
          ) : itemName ? (
            <div>
              Are you sure you want to remove <strong style={{ color: '#FAF0CA' }}>"{itemName}"</strong>?
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                This action will permanently unlist this dataset from the marketplace.
              </div>
            </div>
          ) : (
            'Are you sure you want to proceed with this action?'
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            style={{ padding: '0.55rem 1.1rem' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onConfirm}
            style={
              isDanger
                ? {
                    background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(251, 113, 133, 0.4)',
                    boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)',
                    padding: '0.55rem 1.1rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }
                : isWarning
                ? {
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 4px 16px rgba(217, 119, 6, 0.4)',
                    padding: '0.55rem 1.1rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }
                : {
                    background: '#FAF0CA',
                    color: '#0D3B66',
                    padding: '0.55rem 1.1rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }
            }
          >
            {confirmIcon ? confirmIcon : isDanger ? <Trash2 size={14} /> : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
