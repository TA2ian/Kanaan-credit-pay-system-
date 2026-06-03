import React from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative" dir="rtl">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg text-slate-800">{title}</h2>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>
            {children}
        </div>
    </div>
  );
}
