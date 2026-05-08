import { Component, Input, Output, EventEmitter, signal, ViewChild, ElementRef, HostListener, AfterViewInit, inject } from '@angular/core';
import { ResumeService, ResumeElement, ResumeData } from '../../services/resume';
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
    const canvas = document.getElementById('resume-canvas');
    const rect = canvas?.getBoundingClientRect();
    const { x, y } = event.source.getFreeDragPosition();
    const newX = el.x + x;
    const newY = el.y + y;

    if (!rect || !this.isInsideCanvas(newX, newY, el.width, el.height)) {
      const orig = this.originalPositions[el.id];
      if (orig) {
        el.x = orig.x;
        el.y = orig.y;
      }
    } else {
      el.x = newX;
      el.y = newY;
    }

    event.source.reset();
    this.updateResume();
  }

  onExperienceDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'experienceStyle', 400, 200);
  }

  onEducationDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'educationStyle', 400, 200);
  }

  onSkillsDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'skillsStyle', 400, 150);
  }

  onRefereeDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'refereeStyle', 400, 150);
  }

  onQRDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'qrStyle', 100, 100);
  }

  onSummaryDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'summaryStyle', 800, 100);
  }

  private handleBlockDragEnd(event: CdkDragEnd, styleKey: keyof ResumeData, width: number, height: number) {
    const style = (this.resume as any)[styleKey];
    if (style) {
      const { x, y } = event.source.getFreeDragPosition();
      const newX = (style.x || 0) + x;
      const newY = (style.y || 0) + y;

      if (this.isInsideCanvas(newX, newY, width, height)) {
        style.x = newX;
        style.y = newY;
      } else {
        event.source.reset();
      }
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
    this.handleBlockDragEnd(event, 'metadataStyle', this.resume.metadataStyle?.width || 200, 40);
  }

  onNameDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'nameStyle', this.resume.nameStyle?.width || 400, 60);
  }

  onEmailDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'emailStyle', this.resume.emailStyle?.width || 400, 30);
  }

  onPhoneDragEnd(event: CdkDragEnd) {
    this.handleBlockDragEnd(event, 'phoneStyle', this.resume.phoneStyle?.width || 400, 30);
  }

  onExperienceItemDragEnd(event: CdkDragEnd, item: any) {
    const { x, y } = event.source.getFreeDragPosition();
    item.x = (item.x || 0) + x;
    item.y = (item.y || 0) + y;
    event.source.reset();
    this.updateResume();
  }

  onEducationItemDragEnd(event: CdkDragEnd, item: any) {
    const { x, y } = event.source.getFreeDragPosition();
    item.x = (item.x || 0) + x;
    item.y = (item.y || 0) + y;
    event.source.reset();
    this.updateResume();
  }

  onRefereeItemDragEnd(event: CdkDragEnd, item: any) {
    const { x, y } = event.source.getFreeDragPosition();
    item.x = (item.x || 0) + x;
    item.y = (item.y || 0) + y;
    event.source.reset();
    this.updateResume();
  }

  onSkillItemDragEnd(event: CdkDragEnd, item: any) {
    const { x, y } = event.source.getFreeDragPosition();
    item.x = (item.x || 0) + x;
    item.y = (item.y || 0) + y;
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
