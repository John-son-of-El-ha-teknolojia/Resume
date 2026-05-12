import { Component, Input, Output, EventEmitter, signal, ViewChild, ElementRef, HostListener, AfterViewInit, inject, Inject } from '@angular/core';
import { ResumeService, ResumeElement, ResumeData, Experience, Education, Referee, Skill } from '../../services/resume';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './canvas.component.html',
  styles: [`
    @reference "tailwindcss";
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .a4-paper {
      width: 794px;
      height: 1123px;
      position: relative;
      background: white;
      margin: 0;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class CanvasComponent implements AfterViewInit {
 @Input() resume: ResumeData = {
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


  @Output() resumeChange = new EventEmitter<ResumeData>();

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  @ViewChild('resumeCanvas', { static: false }) canvasRef!: ElementRef<HTMLDivElement>;

    constructor(
    // public resumeService: ResumeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private readonly API_BASE = 'http://localhost:8080';
async downloadPdf() {
  if (!isPlatformBrowser(this.platformId)) {
    return; // SSR: skip
  }

  const canvas = this.canvasRef.nativeElement;
  if (!canvas) {
    // Replace alert with Angular Material snackbar for SSR safety
    console.error('Canvas not found');
    return;
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Resume</title>
    <style>
      body { font-family: ${this.resumeService.resumeState().aesthetics.fontFamily}, sans-serif; }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Open+Sans&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body>${canvas.outerHTML}</body>
  </html>`;

  const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('jwt') : null;

  const resp = await this.resumeService.exportHtml(html, token);

  if (isPlatformBrowser(this.platformId)) {
    const link = document.createElement('a');
    link.href = `${this.API_BASE}${resp.pdfUrl}`;
    link.download = 'resume.pdf';
    link.click();
}


}


  protected Math = Math;

  // Signals
  scale = signal(100);
  template = signal<string>('minimal');
  activeElementId = signal<string | null>(null);
  qrCodeUrl = signal<string>('');

  public resumeService = inject(ResumeService);

  @HostListener('mousedown', ['$event'])
  onCanvasMouseDown(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overflow-auto')) {
      this.resumeService.clearSelection();
    }
  }

  updateResume() {
    this.resumeChange.emit(this.resume);
  }

  private originalPositions: Record<string, { x: number; y: number }> = {};
  
  private isInsideCanvas(x: number, y: number, width: number, height: number): boolean {
    const paperWidth = 794;
    const paperHeight = (this.resume.pageCount || 1) * 1123;
    return !(x < 0 || y < 0 || x + width > paperWidth || y + height > paperHeight);
  }

  getActiveElement() {
    return this.resume.aesthetics.elements.find(
      (el: { id: string }) => el.id === this.activeElementId(),
    );
  }

  // Zoom controls
  zoomIn() {
    this.scale.update((s) => Math.min(s + 10, 200));
  }
  zoomOut() {
    this.scale.update((s) => Math.max(s - 10, 10));
  }

toggleFullscreen() {
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById("resume-canvas");
      if (el?.requestFullscreen) {
        el.requestFullscreen();
      }
    }
  }
  
  // Drag & selection
  onDragEnd(event: CdkDragEnd, el: ResumeElement) {
  const { x, y } = event.source.getFreeDragPosition();

  // Absolute positions
  const newX = x;
  const newY = y;

  // Check if inside canvas
  if (this.isInsideCanvas(newX, newY, el.width, el.height)) {
    el.x = newX;
    el.y = newY;
  } else {
    // Revert to original position if dragged outside
    const orig = this.originalPositions[el.id];
    if (orig) {
      el.x = orig.x;
      el.y = orig.y;
    }
  }

  const rect = (event.source.element.nativeElement as HTMLElement).getBoundingClientRect();
  el.width = rect.width;
  el.height = rect.height;

  // Clear transform so bindings take over
  event.source.reset();

  // Commit update
  this.updateResume();
}


  onExperienceDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'experienceStyle');
  }

  onEducationDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'educationStyle');
  }

  onSkillsDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'skillsStyle');
  }

  onRefereeDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'refereeStyle');
  }

  onQRDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'qrStyle');
  }

  onSummaryDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'summaryStyle');
  }

  
  

  private handleBlockDragEnd(
  event: CdkDragEnd,
  styleKey: keyof ResumeData
) {
  const style = (this.resume as any)[styleKey];
  if (style) {
    const { x, y } = event.source.getFreeDragPosition();

    const width = style.width || 100;   // fallback if not set
    const height = style.height || 40;  // fallback if not set

    if (this.isInsideCanvas(x, y, width, height)) {
      style.x = x;
      style.y = y;
    } else {
      const orig = this.originalPositions[styleKey as string];
      if (orig) {
        style.x = orig.x;
        style.y = orig.y;
      }
    }

    const rect = (event.source.element.nativeElement as HTMLElement).getBoundingClientRect();
  style.width = rect.width;
  style.height = rect.height;
    

    event.source.reset();
    this.updateResume();
  }
}




  toggleSelection(id: string, event: MouseEvent) {
    event.stopPropagation();
    // Always treat as multi-selection toggle as requested by "allow multiple selections and unselect by clicking"
    this.resumeService.toggleSelection(id, true);
    this.activeElementId.set(id);
    this.updateResume();
  }

  ngAfterViewInit() {
    this.autoScale();
  }

  @HostListener("window:resize")
   onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.autoScale();
    }
  }

  autoScale() {
    if (this.canvasContainer) {
      const containerWidth = this.canvasContainer.nativeElement.offsetWidth - 160;
      const paperWidth = 794; 
      const ratio = containerWidth / paperWidth;
      this.scale.set(Math.floor(ratio * 100));
    }
  }

  onDragStart(el: ResumeElement) {
    this.originalPositions[el.id] = { x: el.x, y: el.y };
  }

  onMetadataDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'metadataStyle');
  }

  onNameDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'nameStyle');
  }

  onEmailDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'emailStyle');
  }

  onPhoneDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'phoneStyle');
  }

  onExperienceItemDragEnd(event: CdkDragEnd, el: Experience) {
    const { x, y } = event.source.getFreeDragPosition();
    const width = el.width || 200;
    const height = el .height || 40;

    if (this.isInsideCanvas(x, y, width, height)) {
      el.x = x;
      el.y = y;
    } else {
      const orig = this.originalPositions[el.id];
      if (orig) {
        el.x = orig.x;
        el .y = orig.y;
      }
    }

     const rect = (event.source.element.nativeElement as HTMLElement).getBoundingClientRect();
     el.width = rect.width;
     el.height = rect.height;

    event.source.reset();
    this.updateResume();
  }



  onEducationItemDragEnd(event: CdkDragEnd, el: Education) {
    const { x, y } = event.source.getFreeDragPosition();
    const width = el.width || 200;
    const height = el.height || 40;

    if (this.isInsideCanvas(x, y, width, height)) {
      el.x = x;
      el.y = y;
    } else {
      const orig = this.originalPositions[el.id];
      if (orig) {
        el.x = orig.x;
        el.y = orig.y;
      }
    }

     const rect = (event.source.element.nativeElement as HTMLElement).getBoundingClientRect();
     el.width = rect.width;
     el.height = rect.height;

    event.source.reset();
    this.updateResume();
  }

  onRefereeItemDragEnd(event: CdkDragEnd, el: Referee) {
    const { x, y } = event.source.getFreeDragPosition();
    const width = el.width || 200;
    const height = el.height || 40;

    if (this.isInsideCanvas(x, y, width, height)) {
      el.x = x;
      el.y = y;
    } else {
      const orig = this.originalPositions[el.id];
      if (orig) {
        el.x = orig.x;
        el.y = orig.y;
      }
    }

    const rect = (event.source.element.nativeElement as HTMLElement).getBoundingClientRect();
     el.width = rect.width;
     el.height = rect.height;

    event.source.reset();
    this.updateResume();
  }

startResize(event: MouseEvent, el: ResumeElement) {
  event.preventDefault();

  // Only allow resize if CTRL is held
  if (!this.isCtrlResizing) return;

  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = el.width;
  const startHeight = el.height;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;

    // Stretch horizontally or vertically depending on which edge is grabbed
    if (event.target instanceof HTMLElement && event.target.classList.contains('resize-right')) {
      el.width = startWidth + dx;
    } else if (event.target instanceof HTMLElement && event.target.classList.contains('resize-bottom')) {
      el.height = startHeight + dy;
    }

    this.updateResume();
  };

  if (isPlatformBrowser(this.platformId)) {
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
}



  onSkillItemDragEnd(event: CdkDragEnd, el: Skill) {
    const { x, y } = event.source.getFreeDragPosition();
    const width = el.width || 200;
    const height = el.height || 40;

    if (this.isInsideCanvas(x, y, width, height)) {
      el.x = x;
      el.y = y;
    } else {
      const orig = this.originalPositions[el.id];
      if (orig) {
        el.x = orig.x;
        el.y = orig.y;
      }
    }

    const rect = (event.source.element.nativeElement as HTMLElement).getBoundingClientRect();
     el.width = rect.width;
     el.height = rect.height;


    event.source.reset();
    this.updateResume();
  }

  private ensureBlockStyle(block: keyof ResumeData) {
  const target = (this.resume as any)[block];
  if (target && !target.style) {
    target.style = { fontSize: 12, color: '#000000', textAlign: 'left' };
  }
  return target;
}

  ngOnInit() {
  console.log('Resume state:', this.resumeService.resumeState());
}


  onExperienceHeaderBlur(event: any) {
  const block = this.ensureBlockStyle('experienceStyle');
  if (!block) return;
  block.style.color = (event.target as any).style?.color || '#000000';
  this.updateResume();
}

onEducationHeaderBlur(event: any) {
  const block = this.ensureBlockStyle('educationStyle');
  if (!block) return;
  block.style.color = (event.target as any).style?.color || '#000000';
  this.updateResume();
}

onSkillsHeaderBlur(event: any) {
  const block = this.ensureBlockStyle('skillsStyle');
  if (!block) return;
  block.style.color = (event.target as any).style?.color || '#000000';
  this.updateResume();
}

onRefereeHeaderBlur(event: any) {
  const block = this.ensureBlockStyle('refereeStyle');
  if (!block) return;
  block.style.color = (event.target as any).style?.color || '#000000';
  this.updateResume();
}




  moveForward(el: ResumeElement) {
    const idx = this.resume.aesthetics.elements.indexOf(el);
    if (idx < this.resume.aesthetics.elements.length - 1) {
      this.resume.aesthetics.elements.splice(idx, 1);
      this.resume.aesthetics.elements.splice(idx + 1, 0, el);
      this.updateResume();
    }
  }

  moveBackward(el: ResumeElement) {
    const idx = this.resume.aesthetics.elements.indexOf(el);
    if (idx > 0) {
      this.resume.aesthetics.elements.splice(idx, 1);
      this.resume.aesthetics.elements.splice(idx - 1, 0, el);
      this.updateResume();
    }
  }

  convertToUnit(value: number, unit?: string): string {
    if (!unit || unit === "px") return value + "px";
    return value + unit;
  }

  getTransform(el: ResumeElement): string {
    let transform = "";
    if (el.rotation) transform += ` rotate(${el.rotation}deg)`;
    return transform || "none";
  }

  getImageMirror(el: ResumeElement): string {
    let mirror = "";
    if (el.mirror?.horizontal) mirror += " scaleX(-1)";
    if (el.mirror?.vertical) mirror += " scaleY(-1)";
    return mirror || "none";
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'image': return 'image';
      case 'line': return 'horizontal_rule';
      case 'box': return 'crop_square';
      case 'text': return 'title';
      default: return 'help_outline';
    }
  }
private isCtrlResizing = false;
  
@HostListener('window:keydown', ['$event'])
onKeyDown(event: KeyboardEvent) {
if (isPlatformBrowser(this.platformId)) {
  if (event.ctrlKey) {
    this.isCtrlResizing = true;
  }

  // ALT + Up/Down → move canvas vertically
  if (event.altKey) {
    const container = this.canvasContainer?.nativeElement;
    if (!container) return;

    const step = 3;
    switch (event.key) {
      case 'ArrowUp':
        container.scrollTop -= step;
        event.preventDefault();
        break;
      case 'ArrowDown':
        container.scrollTop += step;
        event.preventDefault();
        break;
    }
    return;
  }

  // CTRL + Arrow → scroll canvas
  if (event.ctrlKey) {
    const container = this.canvasContainer?.nativeElement;
    if (!container) return;

    const scrollStep = 7;
    switch (event.key) {
      case 'ArrowUp':    container.scrollTop -= scrollStep; break;
      case 'ArrowDown':  container.scrollTop += scrollStep; break;
      case 'ArrowLeft':  container.scrollLeft -= scrollStep; break;
      case 'ArrowRight': container.scrollLeft += scrollStep; break;
    }
    event.preventDefault();
    return;
  }

  // Normal Arrow keys → only move elements if canvas is NOT selected
  if (!this.canvasSelected) {
    const target = this.getActiveTarget();
    if (!target) return;

    const step = event.shiftKey ? 5 : 1;
    switch (event.key) {
      case 'ArrowUp':    target.y -= step; break;
      case 'ArrowDown':  target.y += step; break;
      case 'ArrowLeft':  target.x -= step; break;
      case 'ArrowRight': target.x += step; break;
    }

    if (this.isInsideCanvas(target.x, target.y, target.width || 100, target.height || 40)) {
      this.updateResume();
    }
  }
}
}



private canvasSelected = false;

@HostListener('mousedown', ['$event'])
onMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement;
  // If clicked outside the paper (resume-canvas), mark canvas as selected
  if (!target.closest('#resume-canvas')) {
    this.canvasSelected = true;
    this.resumeService.clearSelection();
  } else {
    this.canvasSelected = false;
  }
}


@HostListener('window:keyup', ['$event'])
onKeyUp(event: KeyboardEvent) {
  if (isPlatformBrowser(this.platformId)) {
  if (!event.ctrlKey) {
    this.isCtrlResizing = false;
  }
}
}

  private getActiveTarget(): any {
  const id = this.activeElementId();
  if (!id) return null;

  // First check free elements
  const el = this.resume.aesthetics.elements.find((e: ResumeElement) => e.id === id);
  if (el) return el;

  // Then check block styles by key name
  const blockKeys: (keyof ResumeData)[] = [
    'metadataStyle', 'experienceStyle', 'educationStyle',
    'skillsStyle', 'refereeStyle', 'qrStyle',
    'nameStyle', 'emailStyle', 'phoneStyle', 'summaryStyle'
  ];
  for (const key of blockKeys) {
    if (id === key) return (this.resume as any)[key];
  }

  const collections = ['experience','education','skills','referees'] as const;
  for (const col of collections) {
    const item = (this.resume as any)[col].find((c: any) => c.id === id);
    if (item) return item;
  }



  return null;
}




}
