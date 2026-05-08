import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { ResumeService, ResumeElement } from '../../services/resume';
import * as QRCode from "qrcode";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() resume: any;
  @Output() resumeChange = new EventEmitter<any>();

  activeSectionId = signal<string | null>(null);
  activeElementId = signal<string | null>(null);
  isMapping = signal(false);
  qrCodeUrl = signal("");

  constructor(public resumeService: ResumeService) {}

  updateResume() {
    this.resumeChange.emit(this.resume);
  }

  // Metadata polish
 
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

  // Experience
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
    this.resume.experience = this.resume.experience.filter((e: { id: string }) => e.id !== id);
    this.updateResume();
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

  // Referees

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
    this.resume.referees = this.resume.referees.filter((r: { id: string }) => r.id !== id);
    this.updateResume();
  }


  //skills
    addSkill() {
    this.resume.skills = [
      ...(this.resume.skills || []),
      { name: "New Skill", level: 50, displayMode: "horizontal_bar" },
    ];
    this.updateResume();
  }

  removeSkill(name: string) {
    this.resume.skills = this.resume.skills.filter((s: { name: string }) => s.name !== name);
    this.updateResume();
  }

//QRCode

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


  // Layers
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
    (el: ResumeElement) => el.id !== id
    );
    this.updateResume();
    if (this.activeElementId() === id) this.activeElementId.set(null);
  }
  
    onImageTrigger(input: HTMLInputElement) {
    input.click();
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

}
