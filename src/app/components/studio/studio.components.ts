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
import { PropertiesComponent } from "./properties.component";
import { SidebarComponent } from "./sidebar.component";
import { CanvasComponent } from "./canvas.component";




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
    CanvasComponent,
  SidebarComponent,
  PropertiesComponent
  ],
  templateUrl: "./studio.component.html",
  styleUrls: ["./studio.component.css"],
})

export class StudioComponent  {
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
  




  onImageTrigger(input: HTMLInputElement) {
    input.click();
  }


updateResume(updated?: any) {
  if (updated) {
  this.resume = { ...this.resume, ...updated };
}
  this.resumeService.updateResume(this.resume);
  this.resumeService.commit();
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

  



 

  

  // selectedElementIds = new Set<string>();


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

 
  toggleSidebarPosition() {
    this.sidebarPosition.update((p) => (p === "left" ? "right" : "left"));
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
