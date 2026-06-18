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
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Customer, Transaction, TransactionType, CustomerClassification } from './db';

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

export interface UserProfile {
  userId: string;
  email: string;
  businessName: string;
  businessType: 'solo' | 'company';
  role: 'manager' | 'assistant' | 'accountant' | 'representative';
  companyId: string;
  phone?: string;
  delegateName?: string;
  createdAt: string;
  businessEmoji?: string;
  businessDesc?: string;
  copyrightText?: string;
  lastActive?: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  companyId: string;
  businessName: string;
  role: 'manager' | 'assistant' | 'accountant' | 'representative';
  invitedBy: string;
  createdAt: string;
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  teamMembers: UserProfile[];
  pendingInvitations: TeamInvitation[];
  customers: Customer[];
  transactions: Transaction[];
  isSyncing: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  createBusinessProfile: (
    businessName: string, 
    businessType: 'solo' | 'company', 
    role: 'manager' | 'assistant' | 'accountant' | 'representative', 
    phone?: string, 
    delegateName?: string,
    businessEmoji?: string
  ) => Promise<void>;
  updateBusinessProfile: (updates: Partial<UserProfile>) => Promise<void>;
  inviteTeamMember: (email: string, role: 'manager' | 'assistant' | 'accountant' | 'representative') => Promise<void>;
  generateLinkInvitation: (role: 'manager' | 'assistant' | 'accountant' | 'representative') => Promise<string>;
  deleteTeamMemberProfile: (memberId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  addCustomerToFS: (name: string, phone: string, email?: string, notes?: string, region?: string) => Promise<void>;
  updateCustomerInFS: (id: string, name: string, phone: string, email?: string, notes?: string, region?: string) => Promise<void>;
  deleteCustomerFromFS: (id: string) => Promise<void>;
  addTransactionToFS: (customerId: string, type: TransactionType, amount: number, notes?: string, dueDate?: string) => Promise<void>;
  deleteTransactionFromFS: (txId: string) => Promise<void>;
  archiveTransactionsInFS: (ids: string[], isArchived?: boolean) => Promise<void>;
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
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // 0. Monitor Online Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 0. Extract URL Invite Code
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('inviteCode');
      if (inviteCode) {
        localStorage.setItem('pending_invite_code', inviteCode);
        // Clean URL cleanly
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      console.error('Failed to parse and store inviteCode:', e);
    }
  }, []);

  // 1. Observe Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setProfile(null);
        setProfileLoading(false);
        setTeamMembers([]);
        setPendingInvitations([]);
        setCustomers([]);
        setTransactions([]);
      }
    });

    // Update lastActive timestamp periodically
    const presenceInterval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          const profileRef = doc(db, 'profiles', auth.currentUser.uid);
          await updateDoc(profileRef, { lastActive: new Date().toISOString() });
        } catch (e) {
          // Ignore background update errors
        }
      }
    }, 120000); // Every 2 minutes

    return () => {
      unsubscribe();
      clearInterval(presenceInterval);
    };
  }, []);

  // 2. Fetch User Profile & Handle Invitations
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const profileRef = doc(db, 'profiles', user.uid);
    
    const unsubProfile = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          userId: user.uid,
          email: data.email || user.email || '',
          businessName: data.businessName || 'مجموعة كنعان الذكية',
          businessType: data.businessType || 'solo',
          role: data.role || 'manager',
          companyId: data.companyId || user.uid,
          phone: data.phone || '',
          delegateName: data.delegateName || '',
          createdAt: data.createdAt || new Date().toISOString(),
          businessEmoji: data.businessEmoji || '🌾',
          businessDesc: data.businessDesc || '',
          copyrightText: data.copyrightText || ''
        });
        setProfileLoading(false);
      } else {
        // Check if there is an active invitation
        const userEmail = user.email?.toLowerCase().trim();
        let inviteData: any = null;
        let inviteDocId: string | null = null;

        // Try code invitation first
        const storedInviteCode = localStorage.getItem('pending_invite_code');
        if (storedInviteCode) {
          try {
            const inviteDocSnap = await getDoc(doc(db, 'invitations', storedInviteCode));
            if (inviteDocSnap.exists()) {
              inviteData = inviteDocSnap.data();
              inviteDocId = inviteDocSnap.id;
            }
          } catch (e) {
            console.error('Error scanning code invitation on signup:', e);
          }
        }

        // If no code, try email invitation
        if (!inviteData && userEmail) {
          try {
            const inviteQuery = query(collection(db, 'invitations'), where('email', '==', userEmail));
            const inviteSnap = await getDocs(inviteQuery);
            if (!inviteSnap.empty) {
              const inviteDoc = inviteSnap.docs[0];
              inviteData = inviteDoc.data();
              inviteDocId = inviteDoc.id;
            }
          } catch (e) {
            console.error('Error scanning user invitations on signup:', e);
          }
        }

        // If we found an invitation (either code/link or email)
        if (inviteData && inviteDocId) {
          try {
            const newProfile: UserProfile = {
              userId: user.uid,
              email: userEmail || user.email || '',
              businessName: inviteData.businessName || 'مجموعة كنعان الذكية',
              businessType: 'company',
              role: inviteData.role || 'representative',
              companyId: inviteData.companyId,
              phone: '',
              delegateName: user.displayName || userEmail?.split('@')[0] || 'موظف جديد',
              createdAt: new Date().toISOString(),
              businessEmoji: inviteData.businessEmoji || '🌾',
              businessDesc: inviteData.businessDesc || '',
              copyrightText: inviteData.copyrightText || ''
            };
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'profiles', user.uid), newProfile);
            batch.delete(doc(db, 'invitations', inviteDocId));
            await batch.commit();
            
            if (storedInviteCode) {
              localStorage.removeItem('pending_invite_code');
            }
            
            setProfile(newProfile);
            setProfileLoading(false);
            return;
          } catch (e) {
            console.error('Error auto-accepting invitation:', e);
          }
        }

        setProfile(null);
        setProfileLoading(false);
      }
    }, (error) => {
      console.error('Profile stream error:', error);
      setProfileLoading(false);
    });

    return () => unsubProfile();
  }, [user]);

  // 3. Real-time Listeners for Company Data (Scoped by profile.companyId)
  useEffect(() => {
    if (!user || !profile) {
      setCustomers([]);
      setTransactions([]);
      setTeamMembers([]);
      setPendingInvitations([]);
      return;
    }

    const compId = profile.companyId;

    // A. Listen to Customers representing the Company
    const qCustomers = query(collection(db, 'customers'), where('companyId', '==', compId));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      setIsSyncing(true);
      const items: Customer[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          name: d.name || '',
          phone: d.phone || '',
          email: d.email || undefined,
          notes: d.notes || undefined,
          totalDebt: d.totalDebt || 0,
          region: d.region || 'غير محدد',
          createdAt: d.createdAt || new Date().toISOString(),
          classification: d.classification as CustomerClassification | undefined
        });
      });
      setCustomers(items);
      setTimeout(() => setIsSyncing(false), 800);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
      setIsSyncing(false);
    });

    // B. Listen to Transactions representing the Company
    const qTransactions = query(collection(db, 'transactions'), where('companyId', '==', compId));
    const unsubTransactions = onSnapshot(qTransactions, { includeMetadataChanges: true }, (snapshot) => {
      setIsSyncing(true);
      const items: Transaction[] = [];
      let pending = 0;
      
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (docSnap.metadata.hasPendingWrites) {
          pending++;
        }
        items.push({
          id: docSnap.id,
          customerId: d.customerId || '',
          type: d.type as TransactionType,
          amount: Number(d.amount || 0),
          date: d.date || '',
          dueDate: d.dueDate || undefined,
          notes: d.notes || undefined,
          isArchived: d.isArchived || false
        });
      });
      setTransactions(items);
      setPendingSyncCount(pending);
      setTimeout(() => setIsSyncing(false), 800);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
      setIsSyncing(false);
    });

    // C. Listen to Team Members of the same company
    const qTeam = query(collection(db, 'profiles'), where('companyId', '==', compId));
    const unsubTeam = onSnapshot(qTeam, (snapshot) => {
      const items: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          userId: docSnap.id,
          email: d.email || '',
          businessName: d.businessName || '',
          businessType: d.businessType || 'company',
          role: d.role || 'representative',
          companyId: d.companyId || compId,
          phone: d.phone || '',
          delegateName: d.delegateName || '',
          createdAt: d.createdAt || '',
          businessEmoji: d.businessEmoji || '🌾',
          businessDesc: d.businessDesc || '',
          copyrightText: d.copyrightText || '',
          lastActive: d.lastActive
        });
      });
      setTeamMembers(items);
    }, (error) => {
      console.warn('Unable to listen to team profiles, expected if role is restricted:', error);
    });

    // D. Listen to Pending Invitations from this company
    const qInvites = query(collection(db, 'invitations'), where('companyId', '==', compId));
    const unsubInvites = onSnapshot(qInvites, (snapshot) => {
      const items: TeamInvitation[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          email: d.email || '',
          companyId: d.companyId || compId,
          businessName: d.businessName || '',
          role: d.role || 'representative',
          invitedBy: d.invitedBy || '',
          createdAt: d.createdAt || ''
        });
      });
      setPendingInvitations(items);
    }, (error) => {
      console.warn('Unable to listen to invites:', error);
    });

    return () => {
      unsubCustomers();
      unsubTransactions();
      unsubTeam();
      unsubInvites();
    };
  }, [user, profile]);

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

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      console.error('Password Reset Error', e);
      throw e;
    }
  };

  const logOut = async () => {
    await fbSignOut(auth);
  };

  // Profile Writing operations
  const createBusinessProfile = async (
    businessName: string, 
    businessType: 'solo' | 'company', 
    role: 'manager' | 'assistant' | 'accountant' | 'representative', 
    phone?: string, 
    delegateName?: string,
    businessEmoji?: string,
    themeColor?: string
  ) => {
    if (!user) return;
    const path = 'profiles';
    const profileData: UserProfile = {
      userId: user.uid,
      email: user.email || '',
      businessName: businessName.trim() || 'مجموعة كنعان الذكية',
      businessType,
      role,
      companyId: user.uid, // Managers/Solos own their workspace id as their user id
      phone: phone?.trim() || '',
      delegateName: delegateName?.trim() || user.displayName || user.email?.split('@')[0] || '',
      createdAt: new Date().toISOString(),
      businessEmoji: businessEmoji || '🌾'
    };
    try {
      await setDoc(doc(db, path, user.uid), profileData);
      setProfile(profileData);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${path}/${user.uid}`);
    }
  };

  const updateBusinessProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const path = 'profiles';
    try {
      // Filter out undefined values to avoid Firestore errors
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, path, user.uid), sanitizedUpdates);
      setProfile({
        ...profile,
        ...updates
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${path}/${user.uid}`);
    }
  };

  const inviteTeamMember = async (email: string, role: 'manager' | 'assistant' | 'accountant' | 'representative') => {
    if (!user || !profile) return;
    const lowerEmail = email.toLowerCase().trim();
    const docId = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const path = 'invitations';
    try {
      await setDoc(doc(db, path, docId), {
        email: lowerEmail,
        companyId: profile.companyId,
        businessName: profile.businessName,
        role,
        invitedBy: user.email || '',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${path}/${docId}`);
    }
  };

  const generateLinkInvitation = async (role: 'manager' | 'assistant' | 'accountant' | 'representative'): Promise<string> => {
    if (!user || !profile) throw new Error('يجب تسجيل الدخول أولاً كمدير لتوليد رابط دعوة.');
    const code = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const path = 'invitations';
    try {
      await setDoc(doc(db, path, code), {
        email: '', // Empty email signifies it's an open invite link
        code,
        companyId: profile.companyId,
        businessName: profile.businessName,
        role,
        invitedBy: user.email || '',
        createdAt: new Date().toISOString()
      });
      return code;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${path}/${code}`);
      throw e;
    }
  };

  const deleteTeamMemberProfile = async (memberId: string) => {
    if (!user || !profile) return;
    // Prevent self-deletion of primary manager
    if (memberId === user.uid) {
      throw new Error('لا يمكن حذف حسابك كمدير أساسي للنظام.');
    }
    const path = 'profiles';
    try {
      await deleteDoc(doc(db, path, memberId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${memberId}`);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!user || !profile) return;
    const path = 'invitations';
    try {
      await deleteDoc(doc(db, path, invitationId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${invitationId}`);
    }
  };

  // Firestore Write Operations (Company-Scoped)
  const addCustomerToFS = async (name: string, phone: string, email?: string, notes?: string, region?: string, classification?: CustomerClassification) => {
    if (!user || !profile) return;
    const path = 'customers';
    const docId = 'cust-' + Date.now() + Math.random().toString(36).substr(2, 5);
    try {
      await setDoc(doc(db, path, docId), {
        id: docId,
        ownerId: user.uid, // backwards-compatibility
        companyId: profile.companyId,
        creatorId: user.uid,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || '',
        notes: notes?.trim() || '',
        region: region?.trim() || '',
        classification: classification || null,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `${path}/${docId}`);
    }
  };

  const updateCustomerInFS = async (id: string, name: string, phone: string, email?: string, notes?: string, region?: string, classification?: CustomerClassification) => {
    if (!user || !profile) return;
    const path = 'customers';
    try {
      await updateDoc(doc(db, path, id), {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || '',
        notes: notes?.trim() || '',
        region: region?.trim() || '',
        classification: classification || null
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`);
    }
  };

  const deleteCustomerFromFS = async (id: string) => {
    if (!user || !profile) return;
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
    if (!user || !profile) return;
    const path = 'transactions';
    const docId = 'tx-' + Date.now() + Math.random().toString(36).substr(2, 5);
    try {
      await setDoc(doc(db, path, docId), {
        id: docId,
        ownerId: user.uid, // backwards-compatibility
        companyId: profile.companyId,
        creatorId: user.uid,
        creatorEmail: user.email || '',
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
    if (!user || !profile) return;
    const path = 'transactions';
    try {
      await deleteDoc(doc(db, path, txId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${txId}`);
    }
  };

  const archiveTransactionsInFS = async (ids: string[], isArchived: boolean = true) => {
    if (!user || !profile) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'transactions', id), { isArchived });
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'archive_transactions');
    }
  };

  // Utilities: Seed Database or ImportBackup
  const importBackupToFS = async (backupCustomers: Customer[], backupTransactions: Transaction[]) => {
    if (!user || !profile) return;
    try {
      const batch = writeBatch(db);
      
      backupCustomers.forEach((c) => {
        const docRef = doc(db, 'customers', c.id);
        batch.set(docRef, {
          id: c.id,
          ownerId: user.uid,
          companyId: profile.companyId,
          creatorId: user.uid,
          name: c.name,
          phone: c.phone,
          email: c.email || '',
          notes: c.notes || '',
          region: c.region || '',
          classification: c.classification || null,
          createdAt: c.createdAt || new Date().toISOString()
        });
      });

      backupTransactions.forEach((t) => {
        const docRef = doc(db, 'transactions', t.id);
        batch.set(docRef, {
          id: t.id,
          ownerId: user.uid,
          companyId: profile.companyId,
          creatorId: user.uid,
          creatorEmail: user.email || '',
          customerId: t.customerId,
          type: t.type,
          amount: t.amount,
          date: t.date,
          dueDate: t.dueDate || '',
          notes: t.notes || '',
          isArchived: t.isArchived || false
        });
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'backup_import');
    }
  };

  const wipeAllInFS = async () => {
    if (!user || !profile) return;
    try {
      const customersToDelete = [...customers];
      const transactionsToDelete = [...transactions];
      
      const allDeletes = [
        ...customersToDelete.map(c => ({ path: 'customers', id: c.id })),
        ...transactionsToDelete.map(t => ({ path: 'transactions', id: t.id }))
      ];

      for (let i = 0; i < allDeletes.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = allDeletes.slice(i, i + 500);
        chunk.forEach(item => {
          batch.delete(doc(db, item.path, item.id));
        });
        await batch.commit();
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'wipe_all');
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      loading,
      profile,
      profileLoading,
      teamMembers,
      pendingInvitations,
      customers,
      transactions,
      isSyncing,
      isOnline,
      pendingSyncCount,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logOut,
      createBusinessProfile,
      updateBusinessProfile,
      inviteTeamMember,
      generateLinkInvitation,
      deleteTeamMemberProfile,
      cancelInvitation,
      addCustomerToFS,
      updateCustomerInFS,
      deleteCustomerFromFS,
      addTransactionToFS,
      deleteTransactionFromFS,
      archiveTransactionsInFS,
      importBackupToFS,
      wipeAllInFS
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}
