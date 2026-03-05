'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, UserRecord, usersService } from '@/services/users.service';

type UserFormState = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: 'client' | 'advisor' | 'admin';
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

const emptyUserForm: UserFormState = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: 'client',
};

const emptyPasswordForm: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

function roleBadgeClass(role: string): string {
  if (role === 'admin') return 'bg-red-100 text-red-700';
  if (role === 'advisor') return 'bg-blue-100 text-blue-700';
  return 'bg-emerald-100 text-emerald-700';
}

export default function AdminUsersPage(): JSX.Element {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetPasswordUser, setTargetPasswordUser] = useState<UserRecord | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);

  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);

  async function loadUsers(nextSearch?: string): Promise<void> {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersService.listUsers(nextSearch ?? search, token);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const modalTitle = useMemo(() => (editingUser ? 'Editar usuario' : 'Nuevo usuario'), [editingUser]);

  function openCreateModal(): void {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setIsUserModalOpen(true);
  }

  function openEditModal(target: UserRecord): void {
    setEditingUser(target);
    setUserForm({
      fullName: target.fullName,
      email: target.email,
      password: '',
      phone: target.phone ?? '',
      role: target.role,
    });
    setIsUserModalOpen(true);
  }

  async function submitUserForm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;

    try {
      if (editingUser) {
        const payload: UpdateUserDto = {
          fullName: userForm.fullName,
          email: userForm.email,
          phone: userForm.phone || undefined,
          role: userForm.role,
        };
        await usersService.updateUser(editingUser.id, payload, token);
      } else {
        const payload: CreateUserDto = {
          fullName: userForm.fullName,
          email: userForm.email,
          password: userForm.password,
          phone: userForm.phone || undefined,
          role: userForm.role,
        };
        await usersService.createUser(payload, token);
      }
      setIsUserModalOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario');
    }
  }

  function openPasswordModal(target: UserRecord): void {
    setTargetPasswordUser(target);
    setPasswordForm(emptyPasswordForm);
    setIsPasswordModalOpen(true);
  }

  async function submitPasswordForm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !targetPasswordUser) return;

    try {
      const changingOwnPassword = user?.id === targetPasswordUser.id;
      const payload: ChangePasswordDto = {
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
        ...(changingOwnPassword ? { currentPassword: passwordForm.currentPassword } : {}),
      };
      await usersService.changePassword(targetPasswordUser.id, payload, token);
      setIsPasswordModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!token || !deletingUser) return;

    try {
      await usersService.deleteUser(deletingUser.id, token);
      setDeletingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario');
    }
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-600">Administra usuarios y permisos del sistema.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
          ➕ Nuevo Usuario
        </button>
      </header>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4">
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); }}
            placeholder="Buscar por nombre o email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 md:max-w-sm"
          />
          <button
            type="button"
            onClick={() => { void loadUsers(search); }}
            className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Buscar
          </button>
        </div>

        {error ? <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="px-2 py-2">Nombre</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Rol</th>
                <th className="px-2 py-2">Teléfono</th>
                <th className="px-2 py-2">Creado</th>
                <th className="px-2 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-2 py-4 text-slate-500" colSpan={6}>Cargando usuarios...</td></tr>
              ) : users.length === 0 ? (
                <tr><td className="px-2 py-4 text-slate-500" colSpan={6}>No hay usuarios.</td></tr>
              ) : users.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-2 py-2 font-medium text-slate-800">{item.fullName}</td>
                  <td className="px-2 py-2 text-slate-600">{item.email}</td>
                  <td className="px-2 py-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleBadgeClass(item.role)}`}>{item.role}</span></td>
                  <td className="px-2 py-2 text-slate-600">{item.phone ?? '-'}</td>
                  <td className="px-2 py-2 text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { openEditModal(item); }} className="rounded border px-2 py-1 hover:bg-slate-100">✏️ Editar</button>
                      <button type="button" onClick={() => { openPasswordModal(item); }} className="rounded border px-2 py-1 hover:bg-slate-100">🔑 Contraseña</button>
                      <button type="button" onClick={() => { setDeletingUser(item); }} className="rounded border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50">🗑️ Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isUserModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <h2 className="text-xl font-bold">{modalTitle}</h2>
            <form className="mt-4 space-y-3" onSubmit={(event) => { void submitUserForm(event); }}>
              <input required value={userForm.fullName} onChange={(event) => { setUserForm((prev) => ({ ...prev, fullName: event.target.value })); }} placeholder="Nombre completo" className="w-full rounded border px-3 py-2" />
              <input required type="email" value={userForm.email} onChange={(event) => { setUserForm((prev) => ({ ...prev, email: event.target.value })); }} placeholder="Email" className="w-full rounded border px-3 py-2" />
              {!editingUser ? (
                <input required type="password" value={userForm.password} onChange={(event) => { setUserForm((prev) => ({ ...prev, password: event.target.value })); }} placeholder="Contraseña" className="w-full rounded border px-3 py-2" />
              ) : null}
              <input value={userForm.phone} onChange={(event) => { setUserForm((prev) => ({ ...prev, phone: event.target.value })); }} placeholder="Teléfono (opcional)" className="w-full rounded border px-3 py-2" />
              <select value={userForm.role} onChange={(event) => { setUserForm((prev) => ({ ...prev, role: event.target.value as UserFormState['role'] })); }} className="w-full rounded border px-3 py-2">
                <option value="client">client</option>
                <option value="advisor">advisor</option>
                <option value="admin">admin</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setIsUserModalOpen(false); }} className="rounded border px-3 py-2">Cancelar</button>
                <button type="submit" className="rounded bg-blue-700 px-3 py-2 text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isPasswordModalOpen && targetPasswordUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <h2 className="text-xl font-bold">Cambiar contraseña</h2>
            <p className="mt-1 text-sm text-slate-500">Usuario: {targetPasswordUser.fullName}</p>
            <form className="mt-4 space-y-3" onSubmit={(event) => { void submitPasswordForm(event); }}>
              {user?.id === targetPasswordUser.id ? (
                <input type="password" required value={passwordForm.currentPassword} onChange={(event) => { setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value })); }} placeholder="Contraseña actual" className="w-full rounded border px-3 py-2" />
              ) : null}
              <input type="password" required value={passwordForm.newPassword} onChange={(event) => { setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value })); }} placeholder="Nueva contraseña" className="w-full rounded border px-3 py-2" />
              <input type="password" required value={passwordForm.confirmNewPassword} onChange={(event) => { setPasswordForm((prev) => ({ ...prev, confirmNewPassword: event.target.value })); }} placeholder="Confirmar nueva contraseña" className="w-full rounded border px-3 py-2" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setIsPasswordModalOpen(false); }} className="rounded border px-3 py-2">Cancelar</button>
                <button type="submit" className="rounded bg-blue-700 px-3 py-2 text-white">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <h2 className="text-xl font-bold text-slate-900">Confirmar eliminación</h2>
            <p className="mt-2 text-sm text-slate-600">¿Eliminar a {deletingUser.fullName}? Esta acción no se puede deshacer.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setDeletingUser(null); }} className="rounded border px-3 py-2">Cancelar</button>
              <button type="button" onClick={() => { void confirmDelete(); }} className="rounded bg-red-700 px-3 py-2 text-white">Eliminar</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
