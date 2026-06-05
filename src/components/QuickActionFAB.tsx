import React, { useState } from 'react';
import { Plus, Minus, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickActionFABProps {
  onAddDebt: () => void;
  onAddPayment: () => void;
}

export function QuickActionFAB({ onAddDebt, onAddPayment }: QuickActionFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -50 }}
              exit={{ opacity: 0, scale: 0.8, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              style={{ willChange: "transform, opacity" }}
              onClick={() => { onAddDebt(); setIsOpen(false); }}
              className="absolute right-0 flex items-center gap-2 bg-rose-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-rose-700 transition-colors duration-150"
              title="سحب بضاعة جديد"
            >
              <Minus className="w-4 h-4" />
              <span className="text-[10px] font-bold whitespace-nowrap">سحب بضاعة</span>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -95 }}
              exit={{ opacity: 0, scale: 0.8, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              style={{ willChange: "transform, opacity" }}
              onClick={() => { onAddPayment(); setIsOpen(false); }}
              className="absolute right-0 flex items-center gap-2 bg-emerald-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-emerald-700 transition-colors duration-150"
              title="تسديد دفعة جديد"
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-[10px] font-bold whitespace-nowrap">تسديد دفعة</span>
            </motion.button>
          </>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 text-white p-3.5 rounded-full shadow-xl cursor-pointer hover:bg-indigo-700 active:scale-95 transition-colors duration-150"
      >
        <motion.div 
          animate={{ rotate: isOpen ? 45 : 0 }} 
          transition={{ duration: 0.15 }}
          style={{ willChange: "transform" }}
        >
          <Plus className="w-5 h-5" />
        </motion.div>
      </button>
    </div>
  );
}
