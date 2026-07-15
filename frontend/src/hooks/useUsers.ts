import { useCallback, useEffect, useState } from 'react';
import { ApiError, fetchUsers } from '../api/userApi';
import type { User, UserListMeta } from '../types/user';

interface UseUsersResult {
  users: User[];
  meta: UserListMeta | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsers(page: number, limit: number): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<UserListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // reloadToken doesn't do anything on its own, it's just here so refetch()
  // can force the effect below to run again without changing page or limit.
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    // Bailing out on stale responses in case page/limit changes again
    // before this fetch finishes, so an old request can't overwrite newer data.
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchUsers(page, limit);
        if (cancelled) return;
        setUsers(response.data);
        setMeta(response.meta);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load users.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page, limit, reloadToken]);

  return { users, meta, loading, error, refetch };
}
