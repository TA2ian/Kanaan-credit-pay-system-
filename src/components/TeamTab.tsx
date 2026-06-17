/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { usePopup } from '../lib/PopupContext';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  User, 
  Clock, 
  AlertTriangle, 
  Check, 
  Users, 
  Lock,
  UserCheck,
  RefreshCw
} from 'lucide-react';

export function TeamTab() {
  const { 
    profile, 
    teamMembers, 
    pendingInvitations, 
    inviteTeamMember, 
    deleteTeamMemberProfile, 
    cancelInvitation 
  } = useFirebase();

  const { showAlert, showConfirm } = usePopup();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'assistant' | 'accountant' | 'representative'>('representative');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailClean = inviteEmail.toLowerCase().trim();
    if (!emailClean) {
      setError('يرجى كتابة البريد الإلكتروني للموظف المرعوب انضمامه.');
      return;
    }

    // Check if user is already a member
    const isMember = teamMembers.some(m => m.email.toLowerCase() === emailClean);
    if (isMember) {
      setError('هذا المستخدم عضو بالفعل في فريق عملك.');
      return;
    }

    // Check if invitation is already pending
    const isPending = pendingInvitations.some(i => i.email.toLowerCase() === emailClean);
    if (isPending) {
      setError('تم إرسال دعوة معلقة لهذا البريد الإلكتروني مسبقاً.');
      return;
    }

    setLoading(true);
    try {
      await inviteTeamMember(emailClean, inviteRole);
      setSuccess(`تم تسجيل الدعوة بنجاح! بمجرد قيام الموظف بالتسجيل ببرق Gmail: ${emailClean} سيتم نقله تلقائياً لفريقك بصلاحية مخصصة.`);
      setInviteEmail('');
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء إرسال الدعوة: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    showConfirm({
      title: 'إبعاد عضو الفريق',
      message: `هل أنت متأكد من رغبتك في إبعاد "${memberEmail}" من فريق عملك وإبطال صلاحياته فوراً؟`,
      isDanger: true,
      confirmText: 'نعم، قم بالإبعاد',
      cancelText: 'تراجع',
      onConfirm: async () => {
        setActionLoadingId(memberId);
        try {
          await deleteTeamMemberProfile(memberId);
          showAlert({
            title: 'تم إبعاد العضو',
            message: 'تم حذف الملف الشخصي وإبطال صلاحيات الدخول بنجاح.',
            type: 'success'
          });
        } catch (err: any) {
          showAlert({
            title: 'حدث خطأ',
            message: 'تعذر إبعاد العضو: ' + (err.message || err),
            type: 'error'
          });
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  const handleCancelInvite = async (inviteId: string) => {
    showConfirm({
      title: 'إلغاء وسحب الدعوة',
      message: 'هل أنت متأكد من رغبتك في سحب وإلغاء هذه الدعوة المعلقة؟',
      isDanger: true,
      confirmText: 'نعم، اسحب الدعوة',
      cancelText: 'تراجع',
      onConfirm: async () => {
        setActionLoadingId(inviteId);
        try {
          await cancelInvitation(inviteId);
          showAlert({
            title: 'تم سحب الدعوة',
            message: 'تم إلغاء الدعوة للمنضم الجديد بنجاح.',
            type: 'success'
          });
        } catch (err: any) {
          showAlert({
            title: 'حدث خطأ',
            message: 'تعذر سحب الدعوة: ' + (err.message || err),
            type: 'error'
          });
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  const translateRole = (role: string) => {
    switch(role) {
      case 'manager': return { name: 'المدير العام والمالك', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'assistant': return { name: 'مساعد المدير العام', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'accountant': return { name: 'المحاسب المالي', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'representative': return { name: 'المندوب العملي', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default: return { name: 'موظف', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 transition-colors" dir="rtl">
      
      {/* Dynamic Summary Panel */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <h3 className="text-sm font-black text-slate-900 transition-colors">هيكلية وأعضاء فريق العمل</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed transition-colors">
            تسمح الإدارة التعاونية بمشاركة كشف الحساب والعملاء الميدانيين بالوقت المزامَن الفوري مع تخصيص قفل الصلاحيات الأمنية.
          </p>
        </div>
        <div className="flex gap-4 font-bold text-center">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-indigo-700 transition-colors">
            <span className="text-xl block">{teamMembers.length}</span>
            <span className="text-[9px] block">مسجلون نشطون</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-amber-700 transition-colors">
            <span className="text-xl block">{pendingInvitations.length}</span>
            <span className="text-[9px] block">دعوات معلقة</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Send New Invitation */}
        <div className="bg-white border border-slate-150 rounded-2.5xl p-6 shadow-xs h-fit space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 transition-colors">
            <UserPlus className="w-5 h-5 text-indigo-600 transition-colors" />
            <h4 className="text-xs font-black text-slate-900 transition-colors">إضافة موظف/مندوب جديد للشركة</h4>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-xl leading-relaxed transition-colors">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-xl leading-relaxed transition-colors">
              {success}
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block transition-colors">بريد الموظف الإلكتروني المعتمر بالتطبيق</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@example.com"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-left font-semibold"
                />
                <Mail className="w-4 h-4 text-slate-450 absolute inset-y-0 right-3.5 my-auto transition-colors" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block transition-colors">تحديد المسمى الوظيفي والصلاحيات</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="assistant">مساعد المدير (كامل الصلاحيات عدا التصفية المباشرة)</option>
                <option value="accountant">محاسب مالي (معالجة ديون ودفعات العلاء، تجميد الحذف)</option>
                <option value="representative">مندوب ميداني (تسجيل الحساب والدفعات فورياً وبدون تعديل أو حذف)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <UserCheck className="w-4.5 h-4.5" />
              <span>إرسال دعوة إنضمام</span>
            </button>
          </form>

          {/* Permissions explanation box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2.5 text-[10px] text-slate-500 font-semibold leading-relaxed transition-colors">
            <div className="flex gap-2">
              <span className="text-rose-600 font-black">⚙️ المدير والمساعد:</span>
              <p>يتحكم بإنشاء وإدارة وتعديل وحذف كافة العملاء والحسابات والفريق بالكامل.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-emerald-700 font-black">💼 المحاسب المالي:</span>
              <p>يقوم بكل مهام المندوب بالإضافة إلى تعديل السندات المعتمدة، لكنه لا يستطيع حذف العميل من السجلات.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-700 font-black">🚚 المندوب الميداني:</span>
              <p>صلاحيات تعبئة وتحصيل فقط. يتمكن من الإضافة الفورية والطباعة من الميدان، لكن لا تتاح له ميزات الحذف والمسح حفاظاً على أمان السجلات وبدون تلاعب.</p>
            </div>
          </div>
        </div>

        {/* Panel 2: Team Members list (2 cols on large screen) */}
        <div className="bg-white border border-slate-150 rounded-2.5xl p-6 shadow-xs lg:col-span-2 space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 transition-colors">
            <Users className="w-5 h-5 text-slate-850 transition-colors" />
            <h4 className="text-xs font-black text-slate-900 transition-colors">أفراد فريق العمل النشطين حالياً</h4>
          </div>

          <div className="space-y-3">
            {teamMembers.map((m) => {
              const roleInfo = translateRole(m.role);
              const isCurrentUser = m.userId === profile?.userId;
              
              const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
              const isActive = m.lastActive && m.lastActive > fiveMinutesAgo;

              return (
                <div 
                  key={m.userId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-150 gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center font-black text-xs text-slate-600 shrink-0 uppercase border border-slate-300 transition-colors">
                        {m.delegateName?.slice(0, 2) || m.email?.slice(0, 2)}
                      </div>
                      {isActive && (
                        <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-50 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-850 transition-colors">{m.delegateName || 'بدون اسم'}</span>
                        {isActive && (
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-100 transition-colors flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                            متفاعل الآن
                          </span>
                        )}
                        {isCurrentUser && !isActive && (
                          <span className="text-[8px] bg-slate-200 text-slate-600 font-black px-1.5 py-0.5 rounded-md border border-slate-300 transition-colors">أنت الحالي</span>
                        )}
                        {isCurrentUser && isActive && (
                          <span className="text-[8px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md border border-indigo-100 transition-colors">أنت</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-450 block truncate max-w-[200px] mt-0.5 font-semibold text-left transition-colors">{m.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <span className={`text-[9px] font-black px-2.5 py-1 border rounded-lg transition-colors ${roleInfo.color}`}>
                      {roleInfo.name}
                    </span>
                    
                    {/* Manager/Assistant can remove members, but cannot remove itself */}
                    {!isCurrentUser && (profile?.role === 'manager' || (profile?.role === 'assistant' && m.role !== 'manager')) && (
                      <button
                        onClick={() => handleRemoveMember(m.userId, m.email)}
                        disabled={actionLoadingId === m.userId}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          actionLoadingId === m.userId
                            ? 'bg-slate-150 text-slate-400 cursor-not-allowed'
                            : 'bg-red-50 hover:bg-red-100 text-red-650'
                        }`}
                        title="إلغاء الموظف وإبطال حسابه"
                      >
                        {actionLoadingId === m.userId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        ) : (
                          <Trash2 className="w-4.5 h-4.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Invitations rendering */}
          {pendingInvitations.length > 0 && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-dashed border-slate-200 pb-2.5 transition-colors">
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                <h5 className="text-[11px] font-black text-slate-700 transition-colors">الدعوات والقبول المعلق بحواسب الفريق ({pendingInvitations.length})</h5>
              </div>

              <div className="space-y-2.5">
                {pendingInvitations.map((inv) => {
                  const roleInfo = translateRole(inv.role);
                  return (
                    <div 
                      key={inv.id}
                      className="flex items-center justify-between p-3 bg-amber-50/40 border border-amber-100 rounded-xl gap-4 transition-colors"
                    >
                      <div className="truncate shrink-1">
                        <span className="text-xs font-bold text-slate-800 text-left block font-mono truncate transition-colors">{inv.email}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 transition-colors">مرسلة بواسطة: {inv.invitedBy}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[8.5px] font-black px-2 py-0.5 border rounded-md transition-colors ${roleInfo.color}`}>
                          {roleInfo.name}
                        </span>
                        <button
                          onClick={() => handleCancelInvite(inv.id)}
                          disabled={actionLoadingId === inv.id}
                          className={`text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            actionLoadingId === inv.id
                              ? 'text-slate-400 cursor-not-allowed bg-transparent'
                              : 'text-slate-450 hover:text-red-600 underline'
                          }`}
                          title="إلغاء وسحب الدعوة"
                        >
                          {actionLoadingId === inv.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                              جاري السحب...
                            </>
                          ) : (
                            'إلغاء'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
