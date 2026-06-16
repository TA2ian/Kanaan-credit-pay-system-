/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, XCircle, Info, HelpCircle } from 'lucide-react';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  onClose?: () => void;
}

interface ConfirmOptions {
  title: string;
  message: string;
  isDanger?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface PopupContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
}

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertOptions | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const showAlert = (options: AlertOptions) => {
    setAlertState(options);
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmState(options);
  };

  const handleAlertClose = () => {
    if (alertState) {
      if (alertState.onClose) alertState.onClose();
      setAlertState(null);
    }
  };

  const handleConfirmCancel = () => {
    if (confirmState) {
      if (confirmState.onCancel) confirmState.onCancel();
      setConfirmState(null);
    }
  };

  const handleConfirmOk = () => {
    if (confirmState) {
      confirmState.onConfirm();
      setConfirmState(null);
    }
  };

  // Helper selectors daily theme config based on alert type
  const getAlertConfig = (type: string = 'info') => {
    switch (type) {
      case 'success':
        return {
          headerBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          statusBar: 'from-emerald-500 via-emerald-400 to-emerald-600',
          subtext: 'عملية ناجحة ومكتملة',
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-150',
          icon: CheckCircle
        };
      case 'warning':
        return {
          headerBg: 'bg-amber-50 border-amber-100 text-amber-600',
          statusBar: 'from-amber-500 via-amber-400 to-amber-600',
          subtext: 'تنبيه - يرجى الانتباه للملاحظة',
          btnClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-150',
          icon: AlertCircle
        };
      case 'error':
        return {
          headerBg: 'bg-rose-50 border-rose-100 text-rose-600',
          statusBar: 'from-rose-500 via-rose-400 to-rose-600',
          subtext: 'خطأ - لم تكتمل العملية',
          btnClass: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-150',
          icon: XCircle
        };
      case 'info':
      default:
        return {
          headerBg: 'bg-blue-50 border-blue-100 text-blue-600',
          statusBar: 'from-blue-500 via-blue-400 to-blue-600',
          subtext: 'توضيح مالي أو إرشادي',
          btnClass: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-150',
          icon: Info
        };
    }
  };

  const activeAlert = alertState ? getAlertConfig(alertState.type) : null;
  const AlertIcon = activeAlert ? activeAlert.icon : Info;

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* RENDER CUSTOM ALERT MODAL */}
      <AnimatePresence>
        {alertState && activeAlert && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleAlertClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            {/* Alert Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-right border border-slate-100 z-10 relative overflow-hidden"
              dir="rtl"
            >
              {/* Top accent line */}
              <div className={`absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l ${activeAlert.statusBar}`} />

              {/* Icon & title summary */}
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${activeAlert.headerBg}`}>
                  <AlertIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">
                    {alertState.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    {activeAlert.subtext}
                  </p>
                </div>
              </div>

              {/* Msg Content */}
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center whitespace-pre-line">
                {alertState.message}
              </p>

              {/* Action Button */}
              <button
                onClick={handleAlertClose}
                className={`w-full py-2 px-4 text-white font-bold rounded-xl text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center ${activeAlert.btnClass}`}
              >
                موافق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER CUSTOM CONFIRM MODAL */}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleConfirmCancel}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            {/* Confirm Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-right border border-slate-100 z-10 relative overflow-hidden"
              dir="rtl"
            >
              {/* Top accent line */}
              <div className={`absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l ${
                confirmState.isDanger 
                  ? 'from-rose-500 via-amber-500 to-rose-600' 
                  : 'from-indigo-500 via-indigo-400 to-indigo-600'
              }`} />

              {/* Icon & title summary */}
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                  confirmState.isDanger 
                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}>
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">
                    {confirmState.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    إجراء يتطلب تأكيد المتابعة
                  </p>
                </div>
              </div>

              {/* Msg Content */}
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center whitespace-pre-line">
                {confirmState.message}
              </p>

              {/* Footer actions */}
              <div className="flex gap-2.5">
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                >
                  {confirmState.cancelText || 'إلغاء'}
                </button>
                <button
                  onClick={handleConfirmOk}
                  className={`flex-1 py-2 text-white font-bold rounded-xl text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center ${
                    confirmState.isDanger
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {confirmState.confirmText || 'تأكيد'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PopupContext.Provider>
  );
}
