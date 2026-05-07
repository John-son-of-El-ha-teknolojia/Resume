import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTabsModule } from "@angular/material/tabs";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatDialog } from "@angular/material/dialog";
import { MatSliderModule } from "@angular/material/slider";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DragDropModule, CdkDragEnd } from "@angular/cdk/drag-drop";
import { Router } from "@angular/router";
import {
  ResumeService,
  ResumeSection,
  ResumeElement,
} from "../../services/resume";
import { PaymentDialogComponent } from "../payment/payment";
import * as QRCode from "qrcode";



const MOOD_PRESETS: Record<string, any> = {
  executive: {
    fontFamily: "Playfair Display",
    primaryColor: "#0f172a",
    backgroundColor: "#ffffff",
    fontSize: 14,
    metadataStyle: { border: "solid", padding: 20, x: 0, y: 0 },
  },
  creative: {
    fontFamily: "Outfit",
    primaryColor: "#4f46e5",
    backgroundColor: "#f8fafc",
    fontSize: 15,
    metadataStyle: { border: "dashed", padding: 30, x: 5, y: -10 },
  },
  startup: {
    fontFamily: "Inter",
    primaryColor: "#10b981",
    backgroundColor: "#ffffff",
    fontSize: 13,
    metadataStyle: { border: "none", padding: 0, x: 0, y: 0 },
  },
};

@Component({
  selector: "app-studio",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    DragDropModule,
  ],
  templateUrl: "./studio.component.html",
  styleUrls: ["./studio.component.css"],
})

export class StudioComponent implements AfterViewInit {
  public resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  resume = this.resumeService.resumeState();
  template = signal<string>("minimal");
  scale = signal(75);
  sidebarPosition = signal<"left" | "right">("left");
  activeSectionId = signal<string | null>(null);
  activeElementId = signal<string | null>(null);
  enhancingSections = signal(new Set<string>());
  isPremium = this.resumeService.isPremium;

  constructor() {
  this.resume.metadataStyle = this.resume.metadataStyle || { isLocked: false, isVisible: true, x: 0, y: 0, width: 300};
  this.resume.experienceStyle = this.resume.experienceStyle || { isLocked: false, isVisible: true, x: 0, y: 0 };
  this.resume.refereeStyle = this.resume.refereeStyle || { isLocked: false, isVisible: true, x: 0, y: 0 };
  this.resume.skillsStyle = this.resume.skillsStyle || { isLocked: false, isVisible: true, x: 0, y: 0 };
  this.resume.qrStyle = this.resume.qrStyle || { isLocked: false, isVisible: true, x: 0, y: 0, width: 120, height: 120 };
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
    "Syne",
    "Clash Display",
  ];

  @ViewChild("canvasContainer") canvasContainer!: ElementRef;

  isAnalyzing = signal(false);
  isMapping = signal(false);
  coachReport: { atsScore: number; suggestions: string[] } | null = null;
  jobUrl = "";
  qrCodeUrl = signal("");

  backToDashboard() {
    this.router.navigate(["/dashboard"]);
  }

  goToViewer() {
    this.router.navigate(["/viewer"]);
  }

  onModelChange(event: any) {
    this.resumeService.setModel(event.target.value);
  }

  onImageTrigger(input: HTMLInputElement) {
    input.click();
  }

  ngAfterViewInit() {
    this.autoScale();
    this.generateQRCode();
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

  updateResume() {
    if (this.resumeService.isPaid()) {
      this.resumeService.updateResume(this.resume);
      console.log("Autosave: Intelligence sync verified.");
    }
    this.resumeService.commit();
    this.generateQRCode();
  }

  calculateDuration(exp: {
    startDate: string;
    endDate: string;
    current: boolean;
  }): string {
    if (!exp.startDate) return "0 months";
    const start = new Date(exp.startDate);
    const end = exp.current
      ? new Date()
      : exp.endDate
        ? new Date(exp.endDate)
        : new Date();

    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (months < 0) months = 0;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    let result = "";
    if (years > 0) result += `${years} yr${years > 1 ? "s" : ""} `;
    if (remainingMonths > 0)
      result += `${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
    return result || "Less than a month";
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
    this.resume.experience = this.resume.experience.filter((e) => e.id !== id);
    this.updateResume();
  }

  addReferee() {
    const newRef = {
      id: Math.random().toString(36).substring(7),
      name: "",
      email: "",
      phone: "",
      address: "",
    };
    this.resume.referees = [...(this.resume.referees || []), newRef];
    this.updateResume();
  }

  removeReferee(id: string) {
    this.resume.referees = this.resume.referees.filter((r) => r.id !== id);
    this.updateResume();
  }
 
  
  async runCoachAnalysis() {
  this.isAnalyzing.set(true);
  try {
    const report = await this.resumeService.runCoachAnalysis(this.resume);
    this.coachReport = report;
  } catch (e) {
    console.error("Coach analysis failed", e);
  } finally {
    this.isAnalyzing.set(false);
  }
}




  async polishSummary() {
  if (!this.resume.summary) return;
  this.isMapping.set(true);
  try {
    const response = await this.resumeService.polishSummary(this.resume.summary);
    this.resume.summary = response.result;
    this.updateResume();
  } catch (e) {
    console.error("Polish summary failed", e);
  } finally {
    this.isMapping.set(false);
  }
}


  async suggestExperienceDescription(index: number) {
  const exp = this.resume.experience[index];
  try {
    const response = await this.resumeService.suggestExperienceDescription(
      exp.title,
      exp.company,
      exp.content
    );
    // response is { result: string }, so use response.result
    exp.content = response.result;
    this.updateResume();
  } catch (e) {
    console.error("Suggest experience failed", e);
  }
}

  async mapToJob() {
    if (!this.jobUrl) return;
    this.isMapping.set(true);
    try {
      const updatedData = await this.resumeService.mapToJob(this.resume, this.jobUrl);
      // Merge updated resume data returned by backend
      this.resume = { ...this.resume, ...updatedData };
      this.updateResume();
    } catch (e) {
      console.error("Job mapping failed", e);
    } finally {
      this.isMapping.set(false);
    }
  }


  addSkill() {
    this.resume.skills = [
      ...(this.resume.skills || []),
      { name: "New Skill", level: 50, displayMode: "horizontal_bar" },
    ];
    this.updateResume();
  }

  removeSkill(name: string) {
    this.resume.skills = this.resume.skills.filter((s) => s.name !== name);
    this.updateResume();
  }



   async generateQRCode() {
    const url =
      this.resume.skillUrl ||
      this.resume.website ||
      `https://linkedin.com/in/${this.resume.name.replace(/\s/g, "").toLowerCase()}`;
    try {
      this.qrCodeUrl.set(await QRCode.toDataURL(url));
    } catch (err) {
      console.error("QR Generation failed:", err);
    }
  }

  applyMood(moodKey: string) {
    const preset = MOOD_PRESETS[moodKey];
    if (preset) {
      this.resume.aesthetics.fontFamily = preset.fontFamily;
      this.resume.aesthetics.primaryColor = preset.primaryColor;
      this.resume.aesthetics.backgroundColor = preset.backgroundColor;
      this.resume.aesthetics.fontSize = preset.fontSize;
      this.resume.metadataStyle = { ...preset.metadataStyle };
      this.updateResume();
    }
  }

  undo() {
    this.resumeService.undo();
    this.resume = this.resumeService.resumeState();
  }

  redo() {
    this.resumeService.redo();
    this.resume = this.resumeService.resumeState();
  }

  saveToCloud() {
    // Mock save
    console.log("Syncing blueprint to edge nodes...", this.resume);
  }

  addSection() {
    this.resumeService.addSection();
    this.resume = this.resumeService.resumeState();
    const last = this.resume.sections[this.resume.sections.length - 1];
    if (last) this.activeSectionId.set(last.id);
    this.activeElementId.set(null);
  }

  removeSection(id: string) {
    this.resumeService.removeSection(id);
    this.resume = this.resumeService.resumeState();
    if (this.activeSectionId() === id) this.activeSectionId.set(null);
  }

  getIconForType(type: string): string {
    switch (type) {
      case "image":
        return "image";
      case "line":
        return "horizontal_rule";
      case "box":
        return "crop_square";
      case "text":
        return "title";
      default:
        return "help_outline";
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

  addElement(type: "image" | "line" | "box" | "text") {
    const newElement: ResumeElement = {
      id: Math.random().toString(36).substring(7),
      type,
      x: 300,
      y: 300,
      width: type === "line" ? 400 : 200,
      height: type === "line" ? 2 : type === "text" ? 100 : 200,
      rotation: 0,
      isLocked: false,
      isVisible: true,
      unit: "px",
      content: type === "text" ? "Double click to edit text..." : undefined,
      url:
        type === "image"
          ? "https://picsum.photos/seed/" + Math.random() + "/400/400"
          : undefined,
      style: {
        backgroundColor:
          type === "line"
            ? "#09090b"
            : type === "box"
              ? "#f4f4f5"
              : "transparent",
        borderStyle: "solid",
        borderRadius: 0,
        borderWidth: 1,
        borderColor: "#e4e4e7",
        fontSize: 14,
        color: "#09090b",
        fontWeight: "400",
        textAlign: "left",
        opacity: 1,
        thickness: 2
      },
    };
    this.resume.aesthetics.elements.unshift(newElement); // Add to top of stack
    this.updateResume();
    this.activeElementId.set(newElement.id);
    this.activeSectionId.set(null);
  }

  removeElement(id: string) {
    this.resume.aesthetics.elements = this.resume.aesthetics.elements.filter(
      (el) => el.id !== id,
    );
    this.updateResume();
    if (this.activeElementId() === id) this.activeElementId.set(null);
  }

  getActiveElement() {
    return this.resume.aesthetics.elements.find(
      (el) => el.id === this.activeElementId(),
    );
  }

  private isInsideCanvas(x: number, y: number, width: number, height: number): boolean {
  const canvas = document.getElementById('resume-canvas');
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  return !(x < 0 || y < 0 || x > rect.width - width || y > rect.height - height);
}


  private originalPositions: Record<string, { x: number; y: number }> = {};

  onDragStart(el: ResumeElement){
    this.originalPositions[el.id] = { x: el.x, y: el.y };
  }



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


  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const url = e.target.result;
        const newElement: ResumeElement = {
          id: Math.random().toString(36).substring(7),
          type: "image",
          x: 200,
          y: 200,
          width: 200,
          height: 200,
          rotation: 0,
          isLocked: false,
          isVisible: true,
          unit: "px",
          mirror: { horizontal: false, vertical: false },
          url: url,
          style: {},
        };
        this.resume.aesthetics.elements.unshift(newElement);
        this.updateResume();
        this.activeElementId.set(newElement.id);
        this.activeSectionId.set(null);
      };
      reader.readAsDataURL(file);
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

  selectedElementIds = new Set<string>();

  toggleSelection(id: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.selectedElementIds.has(id)) {
      this.selectedElementIds.delete(id); // unselect if clicked again
    } else {
      this.selectedElementIds.add(id);    // select if not already
    }
    this.updateResume();
  }


  alignSelected(direction: 'left' | 'center' | 'right') {
  const selected = this.resume.aesthetics.elements.filter(el => this.selectedElementIds.has(el.id));
  if (selected.length < 2) return;

  if (direction === 'left') {
    const minX = Math.min(...selected.map(el => el.x));
    selected.forEach(el => el.x = minX);
  }
  if (direction === 'center') {
    const avgX = selected.reduce((sum, el) => sum + el.x, 0) / selected.length;
    selected.forEach(el => el.x = avgX);
  }
  if (direction === 'right') {
    const maxX = Math.max(...selected.map(el => el.x + el.width));
    selected.forEach(el => el.x = maxX - el.width);
  }

  this.updateResume();
}

alignVertical(direction: 'top' | 'middle' | 'bottom') {
  const selected = this.resume.aesthetics.elements.filter(el => this.selectedElementIds.has(el.id));
  if (selected.length < 2) return;

  if (direction === 'top') {
    const minY = Math.min(...selected.map(el => el.y));
    selected.forEach(el => el.y = minY);
  }
  if (direction === 'middle') {
    const avgY = selected.reduce((sum, el) => sum + el.y, 0) / selected.length;
    selected.forEach(el => el.y = avgY);
  }
  if (direction === 'bottom') {
    const maxY = Math.max(...selected.map(el => el.y + el.height));
    selected.forEach(el => el.y = maxY - el.height);
  }

  this.updateResume();
}


  distribute(direction: 'horizontal' | 'vertical') {
  const selected = this.resume.aesthetics.elements
    .filter(el => this.selectedElementIds.has(el.id))
    .sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);

  if (selected.length < 3) return;

  if (direction === 'horizontal') {
    const minX = selected[0].x;
    const maxX = selected[selected.length - 1].x;
    const step = (maxX - minX) / (selected.length - 1);
    selected.forEach((el, i) => el.x = minX + i * step);
  } else {
    const minY = selected[0].y;
    const maxY = selected[selected.length - 1].y;
    const step = (maxY - minY) / (selected.length - 1);
    selected.forEach((el, i) => el.y = minY + i * step);
  }

  this.updateResume();
}


  async enhanceSection(section: ResumeSection) {
    this.enhancingSections.update((s) => {
      s.add(section.id);
      return new Set(s);
    });

    const improved = await this.resumeService.enhanceText(section.content);
    section.content = improved;
    this.updateResume();

    this.enhancingSections.update((s) => {
      s.delete(section.id);
      return new Set(s);
    });
  }

  zoomIn() {
    this.scale.update((s) => Math.min(s + 10, 200));
  }
  zoomOut() {
    this.scale.update((s) => Math.max(s - 10, 10));
  }

  toggleSidebarPosition() {
    this.sidebarPosition.update((p) => (p === "left" ? "right" : "left"));
  }

  toggleFullscreen() {
    const el = document.getElementById("resume-canvas");
    if (el?.requestFullscreen) el.requestFullscreen();
  }

  async exportPdf() {
    const res = await this.resumeService.checkEligibility();
    if (res.canDownload) {
      this.resumeService.downloadPdf();
    } else {
      this.dialog.open(PaymentDialogComponent, { width: "500px" });
    }
  }

  share() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Studio link replicated. Copied to clipboard.");
  }

  restoreDefaults() {
    if (confirm("Reset document to initial blueprint? (Irreversible)")) {
      // Implementation for reset
    }
  }

  canvasContent: string | null = null;

  ngOnInit() {
    const html = this.resumeService.templateHtml();
    if (html) {
      this.canvasContent = html;
    }
  }

}
