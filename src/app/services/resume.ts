import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
}

export interface Hobby {
  id: string;
  name: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 0-100
  displayMode?: 'text' | 'vertical_bar' | 'horizontal_bar';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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

  constructor() {
    // Initialize history with current state
    const state = JSON.stringify(this.resumeState());
    this.history.push(state);
    this.initialState = state;
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
    experience: [],
    education: [],
    referees: [],
    skills: [],
    hobbies: [],
    website: '',
    metadataStyle: {
      x: 0,
      y: 0,
      width: 800,
      isLocked: true,
      isVisible: true
    },
    experienceStyle: {
      x: 0,
      y: 350,
      width: 800,
      isLocked: true,
      isVisible: true
    },
    summaryStyle: {
      x: 0,
      y: 200,
      width: 800,
      isLocked: true,
      isVisible: true
    },
    educationStyle: {
      x: 0,
      y: 600,
      width: 800,
      isLocked: true,
      isVisible: true
    },
    skillsStyle: {
      x: 0,
      y: 800,
      width: 800,
      isLocked: true,
      isVisible: true
    },
    refereeStyle: {
      x: 0,
      y: 950,
      width: 800,
      isLocked: true,
      isVisible: true
    },
    qrStyle: {
      x: 650,
      y: 50,
      width: 100,
      height: 100,
      isLocked: true,
      isVisible: true
    },
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
          this.http.post<{ token: string; email: string; isAdmin: boolean }>(
            `${this.API_BASE}/api/auth/login`,
            { email, password }
          )
        );

        if (response.token) {
          // Save JWT for later requests
          localStorage.setItem('jwt', response.token);

          this.isLoggedIn.set(true);
          this.isAdmin.set(response.isAdmin);
          this.userEmail.set(response.email);

          this.resumeState.update(prev => ({ ...prev, email: response.email }));
          return true;
        }

        return false;
      } catch (error) {
        console.error('Login error:', error);
        return false;
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
  
  this.resumeState.update(prev => ({ ...prev }));
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
      const token = localStorage.getItem('jwt');
      const res = await firstValueFrom(
        this.http.post<{ canDownload: boolean; isPremium: boolean; hasFreeDownloadLeft: boolean }>(
          `${this.API_BASE}/api/resume/check-eligibility`,
          { email },
          { headers: { Authorization: `Bearer ${token}` } }
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
  this.resumeState.update(prev => ({ ...prev }));

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
  this.resumeState.update(prev => ({ ...prev }));

}

  async runCoachAnalysis(resumeData: unknown) {
  const token = localStorage.getItem('jwt');
  return firstValueFrom(
    this.http.post<{ atsScore: number; suggestions: string[] }>(
      `${this.API_BASE}/api/ai/coach`,
      { resumeData, model: this.selectedModelId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
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

  async downloadPdf() {
  const canvas = document.getElementById('resume-canvas');
  if (!canvas) {
    alert('Canvas not found');
    return;
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Resume</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body>${canvas.outerHTML}</body>
  </html>`;

  const token = localStorage.getItem('jwt');
  const resp = await firstValueFrom(
    this.http.post<{ pdfUrl: string }>(
      `${this.API_BASE}/api/resume/export-html`,
      { html },
      { headers: { Authorization: `Bearer ${token}` } }
    )
  );

  const link = document.createElement('a');
  link.href = `${this.API_BASE}${resp.pdfUrl}`;
  link.download = 'resume.pdf';
  link.click();
}



// Actual PDF generator/downloader
// private async triggerPdfDownload() {
//   try {
//     const resumeData = this.resumeState();
//     const token = localStorage.getItem('jwt');
//     const response = await firstValueFrom(
//   this.http.post<{ pdfUrl: string }>(
//       `${this.API_BASE}/api/resume/generate-pdf`,
//       resumeData,
//       { headers: { Authorization: `Bearer ${token}` } }
//     )
//   );

//   // ✅ Use absolute HTTP URL, not file://
//   const link = document.createElement('a');
//   link.href = `${this.API_BASE}${response.pdfUrl}`;
//   link.download = 'resume.pdf';
//   link.click();

//   } catch (error) {
//     console.error('PDF download failed:', error);
//   }
// }


}
