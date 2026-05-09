import { Component, Input, Output, EventEmitter, signal, ViewChild, ElementRef, HostListener, AfterViewInit, inject } from '@angular/core';
import { ResumeService, ResumeElement, ResumeData, Experience, Education, Referee, Skill } from '../../services/resume';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  @Input() resume!: ResumeData;
  @Output() resumeChange = new EventEmitter<ResumeData>();

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

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
    const el = document.getElementById("resume-canvas");
    if (el?.requestFullscreen) el.requestFullscreen();
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
    this.autoScale();
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
}
