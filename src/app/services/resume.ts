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
  style?: {
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderStyle?: string;
    borderColor?: string;
    fontSize?: number;
    color?: string;
    fontWeight?: string | number;
    textAlign?: string;
    opacity?: number;
    lineType?: 'solid' | 'dashed' | 'dotted';
    thickness?: number;
    [key: string]: any;
  };
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
  displayMode?: 'text' | 'vertical_bar' | 'horizontal_bar';
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
  pageCount?: number;
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
  private readonly API_BASE = 'http://localhost:8080';

  // Supported models to be handled by the backend
  public readonly SUPPORTED_MODELS = [
    { id: 'python-ai-pro', name: 'Python AI Pro (High Precision)' },
    { id: 'python-ai-base', name: 'Python AI Base (Fast)' },
    { id: 'python-ai-custom', name: 'Python Custom AI' }
  ];

  private selectedModelId = 'python-ai-pro';

  setModel(modelId: string) {
    this.selectedModelId = modelId;
  }

  getSelectedModel() {
    return this.selectedModelId;
  }
  
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
    pageCount: 1,
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
      this.http.post<{ success: boolean; email: string; isAdmin: boolean }>(
        '/api/auth/login',
        { email, password }
      )
    );

    if (response.success) {
      this.isLoggedIn.set(true);
      this.isAdmin.set(response.isAdmin);
      this.userEmail.set(response.email);
      this.resumeState.update(prev => ({ ...prev, email: response.email }));
      return true;
    }

    return false; // backend responded but success=false
  } catch (error: any) {
    console.error('Login error:', error);
    this.isLoggedIn.set(false); // ensure not logged in
    return false; // signal failure to caller
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

  addPage() {
    this.resumeState.update(prev => ({
      ...prev,
      pageCount: (prev.pageCount || 1) + 1
    }));
    this.commit();
  }

  removePage() {
    this.resumeState.update(prev => ({
      ...prev,
      pageCount: Math.max(1, (prev.pageCount || 1) - 1)
    }));
    this.commit();
  }

  async extractResume(fileName: string) {
    try {
      const response = await firstValueFrom(
        this.http.post<ResumeData>(`${this.API_BASE}/api/resume/extract`, { fileName })
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
          `${this.API_BASE}/api/resume/check-eligibility`, { email }
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
        this.http.post<{ improvedText: string }>(`${this.API_BASE}/api/ai/enhance`, { 
          sectionText: text,
          model: this.selectedModelId
        })
      );
      return response.improvedText;
    } catch (error) {
      console.error('Enhance error:', error);
      return text;
    }
  }

  async sendOtp(email: string): Promise<void> {
  await firstValueFrom(
    this.http.post<{ message: string }>(`${this.API_BASE}/api/auth/send-otp`, { email })
  );
}

async verifyOtp(email: string, code: string): Promise<{ success: boolean }> {
  return firstValueFrom(
    this.http.post<{ success: boolean }>(`${this.API_BASE}/api/auth/verify-otp`, { email, code })
  );
}



  async initiatePayment(phone: string, tier: string, amount: number) {
    const email = this.resumeState().email;
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; transactionId: string }>(`${this.API_BASE}/api/payment/initiate`, { 
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
    window.open(`${this.API_BASE}/api/resume/pdf?email=${encodeURIComponent(email)}`, '_blank');
    // Refresh eligibility after download
    setTimeout(() => this.checkEligibility(), 2000);
  }

  async runCoachAnalysis(resumeData: unknown) {
    return firstValueFrom(
      this.http.post<{ atsScore: number; suggestions: string[] }>(`${this.API_BASE}/api/ai/coach`, { 
        resumeData,
        model: this.selectedModelId
      })
    );
  }

  async polishSummary(summary: string) {
    return firstValueFrom(
      this.http.post<{ result: string }>(`${this.API_BASE}/api/ai/polish-summary`, { 
        summary,
        model: this.selectedModelId
      })
    );
  }

  async suggestExperienceDescription(title: string, company: string, currentContent: string) {
    return firstValueFrom(
      this.http.post<{ result: string }>(`${this.API_BASE}/api/ai/suggest-experience`, { 
        title, 
        company, 
        currentContent,
        model: this.selectedModelId
      })
    );
  }

  async mapToJob(resumeData: unknown, jobUrl: string) {
    return firstValueFrom(
      this.http.post<any>(`${this.API_BASE}/api/ai/map-job`, { 
        resumeData, 
        jobUrl,
        model: this.selectedModelId
      })
    );
  }

  async generateCoverLetterDetailed(resumeData: unknown, institutionName: string, positionTitle: string, jobDescription: string) {
    return firstValueFrom(
      this.http.post<{ result: string }>(`${this.API_BASE}/api/ai/generate-cover-letter-detailed`, { 
        resumeData, 
        institutionName, 
        positionTitle, 
        jobDescription,
        model: this.selectedModelId
      })
    );
  }
}
