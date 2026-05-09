import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeService, ResumeData, ResumeElement, Experience, Education, Referee, Skill, Hobby } from '../../services/resume';
import * as QRCode from 'qrcode';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDialogComponent } from '../payment/payment'; // adjust path

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './sidebar.component.html',
  styles: [`
    @reference "tailwindcss";
    :host {
      display: block;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .studio-tabs .mat-mdc-tab-header {
      border-bottom: 1px solid #f4f4f5;
    }
    .studio-tabs .mat-mdc-tab .mdc-tab__text-label {
      color: #71717a !important;
    }
    .studio-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: #09090b !important;
    }
    .studio-tabs .mat-mdc-tab-ink-bar {
      height: 2px !important;
      background-color: #09090b !important;
    }
  `]
})
export class SidebarComponent {
  @Input() resume!: ResumeData;
  @Input() sidebarPosition: 'left' | 'right' = 'left';
  @Output() resumeChange = new EventEmitter<ResumeData>();

  public resumeService = inject(ResumeService);
  
  activeStep: string = 'metadata';
  activeElementId = signal<string | null>(null);
  activeSectionId = signal<string | null>(null);
  isAnalyzing = signal(false);
  isMapping = signal(false);
  coachReport: { atsScore: number; suggestions: string[] } | null = null;
  jobUrl = "";
  qrCodeUrl = signal("");
  scale = signal(75);
  template = signal("minimal");

  countryCodes = [
    { value: '+1', label: '+1 (US)' },
    { value: '+44', label: '+44 (UK)' },
    { value: '+254', label: '+254 (KE)' },
    { value: '+91', label: '+91 (IN)' },
    { value: '+234', label: '+234 (NG)' }
  ];

  frameworks = [
    { id: "blank", name: "Ultra Blank" },
    { id: "minimal", name: "Swiss Minimalist" },
    { id: "modern", name: "Bento Modern" },
    { id: "classic", name: "Ivy League Classic" },
    { id: "executive", name: "Premium Executive" },
    { id: "creative", name: "Gradient Bold" },
    { id: "technical", name: "Dev Console" },
    { id: "startup", name: "Monochrome Startup" },
    { id: "academic", name: "Oxford Serif" },
    { id: "brutalist", name: "Neo-Brutalist" },
    { id: "glitch", name: "Digital Glitch" },
    { id: "elegant", name: "Vogue Editorial" },
  ];

  fonts = [
    "Inter", "Space Grotesk", "Outfit", "Playfair Display", "JetBrains Mono",
    "Fira Code", "Montserrat", "Roboto", "Syne", "Clash Display"
  ];

  updateResume() {
    this.resumeChange.emit(this.resume);
    this.generateQRCode().catch(err => console.error(err));
  }

  updateElementProperty(key: string, value: string | number | boolean) {
    this.resumeService.updateSelectedElementsProperty({ [key]: value });
    this.updateResume();
  }

  updateElementStyle(key: string, value: string | number | boolean) {
    this.resumeService.updateSelectedElementsStyle({ [key]: value });
    this.updateResume();
  }

  getFirstSelectedId(): string | null {
    const selectedIds = this.resumeService.selectedIds();
    if (selectedIds.size === 0) return null;
    return Array.from(selectedIds)[0];
  }

  getActiveElement(): any {
    const selectedIds = this.resumeService.selectedIds();
    if (selectedIds.size === 0) return null;
    const id = Array.from(selectedIds)[0];
    
    // Check aesthetics elements
    const aestheticEl = this.resume.aesthetics.elements.find((el: ResumeElement) => el.id === id);
    if (aestheticEl) return aestheticEl;

    // Check Experiences/Education/Referees/Skills
    const listItems: (Experience | Education | Referee | Skill)[] = [
      ...this.resume.experience,
      ...this.resume.education,
      ...this.resume.referees,
      ...this.resume.skills
    ];
    const listItem = listItems.find(item => item.id === id);
    if (listItem) return listItem;

    // Check specific style blocks
    const styleBlocks = ['nameStyle', 'emailStyle', 'phoneStyle', 'summaryStyle', 'qrStyle', 'metadataStyle', 'experienceStyle', 'educationStyle', 'skillsStyle', 'refereeStyle'];
    if (styleBlocks.includes(id)) {
      const block = (this.resume as any)[id];
      if (block) {
        // Ensure style exists
        if (!block.style) {
          block.style = {
            fontSize: 12,
            color: '#000000',
            textAlign: 'left'
          };
        }
        // For template display purposes, we might need a type
        return {
          ...block,
          id,
          type: id === 'qrStyle' ? 'image' : 'text'
        };
      }
    }

    return null;
  }

  addExperience() {
    const newExp = {
      id: Math.random().toString(36).substring(7),
      company: "",
      title: "",
      startDate: "",
      endDate: "",
      current: false,
      content: "",
    };
    this.resume.experience = [...(this.resume.experience || []), newExp];
    this.updateResume();
  }

  removeExperience(id: string) {
    this.resume.experience = this.resume.experience.filter((e: Experience) => e.id !== id);
    this.updateResume();
  }

  addEducation() {
    const newEdu = {
      id: Math.random().toString(36).substring(7),
      school: "",
      degree: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    this.resume.education = [...(this.resume.education || []), newEdu];
    this.updateResume();
  }

  removeEducation(id: string) {
    this.resume.education = this.resume.education.filter((e: Education) => e.id !== id);
    this.updateResume();
  }

  addHobby() {
    const newHobby = {
      id: Math.random().toString(36).substring(7),
      name: ""
    };
    this.resume.hobbies = [...(this.resume.hobbies || []), newHobby];
    this.updateResume();
  }

  removeHobby(id: string) {
    this.resume.hobbies = this.resume.hobbies.filter((h: Hobby) => h.id !== id);
    this.updateResume();
  }

  addReferee() {
    const newRef = {
      id: Math.random().toString(36).substring(7),
      name: "", email: "", phone: "", address: "",
    };
    this.resume.referees = [...(this.resume.referees || []), newRef];
    this.updateResume();
  }

  removeReferee(id: string) {
    this.resume.referees = this.resume.referees.filter((r: Referee) => r.id !== id);
    this.updateResume();
  }

  addSkill() {
    this.resume.skills = [
      ...(this.resume.skills || []),
      { id: Math.random().toString(36).substring(7), name: "New Skill", level: 50 },
    ];
    this.updateResume();
  }

  removeSkill(id: string) {
    this.resume.skills = this.resume.skills.filter((s: Skill) => s.id !== id);
    this.updateResume();
  }

  async generateQRCode() {
    const url = this.resume.skillUrl || this.resume.website;
    if (!url) {
      this.resume.qrCode = '';
      return;
    }
    try {
      this.qrCodeUrl.set(await QRCode.toDataURL(url));
      this.resume.qrCode = this.qrCodeUrl();
    } catch (err) {
      console.error("QR Generation failed:", err);
    }
  }

  onImageTrigger(input: HTMLInputElement) {
    input.click();
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.addElement('image', e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  getIconForType(type: string): string {
    switch (type) {
      case "image": return "image";
      case "line": return "horizontal_rule";
      case "box": return "crop_square";
      case "text": return "title";
      default: return "help_outline";
    }
  }

  addElement(type: 'image' | 'line' | 'box' | 'text', url?: string) {
    const newEl = { 
      id: Math.random().toString(36).substring(7), 
      type, 
      isVisible: true, 
      isLocked: false,
      x: 100, y: 100, width: 100, height: 100,
      url: url || '',
      content: type === 'text' ? 'New Text' : '',
      style: { fontSize: 12, color: '#09090b', backgroundColor: '#f4f4f5' }
    };
    this.resume.aesthetics.elements.unshift(newEl);
    this.updateResume();
  }

  removeElement(id: string) {
    this.resume.aesthetics.elements = this.resume.aesthetics.elements.filter((el: ResumeElement) => el.id !== id);
    this.updateResume();
  }

  resetResume() {
    if (confirm("Reset document to initial blueprint? (Irreversible)")) {
      this.resumeService.resetToInitial();
      this.resume = this.resumeService.resumeState();
      this.updateResume();
    }
  }

  exportResume() {
    this.resumeService.downloadPdf();
  }

  nextStep() {
    const steps = ['metadata', 'experience', 'education', 'skills', 'referees', 'layers', 'aesthetics', 'coach', 'summary'];
    const idx = steps.indexOf(this.activeStep);
    if (idx < steps.length - 1) this.activeStep = steps[idx + 1];
  }

  prevStep() {
    const steps = ['metadata', 'experience', 'education', 'skills', 'referees', 'layers', 'aesthetics', 'coach', 'summary'];
    const idx = steps.indexOf(this.activeStep);
    if (idx > 0) this.activeStep = steps[idx - 1];
  }

  calculateDuration(exp: Experience): string {
    if (!exp.startDate) return "0 mo";
    const start = new Date(exp.startDate);
    const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 0) months = 0;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    let result = "";
    if (years > 0) result += `${years} yr${years > 1 ? "s" : ""} `;
    if (remainingMonths > 0) result += `${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
    return result.trim() || "Less than a month";
  }

  async runCoachAnalysis() {
    this.isAnalyzing.set(true);
    try {
      const res = await this.resumeService.runCoachAnalysis(this.resume);
      this.coachReport = res;
    } catch (err) {
      console.error("Coach analysis failed:", err);
      // Fallback
      this.coachReport = { atsScore: 78, suggestions: ["Add specific achievements", "Improve summary impact"] };
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  private dialog = inject(MatDialog);

  async polishSummary() {
    if (!this.resume.summary) return;

    // ✅ Check eligibility first
    const eligibility = await this.resumeService.checkEligibility();

    if (!eligibility.isPremium) {
      // Not premium → open subscription dialog
      this.dialog.open(PaymentDialogComponent, {
        width: '480px',
        disableClose: true
      });
      return;
    }

    // ✅ Continue if premium
    this.isAnalyzing.set(true);
    try {
      const res = await this.resumeService.polishSummary(this.resume.summary);
      this.resume.summary = res.result;
      this.updateResume();
    } catch (err) {
      console.error("Polish failed:", err);
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async suggestExperienceDescription(index: number) {
    const exp = this.resume.experience[index];
    if (!exp.title) return;
    this.isAnalyzing.set(true);
    try {
      const res = await this.resumeService.suggestExperienceDescription(exp.title, exp.company, exp.content);
      exp.content = res.result;
      this.updateResume();
    } catch (err) {
      console.error("Suggest failed:", err);
    } finally {
      this.isAnalyzing.set(false);
    }
  }
}
