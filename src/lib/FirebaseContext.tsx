/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Customer, Transaction, TransactionType } from './db';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  customers: Customer[];
  transactions: Transaction[];
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
  addCustomerToFS: (name: string, phone: string, email?: string, notes?: string, region?: string) => Promise<void>;
  updateCustomerInFS: (id: string, name: string, phone: string, email?: string, notes?: string, region?: string) => Promise<void>;
  deleteCustomerFromFS: (id: string) => Promise<void>;
  addTransactionToFS: (customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string) => Promise<void>;
  deleteTransactionFromFS: (txId: string) => Promise<void>;
  importBackupToFS: (backupCustomers: Customer[], backupTransactions: Transaction[]) => Promise<void>;
  wipeAllInFS: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 1. Observe Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setCustomers([]);
        setTransactions([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Synchronizers (Synced based on Auth UID)
  useEffect(() => {
    if (!user) return;

    // A. Listen to Customers
    const qCustomers = query(collection(db, 'customers'), where('ownerId', '==', user.uid));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const items: Customer[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          name: d.name || '',
          phone: d.phone || '',
          email: d.email || undefined,
          notes: d.notes || undefined,
          region: d.region || undefined,
          createdAt: d.createdAt || new Date().toISOString()
        });
      });
      setCustomers(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
    });

    // B. Listen to Transactions
    const qTransactions = query(collection(db, 'transactions'), where('ownerId', '==', user.uid));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          customerId: d.customerId || '',
          type: d.type as TransactionType,
          amount: Number(d.amount || 0),
          date: d.date || '',
          dueDate: d.dueDate || undefined,
          notes: d.notes || undefined
        });
      });
      setTransactions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    return () => {
      unsubCustomers();
      unsubTransactions();
    };
  }, [user]);

  // Auth Operations
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Google Sign In Error', e);
      throw e;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      console.error('Email Sign In Error', e);
      throw e;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      console.error('Email Sign Up Error', e);
      throw e;
    }
  };

  const logOut = async () => {
    await fbSignOut(auth);
  };

  // Firestore Write Operations (Owner-Scoped)
  const addCustomerToFS = async (name: string, phone: string, email?: string, notes?: string, region?: string) => {
    if (!user) return;
    const path = 'customers';
    const docId = 'cust-' + Date.now() + Math.random().toString(36).substr(2, 5);
    try {
      await setDoc(doc(db, path, docId), {
        id: docId,
        ownerId: user.uid,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || '',
        notes: notes?.trim() || '',
        region: region?.trim() || '',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${path}/${docId}`);
    }
  };

  const updateCustomerInFS = async (id: string, name: string, phone: string, email?: string, notes?: string, region?: string) => {
    if (!user) return;
    const path = 'customers';
    try {
      await updateDoc(doc(db, path, id), {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || '',
        notes: notes?.trim() || '',
        region: region?.trim() || ''
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`);
    }
  };

  const deleteCustomerFromFS = async (id: string) => {
    if (!user) return;
    const path = 'customers';
    try {
      // 1. Delete Customer document
      await deleteDoc(doc(db, path, id));
      
      // 2. Clear customer's transactions
      const batch = writeBatch(db);
      const custTxs = transactions.filter(t => t.customerId === id);
      custTxs.forEach((t) => {
        batch.delete(doc(db, 'transactions', t.id));
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`);
    }
  };

  const addTransactionToFS = async (customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string) => {
    if (!user) return;
    const path = 'transactions';
    const docId = 'tx-' + Date.now() + Math.random().toString(36).substr(2, 5);
    try {
      await setDoc(doc(db, path, docId), {
        id: docId,
        ownerId: user.uid,
        customerId,
        type,
        amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: type === 'debt' ? (dueDate || '') : '',
        notes: notes?.trim() || ''
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${path}/${docId}`);
    }
  };

  const deleteTransactionFromFS = async (txId: string) => {
    if (!user) return;
    const path = 'transactions';
    try {
      await deleteDoc(doc(db, path, txId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${txId}`);
    }
  };

  // Utilities: Seed Database or ImportBackup
  const importBackupToFS = async (backupCustomers: Customer[], backupTransactions: Transaction[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Load and scope all backup characters with current UID
      backupCustomers.forEach((c) => {
        const docRef = doc(db, 'customers', c.id);
        batch.set(docRef, {
          id: c.id,
          ownerId: user.uid,
          name: c.name,
          phone: c.phone,
          email: c.email || '',
          notes: c.notes || '',
          region: c.region || '',
          createdAt: c.createdAt || new Date().toISOString()
        });
      });

      backupTransactions.forEach((t) => {
        const docRef = doc(db, 'transactions', t.id);
        batch.set(docRef, {
          id: t.id,
          ownerId: user.uid,
          customerId: t.customerId,
          type: t.type,
          amount: t.amount,
          date: t.date,
          dueDate: t.dueDate || '',
          notes: t.notes || ''
        });
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'backup_import');
    }
  };

  const wipeAllInFS = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      customers.forEach((c) => {
        batch.delete(doc(db, 'customers', c.id));
      });
      transactions.forEach((t) => {
        batch.delete(doc(db, 'transactions', t.id));
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'wipe_all');
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      loading,
      customers,
      transactions,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logOut,
      addCustomerToFS,
      updateCustomerInFS,
      deleteCustomerFromFS,
      addTransactionToFS,
      deleteTransactionFromFS,
      importBackupToFS,
      wipeAllInFS
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}
