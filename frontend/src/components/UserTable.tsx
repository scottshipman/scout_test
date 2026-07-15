import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo, type CSSProperties } from 'react';
import type { User } from '../types/user';
import { StatusBadge } from './StatusBadge';

ModuleRegistry.registerModules([AllCommunityModule]);

const theme = themeQuartz.withParams({
  spacing: 8,
  borderRadius: 8,
});

interface UserTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function UserTable({ users, loading, onEdit, onDelete }: UserTableProps) {
  const columnDefs = useMemo<ColDef<User>[]>(
    () => [
      { field: 'firstName', headerName: 'First Name', sortable: true, flex: 1, minWidth: 120 },
      { field: 'lastName', headerName: 'Last Name', sortable: true, flex: 1, minWidth: 120 },
      { field: 'email', headerName: 'Email', sortable: true, flex: 1.4, minWidth: 200 },
      {
        field: 'role',
        headerName: 'Role',
        sortable: true,
        flex: 0.8,
        minWidth: 110,
        valueFormatter: (params) =>
          params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : '',
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        flex: 0.8,
        minWidth: 110,
        cellRenderer: (params: { value: User['status'] }) => <StatusBadge status={params.value} />,
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        sortable: true,
        flex: 0.9,
        minWidth: 120,
        valueFormatter: (params) => (params.value ? formatDate(params.value) : ''),
      },
      {
        headerName: 'Actions',
        sortable: false,
        flex: 0.8,
        minWidth: 140,
        cellRenderer: (params: { data: User }) => (
          <div style={{ display: 'flex', gap: 8, height: '100%', alignItems: 'center' }}>
            <button
              onClick={() => onEdit(params.data)}
              style={actionButtonStyle}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(params.data)}
              style={{ ...actionButtonStyle, color: '#dc2626', borderColor: '#fecaca' }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  );

  return (
    <div style={{ height: 480, width: '100%' }}>
      <AgGridReact<User>
        theme={theme}
        rowData={users}
        columnDefs={columnDefs}
        loading={loading}
        animateRows
        getRowId={(params) => params.data.id}
      />
    </div>
  );
}

const actionButtonStyle: CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  color: '#374151',
  cursor: 'pointer',
};
