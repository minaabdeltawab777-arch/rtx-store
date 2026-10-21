import React, { useState, useEffect } from 'react';
import { AppUser, UserRole, UserPermissions } from '../types';
import { cloudService, DEFAULT_PERMISSIONS } from '../services/supabase';
import { formatDateShort } from '../utils/formatters';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Lock,
  Edit2,
  Check,
  X,
  Zap,
  ShoppingBag
} from 'lucide-react';

interface UsersManagementViewProps {
  currentUser: AppUser;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add User Form State
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('cashier');
  const [newPermissions, setNewPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS.cashier);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await cloudService.getUsers();
      setUsers(list);
    } catch {
      setMessage({ type: 'error', text: 'تعذر جلب قائمة المستخدمين' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setNewRole(role);
    setNewPermissions(DEFAULT_PERMISSIONS[role]);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newDisplayName.trim() || !newUsername.trim() || !newUserPassword) {
      setMessage({ type: 'error', text: 'يرجى استكمال جميع الحقول المطلوبة' });
      return;
    }

    try {
      const emailToUse = newEmail.trim() || `${newUsername.trim().toLowerCase()}@rtxstore.local`;
      const res = await cloudService.createUser({
        displayName: newDisplayName.trim(),
        username: newUsername.trim().toLowerCase(),
        email: emailToUse,
        password: newUserPassword,
        role: newRole,
        permissions: newPermissions
      });

      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({ type: 'success', text: `تم إنشاء حساب ${newDisplayName} بنجاح!` });
        setIsAddModalOpen(false);
        // Reset form
        setNewDisplayName('');
        setNewUsername('');
        setNewEmail('');
        setNewUserPassword('');
        setNewRole('cashier');
        loadUsers();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'فشل إنشاء المستخدم' });
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    if (user.id === currentUser.id) {
      setMessage({ type: 'error', text: 'لا يمكنك تعطيل حسابك الحالي المسجل به الدخول' });
      return;
    }

    const nextState = !user.isActive;
    const res = await cloudService.updateUser(user.id, { isActive: nextState });
    if (res.success) {
      setMessage({
        type: 'success',
        text: `تم ${nextState ? 'تفعيل' : 'تعطيل'} حساب (${user.displayName}) بنجاح.`
      });
      loadUsers();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل تحديث حالة الحساب' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'كلمة المرور يجب أن تتكون من 6 أحرف/أرقام على الأقل' });
      return;
    }

    const res = await cloudService.resetUserPassword(resetPasswordUser.id, newPassword);
    if (res.success) {
      setMessage({
        type: 'success',
        text: `تم إعادة تعيين كلمة المرور لحساب (${resetPasswordUser.displayName}) بنجاح.`
      });
      setResetPasswordUser(null);
      setNewPassword('');
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل تغيير كلمة المرور' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-['Cairo',sans-serif]">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111520] border border-[#22293b] p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center border border-[#76b900]/30 shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              إدارة المستخدمين وحسابات الكاشير
              <span className="text-xs bg-[#76b900]/20 text-[#76b900] px-2.5 py-0.5 rounded-full border border-[#76b900]/30 font-bold">
                {users.length} مستخدمين
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              إضافة كاشيرات الفروع، التحكم في الصلاحيات، وإلغاء/تفعيل الحسابات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-[#76b900] hover:bg-[#85ce00] text-black font-black text-xs rounded-xl shadow-lg shadow-[#76b900]/25 flex items-center gap-2 cursor-pointer transition-all"
        >
          <UserPlus className="w-4 h-4" />
          إضافة كاشير / مستخدم جديد
        </button>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-[#142312] border border-[#274e1e] text-green-300'
              : 'bg-red-950/50 border border-red-800 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Users Grid / Table */}
      <div className="bg-[#111520] border border-[#22293b] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#161c2c] text-slate-400 border-b border-[#252e42]">
                <th className="py-3.5 px-4 font-bold">المستخدم</th>
                <th className="py-3.5 px-4 font-bold">اسم الدخول (Username)</th>
                <th className="py-3.5 px-4 font-bold">الدور الوظيفي</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold">الصلاحيات</th>
                <th className="py-3.5 px-4 font-bold">آخر تسجيل دخول</th>
                <th className="py-3.5 px-4 font-bold text-center">إجراءات الإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2536]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-[#76b900] border-t-transparent rounded-full animate-spin inline-block mb-2" />
                    <div>جاري تحميل الحسابات...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا يوجد حسابات مسجلة بعد.
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#161c2a]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              u.role === 'owner'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : u.role === 'admin'
                                ? 'bg-[#76b900]/20 text-[#76b900] border border-[#76b900]/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {u.displayName}
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                                  أنت
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300" dir="ltr">
                        @{u.username}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                            u.role === 'owner'
                              ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50'
                              : u.role === 'admin'
                              ? 'bg-[#1b2b11] text-[#86d400] border border-[#3b5e19]'
                              : 'bg-blue-950/40 text-blue-300 border border-blue-800/50'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {u.role === 'owner'
                            ? 'المالك / Super Admin'
                            : u.role === 'admin'
                            ? 'مدير فرع / Admin'
                            : 'كاشير / Cashier'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-green-400 font-bold bg-green-950/30 px-2 py-0.5 rounded-md border border-green-800/40 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-950/30 px-2 py-0.5 rounded-md border border-red-800/40 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            معطل
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.permissions?.canDiscount && (
                            <span className="text-[10px] bg-[#1a2333] text-slate-300 px-1.5 py-0.5 rounded">
                              خصومات
                            </span>
                          )}
                          {u.permissions?.canViewReports && (
                            <span className="text-[10px] bg-[#1a2333] text-slate-300 px-1.5 py-0.5 rounded">
                              تقارير
                            </span>
                          )}
                          {u.permissions?.canManageProducts && (
                            <span className="text-[10px] bg-[#1a2333] text-slate-300 px-1.5 py-0.5 rounded">
                              منتجات
                            </span>
                          )}
                          {u.permissions?.canCancelInvoices && (
                            <span className="text-[10px] bg-red-950/40 text-red-300 px-1.5 py-0.5 rounded border border-red-800/40">
                              إلغاء فواتير
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {u.lastLoginAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#76b900]" />
                            {formatDateShort(u.lastLoginAt)}
                          </div>
                        ) : (
                          <span className="text-slate-600">لم يسجل دخول بعد</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Toggle Active */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            disabled={isCurrent}
                            title={u.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed border-slate-700 text-slate-500'
                                : u.isActive
                                ? 'bg-red-950/30 border-red-800/50 text-red-400 hover:bg-red-950/60'
                                : 'bg-green-950/30 border-green-800/50 text-green-400 hover:bg-green-950/60'
                            }`}
                          >
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetPasswordUser(u);
                              setNewPassword('');
                            }}
                            title="إعادة تعيين كلمة المرور"
                            className="p-1.5 bg-[#182030] hover:bg-[#202b40] border border-[#2c3750] text-amber-400 rounded-lg cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111520] border border-[#273044] rounded-3xl p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-4 border-b border-[#21293a] mb-5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#76b900]" />
                إضافة مستخدم أو كاشير جديد
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم الكامل / الظاهر:
                  </label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={e => setNewDisplayName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    required
                    className="w-full bg-[#0a0d14] border border-[#273044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#76b900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم المستخدم للدخول:
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="cashier1"
                    dir="ltr"
                    required
                    className="w-full bg-[#0a0d14] border border-[#273044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#76b900]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    البريد الإلكتروني:
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="cashier1@rtxstore.com"
                    dir="ltr"
                    className="w-full bg-[#0a0d14] border border-[#273044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#76b900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    كلمة المرور الابتدائية:
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    required
                    className="w-full bg-[#0a0d14] border border-[#273044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#76b900]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الدور الوظيفي:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('cashier')}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer text-center ${
                      newRole === 'cashier'
                        ? 'bg-[#76b900]/20 border-[#76b900] text-[#76b900]'
                        : 'bg-[#141926] border-[#252e42] text-slate-400'
                    }`}
                  >
                    كاشير (Cashier)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer text-center ${
                      newRole === 'admin'
                        ? 'bg-[#76b900]/20 border-[#76b900] text-[#76b900]'
                        : 'bg-[#141926] border-[#252e42] text-slate-400'
                    }`}
                  >
                    مدير فرع (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('owner')}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer text-center ${
                      newRole === 'owner'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-[#141926] border-[#252e42] text-slate-400'
                    }`}
                  >
                    مالك (Owner)
                  </button>
                </div>
              </div>

              {/* Explicit Permissions Toggle */}
              <div className="p-3 bg-[#0a0d14] border border-[#21293a] rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block mb-1">
                  صلاحيات الحساب التفصيلية:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.canDiscount}
                      onChange={e =>
                        setNewPermissions({ ...newPermissions, canDiscount: e.target.checked })
                      }
                      className="accent-[#76b900]"
                    />
                    تطبيق خصومات بالكاشير
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.canPrintLabels}
                      onChange={e =>
                        setNewPermissions({ ...newPermissions, canPrintLabels: e.target.checked })
                      }
                      className="accent-[#76b900]"
                    />
                    طباعة استيكرات الباركود
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.canViewReports}
                      onChange={e =>
                        setNewPermissions({ ...newPermissions, canViewReports: e.target.checked })
                      }
                      className="accent-[#76b900]"
                    />
                    عرض تقارير المبيعات
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.canManageProducts}
                      onChange={e =>
                        setNewPermissions({
                          ...newPermissions,
                          canManageProducts: e.target.checked
                        })
                      }
                      className="accent-[#76b900]"
                    />
                    تعديل أسعار وبضاعة المخزن
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-red-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.canCancelInvoices}
                      onChange={e =>
                        setNewPermissions({
                          ...newPermissions,
                          canCancelInvoices: e.target.checked
                        })
                      }
                      className="accent-red-500"
                    />
                    صلاحية إلغاء الفواتير
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-amber-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.canManageUsers}
                      onChange={e =>
                        setNewPermissions({ ...newPermissions, canManageUsers: e.target.checked })
                      }
                      className="accent-amber-500"
                    />
                    إدارة حسابات المستخدمين
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#21293a]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#171d2b] text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#76b900] text-black rounded-xl text-xs font-black shadow-lg shadow-[#76b900]/20"
                >
                  حفظ وإنشاء الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111520] border border-[#273044] rounded-3xl p-6 shadow-2xl text-right">
            <h3 className="text-base font-black text-white flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-amber-400" />
              إعادة تعيين كلمة المرور
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              تحديد كلمة مرور جديدة للمستخدم: <span className="text-white font-bold">{resetPasswordUser.displayName}</span> ({resetPasswordUser.username})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور الجديدة:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                  className="w-full bg-[#0a0d14] border border-[#273044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#76b900]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#21293a]">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 bg-[#171d2b] text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black shadow-lg"
                >
                  تأكيد كلمة المرور الجديدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
