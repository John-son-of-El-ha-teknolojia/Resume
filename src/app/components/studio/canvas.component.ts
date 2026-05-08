import { Component, Input, Output, EventEmitter, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ResumeService, ResumeElement, ResumeData } from '../../services/resume';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';   // ✅ import CommonModule

@Component({
  selector: 'app-canvas',
  standalone: true,   // ✅ mark as standalone
  imports: [CommonModule],   // ✅ add CommonModule so *ngIf, *ngFor work
  templateUrl: './canvas.component.html',
  styleUrls: ['./studio.component.css']
})
export class CanvasComponent {
  @Input() resume!: ResumeData;
  @Output() resumeChange = new EventEmitter<ResumeData>();

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  // Signals
  scale = signal(100);
  template = signal<string>('minimal');
  activeElementId = signal<string | null>(null);
  selectedElementIds = new Set<string>();
  qrCodeUrl = signal<string>('');

  constructor(public resumeService: ResumeService) {}

  updateResume() {
    this.resumeChange.emit(this.resume);
  }

   private originalPositions: Record<string, { x: number; y: number }> = {};
   private isInsideCanvas(x: number, y: number, width: number, height: number): boolean {
  const canvas = document.getElementById('resume-canvas');
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  return !(x < 0 || y < 0 || x > rect.width - width || y > rect.height - height);
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

  // If outside canvas bounds → reset
  if (!rect || x < 0 || y < 0 || x > rect.width - el.width || y > rect.height - el.height) {
    // Reset to original
    const orig = this.originalPositions[el.id];
    if (orig) {
      el.x = orig.x;
      el.y = orig.y;
    }
  } else {
    el.x = x;
    el.y = y;
  }

  this.updateResume();
  }


  onExperienceDragEnd(event: CdkDragEnd) {
    if (this.resume.experienceStyle) {
      const { x, y } = event.source.getFreeDragPosition();
      const width = 400;
      const height = 200;

      if (this.isInsideCanvas(x, y, width, height)) {
        this.resume.experienceStyle.x = x;
        this.resume.experienceStyle.y = y;
      } else {
        event.source.reset();
      }

      this.updateResume();
      console.log("Experience position updated:", this.resume.experienceStyle.x, this.resume.experienceStyle.y);
    }
  }


  
  toggleSelection(id: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.selectedElementIds.has(id)) {
      this.selectedElementIds.delete(id); // unselect if clicked again
    } else {
      this.selectedElementIds.add(id);    // select if not already
    }
    this.updateResume();
  }


    ngAfterViewInit() {
    this.autoScale();
    // this.generateQRCode();
  }

  @HostListener("window:resize")
  onResize() {
    this.autoScale();
  }

  autoScale() {
    if (this.canvasContainer) {
      const containerWidth =
        this.canvasContainer.nativeElement.offsetWidth - 160;
      const paperWidth = 210 * 3.78; // approximation for mm to px at 96dpi
      const ratio = containerWidth / paperWidth;
      this.scale.set(Math.floor(ratio * 100));
    }
  }


  onDragStart(el: ResumeElement){
    this.originalPositions[el.id] = { x: el.x, y: el.y };
  }




  onMetadataDragEnd(event: CdkDragEnd) {
    if (this.resume.metadataStyle) {
      const { x, y } = event.source.getFreeDragPosition();
      const width = this.resume.metadataStyle.width || 200;
      const height = 40;

      if (this.isInsideCanvas(x, y, width, height)) {
        this.resume.metadataStyle.x = x;
        this.resume.metadataStyle.y = y;
      } else {
        // Snap back to last valid position
        event.source.reset();
      }

      this.updateResume();
      console.log("Metadata position updated:", this.resume.metadataStyle.x, this.resume.metadataStyle.y);
    }
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

  // Helpers
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
