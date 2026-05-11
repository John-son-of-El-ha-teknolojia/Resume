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
  { value: '+93', label: 'AFG' },
  { value: '+355', label: 'ALB' },
  { value: '+213', label: 'DZA' },
  { value: '+1684', label: 'ASM' },
  { value: '+376', label: 'AND' },
  { value: '+244', label: 'AGO' },
  { value: '+1264', label: 'AIA' },
  { value: '+672', label: 'ATA' },
  { value: '+1268', label: 'ATG' },
  { value: '+54', label: 'ARG' },
  { value: '+374', label: 'ARM' },
  { value: '+297', label: 'ABW' },
  { value: '+247', label: 'ASC' },
  { value: '+61', label: 'AUS' },
  { value: '+43', label: 'AUT' },
  { value: '+994', label: 'AZE' },
  { value: '+1242', label: 'BHS' },
  { value: '+973', label: 'BHR' },
  { value: '+880', label: 'BGD' },
  { value: '+1246', label: 'BRB' },
  { value: '+375', label: 'BLR' },
  { value: '+32', label: 'BEL' },
  { value: '+501', label: 'BLZ' },
  { value: '+229', label: 'BEN' },
  { value: '+1441', label: 'BMU' },
  { value: '+975', label: 'BTN' },
  { value: '+591', label: 'BOL' },
  { value: '+387', label: 'BIH' },
  { value: '+267', label: 'BWA' },
  { value: '+55', label: 'BRA' },
  { value: '+1284', label: 'VGB' },
  { value: '+673', label: 'BRN' },
  { value: '+359', label: 'BGR' },
  { value: '+226', label: 'BFA' },
  { value: '+95', label: 'MMR' },
  { value: '+257', label: 'BDI' },
  { value: '+855', label: 'KHM' },
  { value: '+237', label: 'CMR' },
  { value: '+1', label: 'CAN' },
  { value: '+238', label: 'CPV' },
  { value: '+1345', label: 'CYM' },
  { value: '+236', label: 'CAF' },
  { value: '+235', label: 'TCD' },
  { value: '+56', label: 'CHL' },
  { value: '+86', label: 'CHN' },
  { value: '+61', label: 'CXR' },
  { value: '+61', label: 'CCK' },
  { value: '+57', label: 'COL' },
  { value: '+269', label: 'COM' },
  // { value: '+242', label: 'COG' },
  { value: '+682', label: 'COK' },
  { value: '+506', label: 'CRC' },
  { value: '+385', label: 'HRV' },
  { value: '+53', label: 'CUB' },
  { value: '+357', label: 'CYP' },
  { value: '+420', label: 'CZE' },
  { value: '+243', label: 'COD' },
  { value: '+45', label: 'DNK' },
  { value: '+246', label: 'DGA' },
  { value: '+253', label: 'DJI' },
  { value: '+1767', label: 'DMA' },
  { value: '+1809', label: 'DOM' },
  { value: '+593', label: 'ECU' },
  { value: '+20', label: 'EGY' },
  { value: '+503', label: 'SLV' },
  { value: '+240', label: 'GNQ' },
  { value: '+291', label: 'ERI' },
  { value: '+372', label: 'EST' },
  { value: '+251', label: 'ETH' },
  { value: '+500', label: 'FLK' },
  { value: '+298', label: 'FRO' },
  { value: '+679', label: 'FJI' },
  { value: '+358', label: 'FIN' },
  { value: '+33', label: 'FRA' },
  { value: '+594', label: 'GUF' },
  { value: '+689', label: 'PYF' },
  { value: '+241', label: 'GAB' },
  { value: '+220', label: 'GMB' },
  { value: '+995', label: 'GEO' },
  { value: '+49', label: 'DEU' },
  { value: '+233', label: 'GHA' },
  { value: '+350', label: 'GIB' },
  { value: '+30', label: 'GRC' },
  { value: '+299', label: 'GRL' },
  { value: '+1473', label: 'GRD' },
  { value: '+590', label: 'GLP' },
  { value: '+1671', label: 'GUM' },
  { value: '+502', label: 'GTM' },
  { value: '+224', label: 'GIN' },
  { value: '+245', label: 'GNB' },
  { value: '+592', label: 'GUY' },
  { value: '+509', label: 'HTI' },
  { value: '+39', label: 'VAT' },
  { value: '+504', label: 'HND' },
  { value: '+852', label: 'HKG' },
  { value: '+36', label: 'HUN' },
  { value: '+354', label: 'ISL' },
  { value: '+91', label: 'IND' },
  { value: '+62', label: 'IDN' },
  { value: '+98', label: 'IRN' },
  { value: '+964', label: 'IRQ' },
  { value: '+353', label: 'IRL' },
  { value: '+44', label: 'IMN' },
  { value: '+972', label: 'ISR' },
  { value: '+39', label: 'ITA' },
  { value: '+225', label: 'CIV' },
  { value: '+1876', label: 'JAM' },
  { value: '+81', label: 'JPN' },
  { value: '+44', label: 'JEY' },
  { value: '+962', label: 'JOR' },
  { value: '+7', label: 'KAZ' },
  { value: '+254', label: 'KEN' },
  { value: '+686', label: 'KIR' },
  { value: '+965', label: 'KWT' },
  { value: '+996', label: 'KGZ' },
  { value: '+856', label: 'LAO' },
  { value: '+371', label: 'LVA' },
  { value: '+961', label: 'LBN' },
  { value: '+266', label: 'LSO' },
  { value: '+231', label: 'LBR' },
  { value: '+218', label: 'LBY' },
  { value: '+423', label: 'LIE' },
  { value: '+370', label: 'LTU' },
  { value: '+352', label: 'LUX' },
  { value: '+853', label: 'MAC' },
  { value: '+389', label: 'MKD' },
  { value: '+261', label: 'MDG' },
  { value: '+265', label: 'MWI' },
  { value: '+60', label: 'MYS' },
  { value: '+960', label: 'MDV' },
  { value: '+223', label: 'MLI' },
  { value: '+356', label: 'MLT' },
  { value: '+692', label: 'MHL' },
  { value: '+596', label: 'MTQ' },
  { value: '+222', label: 'MRT' },
  { value: '+230', label: 'MUS' },
  { value: '+262', label: 'MYT' },
  { value: '+52', label: 'MEX' },
  { value: '+691', label: 'FSM' },
  { value: '+373', label: 'MDA' },
  { value: '+377', label: 'MCO' },
  { value: '+976', label: 'MNG' },
  { value: '+382', label: 'MNE' },
  { value: '+1664', label: 'MSR' },
  { value: '+212', label: 'MAR' },
  { value: '+258', label: 'MOZ' },
  { value: '+264', label: 'NAM' },
  { value: '+674', label: 'NRU' },
  { value: '+977', label: 'NPL' },
  { value: '+31', label: 'NLD' },
  { value: '+599', label: 'ANT' },
  { value: '+687', label: 'NCL' },
  { value: '+64', label: 'NZL' },
  { value: '+505', label: 'NIC' },
  { value: '+227', label: 'NER' },
  { value: '+234', label: 'NGA' },
  { value: '+683', label: 'NIU' },
  { value: '+672', label: 'NFK' },
  { value: '+850', label: 'PRK' },
  { value: '+1670', label: 'MNP' },
  { value: '+47', label: 'NOR' },
  { value: '+968', label: 'OMN' },
  { value: '+92', label: 'PAK' },
  { value: '+680', label: 'PLW' },
  { value: '+970', label: 'PSE' },
  { value: '+507', label: 'PAN' },
  { value: '+675', label: 'PNG' },
  { value: '+595', label: 'PRY' },
  { value: '+51', label: 'PER' },
  { value: '+63', label: 'PHL' },
  { value: '+870', label: 'PCN' },
  { value: '+48', label: 'POL' },
  { value: '+351', label: 'PRT' },
  { value: '+1787', label: 'PRI' },
  { value: '+974', label: 'QAT' },
  { value: '+242', label: 'COG' },
  { value: '+262', label: 'REU' },
  { value: '+40', label: 'ROU' },
  { value: '+7', label: 'RUS' },
  { value: '+250', label: 'RWA' },
  { value: '+590', label: 'BLM' },
  { value: '+290', label: 'SHN' },
  { value: '+1869', label: 'KNA' },
  { value: '+1758', label: 'LCA' },
  { value: '+590', label: 'MAF' },
  { value: '+508', label: 'SPM' },
  { value: '+1784', label: 'VCT' },
  { value: '+685', label: 'WSM' },
  { value: '+378', label: 'SMR' },
  { value: '+239', label: 'STP' },
  { value: '+966', label: 'SAU' },
  { value: '+221', label: 'SEN' },
  { value: '+381', label: 'SRB' },
  { value: '+248', label: 'SYC' },
  { value: '+232', label: 'SLE' },
  { value: '+65', label: 'SGP' },
  { value: '+1721', label: 'SXM' },
  { value: '+421', label: 'SVK' },
  { value: '+386', label: 'SVN' },
  { value: '+677', label: 'SLB' },
  { value: '+252', label: 'SOM' },
  { value: '+27', label: 'ZAF' },
  { value: '+82', label: 'KOR' },
  { value: '+211', label: 'SSD' },
  { value: '+34', label: 'ESP' },
  { value: '+94', label: 'LKA' },
  { value: '+249', label: 'SDN' },
  { value: '+597', label: 'SUR' },
  { value: '+47', label: 'SJM' },
  { value: '+268', label: 'SWZ' },
  { value: '+46', label: 'SWE' },
  { value: '+41', label: 'CHE' },
  { value: '+963', label: 'SYR' },
  { value: '+886', label: 'TWN' },
  { value: '+992', label: 'TJK' },
  { value: '+255', label: 'TZA' },
  { value: '+66', label: 'THA' },
  { value: '+670', label: 'TLS' },
  { value: '+228', label: 'TGO' },
  { value: '+690', label: 'TKL' },
  { value: '+676', label: 'TON' },
  { value: '+1868', label: 'TTO' },
  { value: '+216', label: 'TUN' },
  { value: '+90', label: 'TUR' },
  { value: '+993', label: 'TKM' },
  { value: '+1649', label: 'TCA' },
  { value: '+688', label: 'TUV' },
  { value: '+256', label: 'UGA' },
  { value: '+380', label: 'UKR' },
  { value: '+971', label: 'ARE' },
  { value: '+44', label: 'GBR' },
  { value: '+1', label: 'USA' },
  { value: '+598', label: 'URY' },
  { value: '+1340', label: 'VIR' },
  { value: '+998', label: 'UZB' },
  { value: '+678', label: 'VUT' },
  { value: '+58', label: 'VEN' },
  { value: '+84', label: 'VNM' },
  { value: '+681', label: 'WLF' },
  { value: '+212', label: 'ESH' },
  { value: '+967', label: 'YEM' },
  { value: '+260', label: 'ZMB' },
  { value: '+263', label: 'ZWE' }
];

  constructor() {
  this.countryCodes.sort((a, b) => a.label.localeCompare(b.label));
}

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
  "Inter", 
  "Space Grotesk", 
  "Outfit", 
  "Playfair Display", 
  "JetBrains Mono",
  "Fira Code", 
  "Montserrat", 
  "Roboto", 
  "Open Sans", 
  "Times New Roman", 
  "Calibri"
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
  // Ensure resume exists
  if (!this.resume) return null;

  const selectedIds = this.resumeService.selectedIds();
  if (selectedIds.size === 0) return null;

  const id = Array.from(selectedIds)[0];

  // ✅ Guard aesthetics
  if (this.resume.aesthetics?.elements) {
    const aestheticEl = this.resume.aesthetics.elements.find((el: ResumeElement) => el.id === id);
    if (aestheticEl) return aestheticEl;
  }

  // ✅ Guard lists
  const listItems: (Experience | Education | Referee | Skill)[] = [
    ...(this.resume.experience || []),
    ...(this.resume.education || []),
    ...(this.resume.referees || []),
    ...(this.resume.skills || [])
  ];
 

  const listItem = listItems.find(item => item.id === id);
  if (listItem) {
    if (!(listItem as any).style) {
      (listItem as any).style = { fontSize: 12, color: '#000000', textAlign: 'left' };
    }
    return listItem;
  }




  // ✅ Guard style blocks
  const styleBlocks = [
    'nameStyle','emailStyle','phoneStyle','summaryStyle','qrStyle',
    'metadataStyle','experienceStyle','educationStyle','skillsStyle','refereeStyle'
  ];

  if (styleBlocks.includes(id)) {
    const block = (this.resume as any)[id];
    if (block) {
      if (!block.style) {
        block.style = { fontSize: 12, color: '#000000', textAlign: 'left' };
      }
      return { ...block, id, type: id === 'qrStyle' ? 'image' : 'text' };
    }
  }

  return null;
}

moveForward(el: ResumeElement) {
  el.zIndex = (el.zIndex || 10) + 1;
  this.updateResume();
}

moveBackward(el: ResumeElement) {
  el.zIndex = Math.max(0, (el.zIndex || 10) - 1);
  this.updateResume();
}

get selectedBox() {
  const el = this.getActiveElement();
  return el && el.type === 'box' ? el : null;
}


  addExperience() {
  const newExp: Experience = {
    id: Math.random().toString(36).substring(7),
    company: "",
    title: "",
    startDate: "",
    endDate: "",
    current: false,
    content: "",
    x: 50, y: 400, width: 700, height: 100,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' } // ✅ added
  };
  this.resume.experience = [...(this.resume.experience || []), newExp];
  this.updateResume();
}


  removeExperience(id: string) {
    this.resume.experience = this.resume.experience.filter((e: Experience) => e.id !== id);
    this.updateResume();
  }

 addEducation() {
  const newEdu: Education = {
    id: Math.random().toString(36).substring(7),
    school: "",
    degree: "",
    startDate: "",
    endDate: "",
    description: "",
    x: 50, y: 650, width: 700, height: 80,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
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
  const newRef: Referee = {
    id: Math.random().toString(36).substring(7),
    name: "", email: "", phone: "", address: "",
    x: 50, y: 1000, width: 700, height: 60,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  };
  this.resume.referees = [...(this.resume.referees || []), newRef];
  this.updateResume();
}

addBox() {
  const newBox: ResumeElement = {
    id: Math.random().toString(36).substring(7),
    type: 'box',
    content: '',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    style: {
      backgroundColor: '#f4f4f5',
      borderColor: '#e4e4e7',
      borderWidth: 1,
      opacity: 1
    }
  };

  this.resume.aesthetics.elements = [...(this.resume.aesthetics.elements || []), newBox];
  this.updateResume();
}


  removeReferee(id: string) {
    this.resume.referees = this.resume.referees.filter((r: Referee) => r.id !== id);
    this.updateResume();
  }

addSkill() {
  const newSkill: Skill = {
    id: Math.random().toString(36).substring(7),
    name: "New Skill",
    level: 50,
    x: 50, y: 850, width: 200, height: 40,
    style: { fontSize: 12, color: '#000000', textAlign: 'left' }
  };
  this.resume.skills = [...(this.resume.skills || []), newSkill];
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

  this.isAnalyzing.set(true);

  try {
    const res = await this.resumeService.polishSummary(this.resume.summary);

    if (res.requiresSubscription) {
      // ✅ free tier → redirect to subscription page
      window.location.href = '../payment'; // Adjust path as needed
      return;
    }

    // ✅ premium → update summary
    if (res.result) {
      this.resume.summary = res.result;
      this.updateResume();
    }
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
