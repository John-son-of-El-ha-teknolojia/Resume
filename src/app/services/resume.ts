import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { auth, db } from '../firebase.config';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  getDocs, 
  query, 
  where,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ResumeSection {
  id: string;
  title: string;
  content: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  sections: ResumeSection[];
}

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private http = inject(HttpClient);

  // State
  resumeState = signal<ResumeData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    sections: [
      { id: '1', title: 'Work Experience', content: '' },
      { id: '2', title: 'Education', content: '' },
      { id: '3', title: 'Skills', content: '' }
    ]
  });

  isPaid = signal<boolean>(false);
  hasFreeDownloadLeft = signal<boolean>(true);
  isPremium = signal<boolean>(false);
  isLoggedIn = signal<boolean>(false);
  isAdmin = signal<boolean>(false);
  userEmail = signal<string | null>(null);
  
  currentTemplate = signal<'minimal' | 'modern' | 'classic'>('minimal');

  constructor() {
    this.initAuth();
  }

  private initAuth() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.isLoggedIn.set(true);
        this.userEmail.set(user.email);
        this.resumeState.update(prev => ({ ...prev, email: user.email || '' }));
        await this.syncUserRecord(user);
        await this.checkStatus(user.uid);
      } else {
        this.isLoggedIn.set(false);
        this.isAdmin.set(false);
        this.userEmail.set(null);
      }
    });

    // CRITICAL: Call getFromServer to test connection
    this.testConnection();
  }

  private async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }

  private async syncUserRecord(user: FirebaseUser) {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          role: user.email === 'curtisombai@gmail.com' ? 'admin' : 'user',
          lastActive: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, { lastActive: serverTimestamp() });
      }
      
      const updatedSnap = await getDoc(userRef);
      const userData = updatedSnap.data();
      if (userData) {
        this.isAdmin.set(userData['role'] === 'admin');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  }

  private async checkStatus(userId: string) {
    const subRef = doc(db, 'subscriptions', userId);
    try {
      const snap = await getDoc(subRef);
      if (snap.exists()) {
        const data = snap.data();
        const expires = data['expires'] as Timestamp;
        if (expires.toMillis() > Date.now()) {
          this.isPremium.set(true);
          this.isPaid.set(true);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `subscriptions/${userId}`);
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      return true;
    } catch (error) {
      console.error('Google Login error:', error);
      return false;
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getAdminStats(): Promise<{ totalUsers: number; activeUsers: number; totalRevenue: number; tierCounts: Record<string, number> }> {
    if (!this.isAdmin()) throw new Error('Unauthorized');
    
    try {
      const userList = await getDocs(collection(db, 'users'));
      const activeThreshold = Date.now() - (15 * 60 * 1000);
      let activeCount = 0;
      
      userList.forEach(doc => {
        const data = doc.data();
        const lastActive = (data['lastActive'] as Timestamp).toMillis();
        if (lastActive > activeThreshold) activeCount++;
      });

      const subList = await getDocs(collection(db, 'subscriptions'));
      let rev = 0;
      const counts: Record<string, number> = { '3days': 0, '1month': 0, '1year': 0 };
      
      subList.forEach(doc => {
        const data = doc.data();
        rev += data['amount'] || 0;
        if (counts[data['tier']] !== undefined) {
          counts[data['tier']]++;
        }
      });

      return {
        totalUsers: userList.size,
        activeUsers: activeCount,
        totalRevenue: rev,
        tierCounts: counts
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'admin_stats');
      throw error;
    }
  }

  updateResume(data: Partial<ResumeData>) {
    this.resumeState.update(prev => ({ ...prev, ...data }));
  }

  addSection() {
    const newSection: ResumeSection = {
      id: Math.random().toString(36).substring(7),
      title: 'New Section',
      content: ''
    };
    this.resumeState.update(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  }

  removeSection(id: string) {
    this.resumeState.update(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
  }

  updateSection(id: string, content: string) {
    this.resumeState.update(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, content } : s)
    }));
  }

  async extractResume(fileName: string) {
    try {
      const response = await firstValueFrom(
        this.http.post<ResumeData>('/api/resume/extract', { fileName })
      );
      this.resumeState.set(response);
      return response;
    } catch (error) {
      console.error('Extract error:', error);
      throw error;
    }
  }

  async checkEligibility() {
    const email = this.resumeState().email;
    if (!email) return { canDownload: true }; 
    
    try {
      const res = await firstValueFrom(
        this.http.post<{ canDownload: boolean; isPremium: boolean; hasFreeDownloadLeft: boolean }>(
          '/api/resume/check-eligibility', { email }
        )
      );
      this.isPremium.set(res.isPremium);
      this.hasFreeDownloadLeft.set(res.hasFreeDownloadLeft);
      this.isPaid.set(res.isPremium);
      return res;
    } catch (error) {
      console.error('Eligibility check failed:', error);
      return { canDownload: false };
    }
  }

  async enhanceText(text: string): Promise<string> {
    if (!text.trim()) return text;
    try {
      const response = await firstValueFrom(
        this.http.post<{ improvedText: string }>('/api/ai/enhance', { sectionText: text })
      );
      return response.improvedText;
    } catch (error) {
      console.error('Enhance error:', error);
      return text;
    }
  }

  async initiatePayment(phone: string, tier: string, amount: number) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; transactionId: string }>('/api/payment/initiate', { 
          amount, 
          phone, 
          email: user.email,
          tier 
        })
      );
      
      if (response.success) {
        let duration = 0;
        if (tier === '3days') duration = 3 * 24 * 60 * 60 * 1000;
        else if (tier === '1month') duration = 30 * 24 * 60 * 60 * 1000;
        else if (tier === '1year') duration = 365 * 24 * 60 * 60 * 1000;

        await setDoc(doc(db, 'subscriptions', user.uid), {
          tier,
          expires: Timestamp.fromMillis(Date.now() + duration),
          amount,
          createdAt: serverTimestamp()
        });

        this.isPaid.set(true);
        this.isPremium.set(true);
      }
      return response;
    } catch (error) {
      console.error('Payment error:', error);
      handleFirestoreError(error, OperationType.WRITE, `subscriptions/${user.uid}`);
      throw error;
    }
  }

  downloadPdf() {
    const email = this.resumeState().email;
    window.open(`/api/resume/pdf?email=${encodeURIComponent(email)}`, '_blank');
    // Refresh eligibility after download
    setTimeout(() => this.checkEligibility(), 2000);
  }
}
