import { Injectable, signal, inject, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import {  timeout } from 'rxjs';

export interface Referee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: any;
  nameStyle?: any;
  emailStyle?: any;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  content: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: any;              // shared style
  companyStyle?: any;       // per-field style
  titleStyle?: any;
  contentStyle?: any;
  startDateStyle?: any;
  endDateStyle?: any;
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
  widthUnit?: string;
  heightUnit?: string;
  zIndex?: number;
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
    [key: string]: string | number | boolean | undefined;
  };
}

export interface Aesthetics {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  fontSize: number;
  elements: ResumeElement[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: any;
  schoolStyle?: any;
  degreeStyle?: any;
  startDateStyle?: any;
  endDateStyle?: any;
}

export interface Hobby {
  id: string;
  name: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  displayMode?: 'text' | 'vertical_bar' | 'horizontal_bar';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: {
    fontSize?: number;
    color?: string;
    textAlign?: string;
  };
}

export interface BlockStyle {
  x: number;
  y: number;
  width: number;
  height?: number;
  rotation?: number;
  isLocked?: boolean;
  isVisible?: boolean;
  border?: string;
  padding?: number;
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    opacity?: number;
  };
}

export interface Board {
  id: string;
  name: string;
  role: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: {
    fontSize?: number;
    color?: string;
    textAlign?: string;
  };
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
  education: Education[];
  referees: Referee[];
  skills: Skill[];
  hobbies: Hobby[];
  boards?: Board[];   // ✅ new array for CEO template
  website?: string;
  qrCode?: string;
  aesthetics: Aesthetics;
  metadataStyle: BlockStyle;
  experienceStyle: BlockStyle;
  educationStyle: BlockStyle;
  skillsStyle: BlockStyle;
  refereeStyle: BlockStyle;
  qrStyle: BlockStyle;
  nameStyle: BlockStyle;
  emailStyle?: BlockStyle;
  phoneStyle?: BlockStyle;
  summaryStyle?: BlockStyle;
  skillUrl?: string;
  pageCount?: number;
   role?: string;
  tier?: string;
  freeDownloadsUsed?: number;
  isAdmin?: boolean;
  otpCode?: string;
  otpExpiry?: number;
  templateId?: 'minimal' | 'modern' | 'classic' | 'ceo';
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
  private readonly API_BASE = 'https://resume-backend-plmv.onrender.com'; // Change to actual backend URL in production

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

getCurrentTier(): string {
  return localStorage.getItem('tier') || this.resumeState().tier || 'free';
}

isUserLoggedIn(): boolean {
  return localStorage.getItem('isLoggedIn') === 'true' || this.isLoggedIn();
}


  // Selection state
  public selectedIds = signal<Set<string>>(new Set());

  toggleSelection(id: string, multi = false) {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      if (!multi) current.clear();
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  // History management
  private history: string[] = [];
  private redoStack: string[] = [];
  private maxHistory = 50;
  private initialState: string | null = null;

  constructor(
  @Inject(PLATFORM_ID) private platformId: Object
) {
  // Initialize history with current state
  const state = JSON.stringify(this.resumeState());
  this.history.push(state);
  this.initialState = state;

  // Always default to logged out on SSR
  this.isLoggedIn.set(false);
}



async initializeSession() {
  console.time('initializeSession');
  if (isPlatformBrowser(this.platformId)) {
    console.log('[Session] Checking query params...');
    const params = new URLSearchParams(window.location.search);
    console.log('[Session] Params:', Object.fromEntries(params.entries()));
  }

  const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('jwt') : null;
  console.log('[Session] Token found:', token);

  if (!token) {
    console.warn('[Session] No token, logging out');
    this.logout();
    console.timeEnd('initializeSession');
    return;
  }

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const tier = params.get('tier');

    if (token) {
      localStorage.setItem('jwt', token);
      if (email) localStorage.setItem('userEmail', email);
      if (tier) localStorage.setItem('tier', tier);

      // Clean up query string
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  try {
    const email = isPlatformBrowser(this.platformId) ? localStorage.getItem('userEmail') : null;
    console.log('[Session] Email found:', email);

    if (email) {
      console.time('loadUser');
      await this.loadUser(email);
      console.timeEnd('loadUser');
      this.isLoggedIn.set(true);
    } else {
      console.warn('[Session] No email, logging out');
      this.logout();
    }
  } catch (err) {
    console.error('[Session] Error loading user:', err);
    this.logout();
  }
  console.timeEnd('initializeSession');
}


  resetToInitial() {
    if (this.initialState) {
      this.resumeState.set(JSON.parse(this.initialState));
      this.commit();
    }
  }

  canUndo() {
    return this.history.length > 1;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }


  resumeState = signal<ResumeData>({
  name: '',
  email: '',
  phone: '',
  phoneCountryCode: '+1',
  location: '',
  summary: '',
  sections: [],
  experience: [{
  id: 'exp1',
  company: 'Company Name',
  title: 'Job Title',
  startDate: '',
  endDate: '',
  current: false,
  content: 'Achievements...',
  x: 50, y: 400, width: 700, height: 100,
  style: { fontSize: 12, color: '#000000', textAlign: 'left' }
}],
education: [{
  id: 'edu1',
  school: 'Institution',
  degree: 'Degree Title',
  startDate: '',
  endDate: '',
  description: '',
  x: 50, y: 650, width: 700, height: 80,
  style: { fontSize: 12, color: '#000000', textAlign: 'left' }
}],
skills: [{
  id: 'skill1',
  name: 'Skill Name',
  level: 50,
  x: 50, y: 850, width: 200, height: 40,
  style: { fontSize: 12, color: '#000000', textAlign: 'left' }
}],
referees: [{
  id: 'ref1',
  name: 'Referee Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  x: 50, y: 1000, width: 700, height: 60,
  style: { fontSize: 12, color: '#000000', textAlign: 'left' }
}],

  hobbies: [],
  website: '',
  skillUrl: '',
  qrCode: '',
  pageCount: 1,
  role: '',
  tier: 'free',
  freeDownloadsUsed: 0,
  isAdmin: false,
  otpCode: '',

  // Metadata block
  metadataStyle: {
    x: 0,
    y: 0,
    width: 800,
    isLocked: true,
    isVisible: true,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  },

  // Summary block
  summaryStyle: {
    x: 0,
    y: 200,
    width: 800,
    isLocked: true,
    isVisible: true,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  },

  // Experience block
  experienceStyle: {
    x: 0,
    y: 350,
    width: 800,
    isLocked: true,
    isVisible: true,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  },

  // Education block
  educationStyle: {
    x: 0,
    y: 600,
    width: 800,
    isLocked: true,
    isVisible: true,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  },

  // Skills block
  skillsStyle: {
    x: 0,
    y: 800,
    width: 800,
    isLocked: true,
    isVisible: true,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  },

  // Referees block
  refereeStyle: {
    x: 0,
    y: 950,
    width: 800,
    isLocked: true,
    isVisible: true,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  },

  // QR block
  qrStyle: {
    x: 650,
    y: 50,
    width: 100,
    height: 100,
    isLocked: true,
    isVisible: true,
    style: { opacity: 1 }
  },

  // Name block
  nameStyle: {
    x: 300,
    y: 50,
    width: 200,
    isVisible: true,
    style: {
      fontSize: 32,
      fontWeight: '900',
      color: '#000000',
      textAlign: 'center'
    }
  },

  // Email block
  emailStyle: {
    x: 300,
    y: 100,
    width: 200,
    isVisible: true,
    style: {
      fontSize: 10,
      fontWeight: '900',
      color: '#a1a1aa',
      textAlign: 'center'
    }
  },

  // Phone block
  phoneStyle: {
    x: 300,
    y: 120,
    width: 200,
    isVisible: true,
    style: {
      fontSize: 10,
      fontWeight: '900',
      color: '#a1a1aa',
      textAlign: 'center'
    }
  },

  // Aesthetics
  aesthetics: {
    fontFamily: 'Inter',
    primaryColor: '#09090b',
    backgroundColor: '#ffffff',
    fontSize: 14,
    elements: []
  }
});


convertMockTemplateToResumeData(mockTemplate: any): ResumeData {
  const resumeData: ResumeData = {
    name: mockTemplate.name || '',
    email: mockTemplate.email || '',
    phone: mockTemplate.phone || '',
    phoneCountryCode: mockTemplate.phoneCountryCode || '+1',
    location: mockTemplate.location || '',
    summary: mockTemplate.summary || '',
    sections: [],
    experience: (mockTemplate.experience || []).map((exp: any, i: number) => ({
      id: `exp${i+1}`,
      company: exp.company || '',
      title: exp.title || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: exp.current || false,
      content: exp.content || '',
      x: 50,
      y: 350 + (i * 120),
      width: 700,
      height: 100,
      style: { fontSize: 12, color: '#111827', textAlign: 'left' }
    })),
    education: (mockTemplate.education || []).map((edu: any, i: number) => ({
      id: `edu${i+1}`,
      school: edu.school || '',
      degree: edu.degree || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      description: edu.description || '',
      x: 50,
      y: 600 + (i * 80),
      width: 700,
      height: 80,
      style: { fontSize: 12, color: '#111827', textAlign: 'left' }
    })),
    referees: (mockTemplate.referees || []).map((ref: any, i: number) => ({
      id: `ref${i+1}`,
      name: ref.name || '',
      email: ref.email || '',
      phone: ref.phone || '',
      address: ref.address || '',
      x: 50,
      y: 950 + (i * 60),
      width: 700,
      height: 60,
      style: { fontSize: 12, color: '#111827', textAlign: 'left' }
    })),
    skills: (mockTemplate.skills || []).map((skill: any, i: number) => ({
      id: `skill${i+1}`,
      name: skill.name || '',
      level: skill.level || 50,
      x: 50 + (i % 4 * 100),
      y: 800 + (Math.floor(i / 4) * 40),
      width: 200,
      height: 40,
      style: { fontSize: 12, color: '#111827', textAlign: 'left' }
    })),
    hobbies: mockTemplate.hobbies || [],
    boards: (mockTemplate.boards || []).map((board: any, i: number) => ({
      id: `board${i+1}`,
      name: board.name || '',
      role: board.role || '',
      x: 50,
      y: 1100 + (i * 80),
      width: 700,
      height: 60,
      style: { fontSize: 12, color: '#111827', textAlign: 'left' }
    })),
    aesthetics: {
      fontFamily: mockTemplate.fontFamily || 'Inter',
      primaryColor: mockTemplate.primaryColor || '#000',
      backgroundColor: mockTemplate.backgroundColor || '#fff',
      fontSize: 14,
      elements: []
    },
    metadataStyle: { x:0, y:0, width:800 },
    experienceStyle: { x:0, y:350, width:800, style:{} },
    educationStyle: { x:0, y:600, width:800, style:{} },
    skillsStyle: { x:0, y:800, width:800, style:{} },
    refereeStyle: { x:0, y:950, width:800, style:{} },
    qrStyle: { x:650, y:50, width:100, height:100 },
    nameStyle: { x:300, y:50, width:200, style:{ fontSize:32, fontWeight:'900', color:'#000', textAlign:'center' } },
    emailStyle: { x:300, y:100, width:200, style:{ fontSize:12, color:'#6b7280', textAlign:'center' } },
    phoneStyle: { x:300, y:120, width:200, style:{ fontSize:12, color:'#6b7280', textAlign:'center' } },
    summaryStyle: { x:0, y:200, width:800, style:{ fontSize:14, color:'#111827', textAlign:'center' } },
    tier: 'free',
    freeDownloadsUsed: 0,
    isAdmin: false,
    otpCode: ''
  };

  return resumeData;
}


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
    console.log('[Commit] Snapshot size:', currentState.length, 'chars');

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

    async sendOtp(data: { name: string; email: string; location: string; role: string }): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_BASE}/api/auth/send-otp`, data)
      );
      return true;
    } catch {
      return false;
    }
  }


 async verifyOtp(email: string, code: string): Promise<{ success: boolean }> {
  const response = await firstValueFrom(
    this.http.post<{ success: boolean }>(
      `${this.API_BASE}/api/auth/verify-otp`,
      { email, code }
    )
  );

if (response.success) {
  this.loadUser(email).catch(err => console.error('Load user failed:', err));
}

  return response;
}



 get isEmailVerified(): boolean {
  const user = this.resumeState();   // ✅ call the signal
  return !!user.otpCode;             // ✅ true if non-empty, false if empty
}

  getCurrentUserEmail(): string {
    if (isPlatformBrowser(this.platformId)) {
      return this.userEmail() || localStorage.getItem('userEmail') || this.resumeState().email || '';
    }
    return this.userEmail() || this.resumeState().email || '';
  }


  // Example: update state after login
  setUserProfile(profile: any) {
    this.resumeState.set(profile);
  }
  




async login(email: string, password: string): Promise<boolean> {
  console.time('loginRequest')
  try {
    const response = await firstValueFrom(
      this.http.post<{ token: string; email: string; isAdmin: boolean; tier?: string }>(
        `${this.API_BASE}/api/auth/login`,
        { email, password },
        { observe: 'body' }
      ).pipe(timeout(120000))
    );
    

    if (response.token) {
      console.log('[Login] Success for', response.email);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('jwt', response.token);
        localStorage.setItem('isAdmin', response.isAdmin ? 'true' : 'false');
        localStorage.setItem('userEmail', response.email);
        localStorage.setItem('isLoggedIn', 'true');
        if (response.tier) localStorage.setItem('tier', response.tier);
      }

      this.isLoggedIn.set(true);
      this.userEmail.set(response.email);
      this.isAdmin.set(response.isAdmin);
      this.isPremium.set(!!response.tier);

      this.resumeState.update(prev => ({ ...prev, email: response.email }));

      // 🚀 background tasks (Promises, not Observables)
      // background tasks with timing
      console.time('loadUser');
      this.loadUser(response.email)
        .then(user => { console.timeEnd('loadUser'); console.log('[Login] User loaded', user); })
        .catch(err => console.error('Load user failed:', err));

      console.time('checkEligibility');
      this.checkEligibility()
        .then(flags => { console.timeEnd('checkEligibility'); console.log('[Login] Eligibility checked', flags); })
        .catch(err => console.error('Eligibility check failed:', err));


      return true;
    }
    console.timeEnd('loginRequest');
    return false;
  } catch (err) {
    console.error('Login failed or timed out:', err);
    return false;
  }
  
}



isAdminUser(): boolean {
  return this.isAdmin();
}


  async signup(data: Record<string, string | null>): Promise<boolean> {
    try {
      // In a real app, this would call your Go backend
      await firstValueFrom(this.http.post(`${this.API_BASE}/api/auth/signup`, data));
      
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

async loadUser(email: string) {
  try {
    console.time('loadUser');
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('jwt');
    }
    const user = await firstValueFrom(
      this.http.get<ResumeData>(
        `${this.API_BASE}/api/user?email=${email}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      ).pipe(timeout(15000))
    );
    console.timeEnd('loadUser');
    this.resumeState.set(user);
    return user;
  } catch (error) {
    console.error('Failed to load user:', error);
    throw error;
  }
}



 logout() {
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
    this.userEmail.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwt');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isLoggedIn');
    }
  }

  async getAdminStats() {
    return firstValueFrom(
      this.http.get<{ totalUsers: number; activeUsers: number; totalRevenue: number; tierCounts: Record<string, number> }>('/api/admin/stats')
    );
  }

  updateResume(data: Partial<ResumeData>) {
    this.resumeState.update(prev => ({ ...prev, ...data }));
  }

  updateElementProperty(key: keyof ResumeElement, value: any) {
  const selected = this.selectedIds();
  if (selected.size === 0) return;

  this.resumeState.update(prev => {
    const next = { ...prev };

    // Update aesthetics elements
    next.aesthetics.elements = next.aesthetics.elements.map(el =>
      selected.has(el.id) ? { ...el, [key]: value } : el
    );

    // Update logical blocks (like experienceStyle, skillsStyle, etc.)
    const styleKeys = ['nameStyle','emailStyle','phoneStyle','summaryStyle','qrStyle','metadataStyle','experienceStyle','educationStyle','skillsStyle','refereeStyle'] as const;
    styleKeys.forEach(blockKey => {
      if (selected.has(blockKey)) {
        (next as any)[blockKey] = { ...(next as any)[blockKey], [key]: value };
      }
    });

    return next;
  });

  this.commit();
  
  // this.resumeState.update(prev => ({ ...prev }));
}



  updateSelectedElementsStyle(style: Partial<ResumeElement['style']>) {
    const selected = this.selectedIds();
    if (selected.size === 0) return;

    this.resumeState.update(prev => {
      const next = { ...prev };
      
      // Aesthetic elements
      next.aesthetics.elements = next.aesthetics.elements.map(el => {
        if (selected.has(el.id)) {
          return {
            ...el,
            style: { ...el.style, ...style }
          };
        }
        return el;
      });

      // Special handling for logical blocks with individual styles
      const styleKeys = ['nameStyle', 'emailStyle', 'phoneStyle', 'summaryStyle', 'qrStyle', 'metadataStyle', 'experienceStyle', 'educationStyle', 'skillsStyle', 'refereeStyle'] as const;
      styleKeys.forEach(key => {
        if (selected.has(key)) {
          const block = (next as any)[key];
          if (block) {
            block.style = { ...(block.style || {}), ...style };
          }
        }
      });

      return next;
    });
    this.commit();
  }

  updateSelectedElementsProperty(prop: Partial<ResumeElement>) {
    const selected = this.selectedIds();
    if (selected.size === 0) return;

    this.resumeState.update(prev => {
      const aestheticsElements = prev.aesthetics.elements.map(el => selected.has(el.id) ? { ...el, ...prop } : el);
      const experience = prev.experience.map(el => selected.has(el.id) ? { ...el, ...prop } : el);
      const education = prev.education.map(el => selected.has(el.id) ? { ...el, ...prop } : el);
      const referees = prev.referees.map(el => selected.has(el.id) ? { ...el, ...prop } : el);
      const skills = prev.skills.map(el => selected.has(el.id) ? { ...el, ...prop } : el);

      const next = { 
        ...prev, 
        experience, 
        education, 
        referees, 
        skills,
        aesthetics: { ...prev.aesthetics, elements: aestheticsElements } 
      };

      // Logical blocks
      const styleKeys = ['nameStyle', 'emailStyle', 'phoneStyle', 'summaryStyle', 'qrStyle', 'metadataStyle', 'experienceStyle', 'educationStyle', 'skillsStyle', 'refereeStyle'] as const;
      styleKeys.forEach(key => {
        if (selected.has(key)) {
          (next as any)[key] = { ...((next as any)[key] || {}), ...prop };
        }
      });

      return next;
    });
    this.commit();
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
      console.time('extractResume');
      const response = await firstValueFrom(
        this.http.post<ResumeData>(`${this.API_BASE}/api/resume/extract`, { fileName })
      );
      console.timeEnd('extractResume');
      this.resumeState.set(response);
      return response;
    } catch (error) {
      console.error('Extract error:', error);
      throw error;
    }
  }

async checkEligibility(): Promise<{ canDownload: boolean; isPremium: boolean; hasFreeDownloadLeft: boolean }> {
  const email = this.resumeState().email;
  const tier = this.resumeState().tier;

  if (email && !tier) {
    return { canDownload: false, isPremium: false, hasFreeDownloadLeft: false };
  }

  try {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('jwt');
    }
    console.time('checkEligibility');
    const res = await firstValueFrom(
      this.http.post<{ canDownload: boolean; isPremium: boolean; hasFreeDownloadLeft: boolean }>(
        `${this.API_BASE}/api/resume/check-eligibility`,
        { email },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      ).pipe(timeout(15000))
    );
    console.timeEnd('checkEligibility');

    const premiumTiers = ['1y', '1m', '2w'];
    const isPremium = (tier && premiumTiers.includes(tier)) || res.isPremium;

    this.isPremium.set(isPremium);
    this.hasFreeDownloadLeft.set(res.hasFreeDownloadLeft);
    this.isPaid.set(isPremium);

    return { canDownload: res.canDownload, isPremium, hasFreeDownloadLeft: res.hasFreeDownloadLeft };
  } catch (error) {
    console.error('Eligibility check failed:', error);
    return { canDownload: false, isPremium: false, hasFreeDownloadLeft: false };
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

  async initiatePayment(email: string, tierId: string, amount: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return; // skip in SSR
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(`https://resume-backend-plmv.onrender.com/api/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tierId, amount }), signal: controller.signal
    });
    const result = await response.json();
    clearTimeout(timeoutId);
    if (isPlatformBrowser(this.platformId) && result.authorization_url) {
  window.location.href = result.authorization_url;
}
    return result;
  }


  async verifyPayment(reference: string): Promise<any> {
    const response = await fetch(`https://resume-backend-plmv.onrender.com/api/payment/verify?reference=${reference}`);
    return response.json();
  }

  async updateUserSubscription(email: string, tierId: string): Promise<any> {
  const response = await fetch(`https://resume-backend-plmv.onrender.com/api/payment/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, tierId })
  });
  return response.json();
}



 alignMode = signal<'selection' | 'page'>('selection');

// Alignment
alignElements(type: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle') {
  const selected = this.selectedIds();
  if (selected.size < 1) return;

  interface HasBounds {
    x: number;
    y: number;
    width: number;
    height?: number;
  }

  this.resumeState.update(prev => {
    const next = { ...prev };
    const mode = this.alignMode();
    const paperWidth = 794;
    const paperHeight = (next.pageCount || 1) * 1123;

    const getElement = (id: string): HasBounds | null => {
    let el = next.aesthetics.elements.find(e => e.id === id) as HasBounds | undefined;
    if (!el) {
      const listItems = [...next.skills, ...next.experience, ...next.education, ...next.referees] as HasBounds[];
      el = listItems.find(item => (item as any).id === id);
    }
    if (!el) {
      const staticIds = ['nameStyle','emailStyle','phoneStyle','summaryStyle','qrStyle','metadataStyle','experienceStyle','educationStyle','skillsStyle','refereeStyle'];
      if (staticIds.includes(id)) el = (next as any)[id] as HasBounds;
    }
    return el || null;
  };


    const selectedEls = Array.from(selected)
      .map(id => ({ id, el: getElement(id) }))
      .filter((item): item is { id: string; el: HasBounds } => !!item.el);

    if (selectedEls.length === 0) return prev;

    if (mode === 'page') {
      switch (type) {
        case 'left':
          selectedEls.forEach(item => item.el.x = 0);
          break;
        case 'right':
          selectedEls.forEach(item => item.el.x = paperWidth - item.el.width);
          break;
        case 'center':
          selectedEls.forEach(item => item.el.x = (paperWidth - item.el.width) / 2);
          break;
        case 'top':
          selectedEls.forEach(item => item.el.y = 0);
          break;
        case 'bottom':
          selectedEls.forEach(item => item.el.y = paperHeight - (item.el.height || 40));
          break;
        case 'middle':
          selectedEls.forEach(item => item.el.y = (paperHeight - (item.el.height || 40)) / 2);
          break;
      }
    } else if (selectedEls.length > 1) {
      switch (type) {
        case 'left': {
          const minLeft = Math.min(...selectedEls.map(item => item.el.x));
          selectedEls.forEach(item => item.el.x = minLeft);
          break;
        }
        case 'right': {
          const maxRight = Math.max(...selectedEls.map(item => item.el.x + item.el.width));
          selectedEls.forEach(item => item.el.x = maxRight - item.el.width);
          break;
        }
        case 'center': {
          const minX = Math.min(...selectedEls.map(item => item.el.x));
          const maxX = Math.max(...selectedEls.map(item => item.el.x + item.el.width));
          const centerX = minX + (maxX - minX) / 2;
          selectedEls.forEach(item => item.el.x = centerX - item.el.width / 2);
          break;
        }
        case 'top': {
          const minTop = Math.min(...selectedEls.map(item => item.el.y));
          selectedEls.forEach(item => item.el.y = minTop);
          break;
        }
        case 'bottom': {
          const maxBottom = Math.max(...selectedEls.map(item => item.el.y + (item.el.height || 40)));
          selectedEls.forEach(item => item.el.y = maxBottom - (item.el.height || 40));
          break;
        }
        case 'middle': {
          const minY = Math.min(...selectedEls.map(item => item.el.y));
          const maxY = Math.max(...selectedEls.map(item => item.el.y + (item.el.height || 40)));
          const centerY = minY + (maxY - minY) / 2;
          selectedEls.forEach(item => item.el.y = centerY - (item.el.height || 40) / 2);
          break;
        }
      }
    }

    return next;
  });
  this.commit();
  // this.resumeState.update(prev => ({ ...prev }));

}

// Distribution
distributeElements(direction: 'horizontal' | 'vertical') {
  const selected = this.selectedIds();
  if (selected.size < 3) return;

  interface HasBounds {
    x: number;
    y: number;
    width: number;
    height?: number;
  }

  this.resumeState.update(prev => {
    const next = { ...prev };

    const getElement = (id: string): HasBounds | null => {
      let el = next.aesthetics.elements.find(e => e.id === id) as HasBounds | undefined;
      if (!el) {
        const listItems = [...next.skills, ...next.experience, ...next.education, ...next.referees] as HasBounds[];
        el = listItems.find(item => (item as any).id === id);
      }
      if (!el) {
        const staticIds = ['nameStyle','emailStyle','phoneStyle','summaryStyle','qrStyle','metadataStyle','experienceStyle','educationStyle','skillsStyle','refereeStyle'];
        if (staticIds.includes(id)) el = (next as any)[id] as HasBounds;
      }
      if (!el) return null;

      // el.width = el.width || 200;
      // el.height = el.height || 40;
      return el;
    };

    const selectedEls = Array.from(selected)
      .map(id => ({ id, el: getElement(id) }))
      .filter((item): item is { id: string; el: HasBounds } => !!item.el);

    if (direction === 'horizontal') {
      selectedEls.sort((a, b) => a.el.x - b.el.x);
      const minX = selectedEls[0].el.x;
      const maxX = selectedEls[selectedEls.length - 1].el.x + selectedEls[selectedEls.length - 1].el.width;
      const totalWidths = selectedEls.reduce((sum, item) => sum + item.el.width, 0);
      const gap = (maxX - minX - totalWidths) / (selectedEls.length - 1);

      let currentX = minX;
      selectedEls.forEach(item => {
        item.el.x = currentX;
        currentX += item.el.width + gap;
      });
    } else {
      selectedEls.sort((a, b) => a.el.y - b.el.y);
      const minY = selectedEls[0].el.y;
      const maxY = selectedEls[selectedEls.length - 1].el.y + (selectedEls[selectedEls.length - 1].el.height || 40);
      const totalHeights = selectedEls.reduce((sum, item) => sum + (item.el.height || 40), 0);
      const gap = (maxY - minY - totalHeights) / (selectedEls.length - 1);

      let currentY = minY;
      selectedEls.forEach(item => {
        item.el.y = currentY;
        currentY += (item.el.height || 40) + gap;
      });
    }

    return next;
  });
  this.commit();
  // this.resumeState.update(prev => ({ ...prev }));

}

 

getDefaultResume(): ResumeData {
  return {
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
    aesthetics: {
      fontFamily: 'Inter',
      primaryColor: '#000',
      backgroundColor: '#fff',
      fontSize: 14,
      elements: []
    },
    metadataStyle: { x:0, y:0, width:800 },
    experienceStyle: { x:0, y:350, width:800, style: {} },
    educationStyle: { x:0, y:600, width:800, style: {} },
    skillsStyle: { x:0, y:800, width:800, style: {} },
    refereeStyle: { x:0, y:950, width:800, style: {} },
    qrStyle: { x:650, y:50, width:100, height:100 },
    nameStyle: { x:300, y:50, width:200, style: {} },
    emailStyle: { x:300, y:100, width:200, style: {} },
    phoneStyle: { x:300, y:120, width:200, style: {} },
    summaryStyle: { x:0, y:200, width:800, style: {} },
    tier: 'free',
    freeDownloadsUsed: 0,
    isAdmin: false,
    otpCode: ''
  };
}

 async runCoachAnalysis(resumeData: unknown) {
    let token: string | null = null;
  if (isPlatformBrowser(this.platformId)) {
    token = localStorage.getItem('jwt');
  }

  return firstValueFrom(
    this.http.post<{ atsScore: number; suggestions: string[] }>(
      `${this.API_BASE}/api/ai/coach`,
      { resumeData, model: this.selectedModelId },
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(timeout(15000))
  );
}


  // existing backend call
private async polishSummaryRequest(summary: string) {
  return firstValueFrom(
    this.http.post<{ result: string }>(`${this.API_BASE}/api/ai/polish-summary`, { 
      summary,
      model: this.selectedModelId
    }).pipe(timeout(15000))
  );
}

// new public method with eligibility check
async polishSummary(summary: string): Promise<{ result?: string; requiresSubscription?: boolean }> {
  const eligibility = await this.checkEligibility();

  if (!eligibility.isPremium) {
    // ✅ free tier → signal to open subscription dialog
    return { requiresSubscription: true };
  }

  // ✅ premium → run polish
  return this.polishSummaryRequest(summary);
}


  async suggestExperienceDescription(title: string, company: string, currentContent: string) {
    return firstValueFrom(
      this.http.post<{ result: string }>(`${this.API_BASE}/api/ai/suggest-experience`, { 
        title, 
        company, 
        currentContent,
        model: this.selectedModelId
      }).pipe(timeout(15000))
    );
  }

  async mapToJob(resumeData: unknown, jobUrl: string) {
    return firstValueFrom(
      this.http.post<ResumeData>(`${this.API_BASE}/api/ai/map-job`, { 
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

  async loadTemplate(templateId: string): Promise<ResumeData> {
  try {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('jwt');
    }
    console.time('loadTemplate');
    const mockTemplate = await firstValueFrom(
      this.http.get<any>(
        `${this.API_BASE}/api/templates/${templateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );
    console.timeEnd('loadTemplate');
    const resumeData = this.convertMockTemplateToResumeData(mockTemplate);

    // Replace current resume state with the selected template
    this.resumeState.set(resumeData);
    this.commit();
    return resumeData;
  } catch (error) {
    console.error('Failed to load template:', error);
    throw error;
  }
}

async exportHtml(html: string, token: string | null) {
  return firstValueFrom(
    this.http.post<{ pdfUrl: string }>(
      `${this.API_BASE}/api/resume/export-html`,
      { html },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    ).pipe(timeout(15000))
  );
}


}
