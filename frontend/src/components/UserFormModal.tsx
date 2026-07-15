import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import { ApiError, createUser, updateUser } from '../api/userApi';
import { USER_ROLES, USER_STATUSES, type User, type UserRole, type UserStatus } from '../types/user';

interface UserFormModalProps {
  user?: User;
  onClose: () => void;
  onSuccess: (user: User, mode: 'create' | 'update') => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

// Just a basic check to catch obvious typos before hitting the API - the
// backend does the real validation, this is only here to save a round trip.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.firstName.trim()) errors.firstName = 'First name is required.';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  return errors;
}

export function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState<FormState>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'user',
    status: user?.status ?? 'pending',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
      };

      const saved = user
        ? await updateUser(user.id, payload)
        : await createUser(payload);

      onSuccess(saved, isEdit ? 'update' : 'create');
    } catch (error) {
      // Reusing the same fieldErrors state here for server-side errors
      // (like a duplicate email) so they show up right under the input,
      // same as the client-side checks above.
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setFieldErrors(error.fieldErrors);
        }
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit User' : 'Register User'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div
            role="alert"
            style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              padding: '10px 12px',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {formError}
          </div>
        )}

        <Field label="First Name" error={fieldErrors.firstName}>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            style={inputStyle(Boolean(fieldErrors.firstName))}
          />
        </Field>

        <Field label="Last Name" error={fieldErrors.lastName}>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            style={inputStyle(Boolean(fieldErrors.lastName))}
          />
        </Field>

        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            style={inputStyle(Boolean(fieldErrors.email))}
          />
        </Field>

        <Field label="Role" error={fieldErrors.role}>
          <select
            value={form.role}
            onChange={(e) => updateField('role', e.target.value as UserRole)}
            style={inputStyle(Boolean(fieldErrors.role))}
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" error={fieldErrors.status}>
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value as UserStatus)}
            style={inputStyle(Boolean(fieldErrors.status))}
          >
            {USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" style={primaryButtonStyle} disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Register User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
        {label}
      </label>
      {children}
      {error && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function inputStyle(hasError: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
    fontSize: 14,
    boxSizing: 'border-box',
  };
}

const primaryButtonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 14,
};

const secondaryButtonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  color: '#374151',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 14,
};
