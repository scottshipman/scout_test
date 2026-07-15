import type { UserStatus } from '../types/user';

const STATUS_STYLES: Record<UserStatus, { bg: string; fg: string; label: string }> = {
  active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
  inactive: { bg: '#f3f4f6', fg: '#4b5563', label: 'Inactive' },
  pending: { bg: '#fef9c3', fg: '#854d0e', label: 'Pending' },
};

export function StatusBadge({ status }: { status: UserStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.fg,
        lineHeight: '18px',
      }}
    >
      {style.label}
    </span>
  );
}
