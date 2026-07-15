import type { UserListMeta } from '../types/user';

interface PaginationProps {
  meta: UserListMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = meta;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        fontSize: 13,
        color: '#4b5563',
      }}
    >
      <span>
        {total === 0 ? 'No users' : `Showing ${start}–${end} of ${total}`}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={navButtonStyle}
        >
          Previous
        </button>
        <span style={{ padding: '6px 4px' }}>
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={navButtonStyle}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const navButtonStyle = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: 13,
} as const;
