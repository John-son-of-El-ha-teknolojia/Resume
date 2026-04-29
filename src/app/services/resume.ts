import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Referee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  content: string;
}

export interface ResumeSection {
  id: string;
  title: string;
  content: string;
}

export interface ResumeElement {
  id: string;
  type: 'image' | 'line' | 'box' | 'text';
  content?: string;
  url?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  isLocked?: boolean;
  isVisible?: boolean;
  mirror?: { horizontal: boolean; vertical: boolean };
  unit?: 'px' | 'cm' | 'mm';
  style?: Record<string, string | number>;
}

export interface Aesthetics {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  fontSize: number;
  elements: ResumeElement[];
}

export interface Skill {
  name: string;
  level: number; // 0-100
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  location: string;
  summary: string;
  sections: ResumeSection[];
  experience: Experience[];
  education: string[];
  referees: Referee[];
  skills: Skill[];
  hobbies: string[];
  website?: string;
  aesthetics: Aesthetics;
  metadataStyle?: {
    border?: string;
    padding?: number;
    width?: number;
    x?: number;
    y?: number;
    isLocked?: boolean;
    isVisible?: boolean;
  };
  experienceStyle?: {
    x?: number;
    y?: number;
    isLocked?: boolean;
    isVisible?: boolean;
  };
  skillUrl?: string;
}

export interface CoverLetterData {
  jobDescription: string;
  institutionName: string;
  positionTitle: string;
  requirements: string;
  generatedLetter: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private http = inject(HttpClient);
  
  // History management
  private history: string[] = [];
  private redoStack: string[] = [];
  private maxHistory = 50;

  // State
  resumeState = signal<ResumeData>({
    name: '',
    email: '',
    phone: '',
    phoneCountryCode: '+1',
    location: '',
    summary: '',
    sections: [],
    experience: [],
    education: [],
    referees: [],
    skills: [],
    hobbies: [],
    website: '',
    metadataStyle: {
      border: 'none',
      padding: 0,
      x: 0,
      y: 0,
      isLocked: true,
      isVisible: true
    },
    experienceStyle: {
      x: 0,
      y: 0,
      isLocked: true,
      isVisible: true
    },
    skillUrl: '',
    aesthetics: {
      fontFamily: 'Inter',
      primaryColor: '#09090b',
      backgroundColor: '#ffffff',
      fontSize: 14,
      elements: []
    }
  });

  commit() {
    const currentState = JSON.stringify(this.resumeState());
    if (this.history.length > 0 && this.history[this.history.length - 1] === currentState) {
      return;
    }
    this.history.push(currentState);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.redoStack = [];
    console.log('State committed to history');
  }

  undo() {
    if (this.history.length < 2) return;
    const current = this.history.pop()!;
    this.redoStack.push(current);
    const previous = this.history[this.history.length - 1];
    this.resumeState.set(JSON.parse(previous));
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop()!;
    this.history.push(next);
    this.resumeState.set(JSON.parse(next));
  }

  coverLetterState = signal<CoverLetterData>({
    jobDescription: '',
    institutionName: '',
    positionTitle: '',
    requirements: '',
    generatedLetter: ''
  });

  plans = [
    { id: '2w', name: '2 Weeks Access', price: 1.59, duration: '2 weeks' },
    { id: '1m', name: 'Monthly Pro', price: 2.99, duration: '1 month' },
    { id: '1y', name: 'Annual Studio', price: 7.59, duration: '1 year' }
  ];

  isPaid = signal<boolean>(false);
  hasFreeDownloadLeft = signal<boolean>(true);
  isPremium = signal<boolean>(false);
  isLoggedIn = signal<boolean>(false);
  isAdmin = signal<boolean>(false);
  userEmail = signal<string | null>(null);
  
  currentTemplate = signal<'minimal' | 'modern' | 'classic'>('minimal');

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; email: string; isAdmin: boolean }>('/api/auth/login', { email, password })
      );
      if (response.success) {
        this.isLoggedIn.set(true);
        this.isAdmin.set(response.isAdmin);
        this.userEmail.set(response.email);
        this.resumeState.update(prev => ({ ...prev, email: response.email }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      // Fallback for mock/demo
      this.isLoggedIn.set(true);
      this.userEmail.set(email);
      return true;
    }
  }

  async signup(data: Record<string, string | null>): Promise<boolean> {
    try {
      // In a real app, this would call your Go backend
      // await firstValueFrom(this.http.post('/api/auth/signup', data));
      
      this.isLoggedIn.set(true);
      this.userEmail.set(data['email'] ?? null);
      this.resumeState.update(prev => ({ 
        ...prev, 
        name: data['name'] ?? '',
        email: data['email'] ?? '',
        location: data['location'] ?? ''
      }));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  }

  logout() {
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
    this.userEmail.set(null);
  }

  async getAdminStats() {
    return firstValueFrom(
      this.http.get<{ totalUsers: number; activeUsers: number; totalRevenue: number; tierCounts: Record<string, number> }>('/api/admin/stats')
    );
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
    const email = this.resumeState().email;
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; transactionId: string }>('/api/payment/initiate', { 
          amount, 
          phone, 
          email,
          tier 
        })
      );
      if (response.success) {
        this.isPaid.set(true);
        this.isPremium.set(true);
      }
      return response;
    } catch (error) {
      console.error('Payment error:', error);
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
