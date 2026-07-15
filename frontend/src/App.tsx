import { useState } from 'react';
import { UserTable } from './components/UserTable';
import { Pagination } from './components/Pagination';
import { UserFormModal } from './components/UserFormModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useToast } from './components/ToastContext';
import { useUsers } from './hooks/useUsers';
import { ApiError, deleteUser } from './api/userApi';
import type { User } from './types/user';

const PAGE_SIZE = 10;

function App() {
  const [page, setPage] = useState(1);
  const { users, meta, loading, error, refetch } = useUsers(page, PAGE_SIZE);
  const { showSuccess, showError } = useToast();

  // Using one piece of state for both "add" and "edit" - 'new' means the
  // form is open but empty, a User means it's open and pre-filled.
  const [formUser, setFormUser] = useState<User | undefined | 'new'>(undefined);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Just refetching the list after a save instead of updating state by hand.
  // A bit slower but keeps the table and pagination numbers always correct.
  function handleFormSuccess(user: User, mode: 'create' | 'update') {
    setFormUser(undefined);
    showSuccess(mode === 'create' ? `${user.firstName} ${user.lastName} was registered.` : `${user.firstName} ${user.lastName} was updated.`);
    if (mode === 'create') {
      setPage(1);
    }
    refetch();
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      showSuccess(`${userToDelete.firstName} ${userToDelete.lastName} was deleted.`);
      setUserToDelete(null);
      refetch();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>User Management</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            Manage user accounts, roles, and status.
          </p>
        </div>
        <button
          onClick={() => setFormUser('new')}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + Register User
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <UserTable
        users={users}
        loading={loading}
        onEdit={(user) => setFormUser(user)}
        onDelete={(user) => setUserToDelete(user)}
      />

      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      {formUser !== undefined && (
        <UserFormModal
          user={formUser === 'new' ? undefined : formUser}
          onClose={() => setFormUser(undefined)}
          onSuccess={handleFormSuccess}
        />
      )}

      {userToDelete && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete.firstName} ${userToDelete.lastName}? This cannot be undone.`}
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
}

export default App;
