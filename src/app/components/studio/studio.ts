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
import {
  ResumeService,
  ResumeSection,
  ResumeElement,
} from "../../services/resume";
import { PaymentDialogComponent } from "../payment/payment";
import * as QRCode from "qrcode";
import * as d3 from "d3";

const OPENAI_API_KEY = "ADD API KEY";

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
  template: `
    <div class="h-screen w-full flex flex-col bg-[#F3F4F6] overflow-hidden font-sans select-none">
      
      <!-- TOOLBAR -->
      <header class="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 z-50 shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <mat-icon class="text-white scale-75">category</mat-icon>
          </div>
          <h1 class="text-xs font-black uppercase tracking-[0.2em] text-zinc-900">Resume Studio <span class="text-zinc-400 font-bold ml-2">v3.0</span></h1>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <button mat-icon-button (click)="undo()" matTooltip="Undo">
              <mat-icon class="scale-75 text-zinc-500">undo</mat-icon>
            </button>
            <button mat-icon-button (click)="redo()" matTooltip="Redo">
              <mat-icon class="scale-75 text-zinc-500">redo</mat-icon>
            </button>
          </div>
          
          <div class="h-6 w-px bg-zinc-200"></div>

          @if (isPremium()) {
            <button mat-button (click)="saveToCloud()" 
                    class="!text-xs !font-black !uppercase !tracking-widest !text-emerald-600 hover:!bg-emerald-50 transition-all">
              <mat-icon class="mr-1">cloud_upload</mat-icon> Save to Cloud
            </button>
          }

          <div class="h-6 w-px bg-zinc-200"></div>
          
          <button mat-flat-button (click)="exportPdf()" 
                  class="!bg-zinc-900 !text-white h-9 px-6 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-zinc-200">
            <mat-icon class="text-sm mr-2">download</mat-icon> Export Document
          </button>
          
          <button mat-stroked-button class="!border-zinc-200 !text-zinc-600 h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest" (click)="share()">
            <mat-icon class="text-sm">share</mat-icon>
          </button>
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden" [class.flex-row-reverse]="sidebarPosition() === 'right'">
        
        <!-- SIDEBAR: (Information Panels) -->
        <aside [class.border-r]="sidebarPosition() === 'left'" [class.border-l]="sidebarPosition() === 'right'" 
               class="w-[380px] bg-white border-zinc-200 flex flex-col shrink-0">
          <div class="flex-1 overflow-y-auto no-scrollbar">
            <mat-tab-group class="studio-tabs">
              <mat-tab>
                <ng-template mat-tab-label>
                  <div class="flex items-center gap-2 py-4">
                    <mat-icon class="text-sm">person</mat-icon>
                    <span class="text-[10px] uppercase font-black tracking-widest">Metadata</span>
                  </div>
                </ng-template>
                <div class="p-8 space-y-8">
                  <div class="space-y-6">
                      <div class="space-y-4 pt-8 border-t border-zinc-100">
                        <div class="flex justify-between items-center">
                          <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Identity</h3>
                        </div>
                        <div class="grid grid-cols-1 gap-5">
                          <div class="space-y-2 group">
                            <label for="fullName" class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Field: Full Name</label>
                            <input id="fullName" name="fullName" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" 
                                   [(ngModel)]="resume.name" (ngModelChange)="updateResume()">
                          </div>
                          <div class="space-y-2 group">
                            <label for="email" class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Field: Professional Email</label>
                            <input id="email" name="email" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" 
                                   [(ngModel)]="resume.email" (ngModelChange) ="updateResume()">
                          </div>
                          <div class="space-y-2 group">
                            <div class="flex justify-between items-center mb-2">
                              <label for="summary" class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Professional Abstract</label>
                              <button (click)="polishSummary()" class="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-900 text-white rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                                <mat-icon class="text-[10px] h-3 w-3">auto_awesome</mat-icon> AI Polish
                              </button>
                            </div>
                            <textarea id="summary" name="summary" rows="4" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all resize-none" 
                                   [(ngModel)]="resume.summary" (ngModelChange)="updateResume()" placeholder="Describe your career objective and key value proposition..."></textarea>
                          </div>
                        </div>
                      </div>
                      <div class="grid grid-cols-3 gap-4">
                        <div class="space-y-2 group">
                          <label for="countryCode" class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Code</label>
                          <select id="countryCode" name="countryCode" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all appearance-none"
                                  [(ngModel)]="resume.phoneCountryCode" (ngModelChange)="updateResume()">
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+254">+254 (KE)</option>
                            <option value="+91">+91 (IN)</option>
                          </select>
                        </div>
                        <div class="col-span-2 space-y-2 group">
                          <label for="phone" class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Phone Number</label>
                          <input id="phone" name="phone" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" 
                                 [(ngModel)]="resume.phone" (ngModelChange)="updateResume()">
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-6 pt-8 border-t border-zinc-100">
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Metadata Block Styling</h3>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-1">
                        <label class="text-[8px] font-black uppercase text-zinc-300">Border Style</label>
                        <select [(ngModel)]="resume.metadataStyle!.border" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-[10px] font-black uppercase">
                          <option value="none">None</option>
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                        </select>
                      </div>
                      <div class="space-y-1">
                        <label class="text-[8px] font-black uppercase text-zinc-300">Padding (px)</label>
                        <input type="number" [(ngModel)]="resume.metadataStyle!.padding" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-bold">
                      </div>
                      <div class="space-y-1">
                        <label class="text-[8px] font-black uppercase text-zinc-300">X Offset</label>
                        <input type="number" [(ngModel)]="resume.metadataStyle!.x" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-bold">
                      </div>
                      <div class="space-y-1">
                        <label for="metaWidth" class="text-[8px] font-black uppercase text-zinc-300">Block Width</label>
                        <input id="metaWidth" name="metaWidth" type="number" [(ngModel)]="resume.metadataStyle!.width" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-bold">
                      </div>
                      <div class="space-y-1">
                        <label for="metaY" class="text-[8px] font-black uppercase text-zinc-300">Y Offset</label>
                        <input id="metaY" name="metaY" type="number" [(ngModel)]="resume.metadataStyle!.y" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-bold">
                      </div>
                    </div>
                  </div>
                </mat-tab>

              <mat-tab>
                <ng-template mat-tab-label>
                  <div class="flex items-center gap-2 py-4">
                    <mat-icon class="text-sm">work</mat-icon>
                    <span class="text-[10px] uppercase font-black tracking-widest">Experience</span>
                  </div>
                </ng-template>
                <div class="p-8 space-y-10">
                   <!-- Professional Experience -->
                   <div class="space-y-6">
                     <div class="flex items-center justify-between pl-1">
                       <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Career History</h3>
                       <button mat-icon-button (click)="addExperience()" class="hover:bg-zinc-100 scale-75"><mat-icon>add</mat-icon></button>
                     </div>
                     <div class="space-y-4">
                       @for (exp of resume.experience; track exp.id; let i = $index) {
                         <div class="p-4 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] space-y-4 group">
                           <div class="flex items-center justify-between">
                             <div class="flex items-center gap-3">
                               <mat-icon class="text-zinc-300 scale-75">work_outline</mat-icon>
                               <input [(ngModel)]="exp.company" (ngModelChange)="updateResume()" placeholder="Company Name" class="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-zinc-800 focus:ring-0 placeholder:text-zinc-200">
                             </div>
                             <button mat-icon-button (click)="removeExperience(exp.id)" class="opacity-0 group-hover:opacity-100 scale-75 text-zinc-400 hover:text-red-500 transition-all"><mat-icon>delete</mat-icon></button>
                           </div>
                           <div class="space-y-1">
                             <label class="text-[8px] font-black uppercase tracking-widest text-zinc-300">Job Title</label>
                             <input [(ngModel)]="exp.title" (ngModelChange)="updateResume()" placeholder="e.g. Senior Software Engineer" class="w-full bg-white border border-zinc-100 rounded-lg p-2 text-[10px] font-bold text-zinc-800">
                           </div>
                           <div class="grid grid-cols-2 gap-3">
                             <div class="space-y-1">
                               <label class="text-[8px] font-black uppercase tracking-widest text-zinc-300">Start Date</label>
                               <input type="month" [(ngModel)]="exp.startDate" (ngModelChange)="updateResume()" class="w-full bg-white border border-zinc-100 rounded-lg p-2 text-[10px] font-bold">
                             </div>
                             <div class="space-y-1">
                               <label class="text-[8px] font-black uppercase tracking-widest text-zinc-300">End Date</label>
                               <input type="month" [(ngModel)]="exp.endDate" (ngModelChange)="updateResume()" [disabled]="exp.current" class="w-full bg-white border border-zinc-100 rounded-lg p-2 text-[10px] font-bold">
                             </div>
                           </div>
                           <div class="flex items-center gap-2">
                             <input type="checkbox" [(ngModel)]="exp.current" (ngModelChange)="updateResume()" class="rounded border-zinc-300">
                             <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">I currently work here</label>
                           </div>
                           <div class="space-y-2">
                             <div class="flex justify-between items-center px-1">
                               <label class="text-[8px] font-black uppercase tracking-widest text-zinc-300">Impact Description</label>
                               <button (click)="suggestExperienceDescription(i)" class="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-900 text-white rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                                 <mat-icon class="text-[10px] h-3 w-3">auto_awesome</mat-icon> AI Suggest
                               </button>
                             </div>
                             <textarea [(ngModel)]="exp.content" (ngModelChange)="updateResume()" rows="4" class="w-full bg-white border border-zinc-100 rounded-xl p-3 text-[10px] font-medium leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all" placeholder="Outline your key achievements..."></textarea>
                           </div>
                           <div class="p-3 bg-zinc-100/50 rounded-xl text-center">
                             <span class="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Duration: {{ calculateDuration(exp) }}</span>
                           </div>
                         </div>
                       }
                     </div>
                   </div>

                   <!-- Referees -->
                   <div class="space-y-6 pt-6 border-t border-zinc-100">
                     <div class="flex items-center justify-between pl-1">
                       <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Referees</h3>
                       <button mat-icon-button (click)="addReferee()" class="hover:bg-zinc-100 scale-75"><mat-icon>add</mat-icon></button>
                     </div>
                     <div class="space-y-4">
                       @for (ref of resume.referees; track ref.id) {
                         <div class="p-6 bg-white border border-zinc-100 shadow-sm rounded-[1.5rem] space-y-4 group">
                           <div class="flex items-center justify-between">
                             <input [(ngModel)]="ref.name" placeholder="Referee Name" class="bg-transparent border-none p-0 text-xs font-black uppercase tracking-widest focus:ring-0 placeholder:text-zinc-200">
                             <button mat-icon-button (click)="removeReferee(ref.id)" class="opacity-0 group-hover:opacity-100 scale-75 text-zinc-400 hover:text-red-500 transition-all"><mat-icon>delete</mat-icon></button>
                           </div>
                           <div class="grid grid-cols-1 gap-3">
                             <input [(ngModel)]="ref.email" placeholder="Email Address" class="w-full bg-zinc-50 border border-zinc-50 rounded-lg p-2 text-[10px] font-bold">
                             <input [(ngModel)]="ref.phone" placeholder="Phone Number" class="w-full bg-zinc-50 border border-zinc-50 rounded-lg p-2 text-[10px] font-bold">
                             <input [(ngModel)]="ref.address" placeholder="Professional Address" class="w-full bg-zinc-50 border border-zinc-50 rounded-lg p-2 text-[10px] font-bold">
                           </div>
                         </div>
                       }
                     </div>
                   </div>
                </div>
              </mat-tab>

              <mat-tab>
                <ng-template mat-tab-label>
                  <div class="flex items-center gap-2 py-4">
                    <mat-icon class="text-sm">layers</mat-icon>
                    <span class="text-[10px] uppercase font-black tracking-widest">Layers</span>
                  </div>
                </ng-template>
                <div class="p-8 space-y-6">
                   <div class="flex items-center justify-between">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Layer Stack</h3>
                     <div class="flex gap-1">
                        <button mat-icon-button (click)="addElement('box')" matTooltip="Add Box"><mat-icon class="text-sm">crop_square</mat-icon></button>
                        <button mat-icon-button (click)="addElement('text')" matTooltip="Add Text"><mat-icon class="text-sm">title</mat-icon></button>
                        <button mat-icon-button (click)="addElement('line')" matTooltip="Add Line"><mat-icon class="text-sm">horizontal_rule</mat-icon></button>
                                <button mat-icon-button (click)="onImageTrigger(imageInput)" matTooltip="Add Image"><mat-icon class="text-sm">image</mat-icon></button>
                                <input #imageInput type="file" class="hidden" (change)="onImageUpload($event)" accept="image/*">
                     </div>
                   </div>
                   
                    <div class="space-y-2">
                      @for (el of resume.aesthetics.elements; track el.id) {
                        <div class="p-3 bg-zinc-50 border border-zinc-100 rounded-xl group transition-all" 
                             [class.ring-2]="activeElementId() === el.id" [class.ring-zinc-900]="activeElementId() === el.id">
                           <div class="flex items-center justify-between cursor-pointer" (click)="activeElementId.set(el.id); activeSectionId.set(null)">
                             <div class="flex items-center gap-3">
                               <mat-icon class="text-zinc-400 scale-75">{{ getIconForType(el.type) }}</mat-icon>
                               <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-900" 
                                     [class.line-through]="!el.isVisible">{{ el.type }} {{ resume.aesthetics.elements.length - $index }}</span>
                             </div>
                             <div class="flex items-center gap-1">
                               <button mat-icon-button (click)="$event.stopPropagation(); el.isLocked = !el.isLocked; updateResume()" 
                                       class="scale-75 transition-colors" [class.text-zinc-300]="!el.isLocked" [class.text-zinc-900]="el.isLocked">
                                 <mat-icon class="text-sm">{{ el.isLocked ? 'lock' : 'lock_open' }}</mat-icon>
                               </button>
                               <button mat-icon-button (click)="$event.stopPropagation(); el.isVisible = !el.isVisible; updateResume()" 
                                       class="scale-75 transition-colors" [class.text-zinc-300]="!el.isVisible" [class.text-zinc-900]="el.isVisible">
                                 <mat-icon class="text-sm">{{ el.isVisible ? 'visibility' : 'visibility_off' }}</mat-icon>
                               </button>
                               <button mat-icon-button (click)="$event.stopPropagation(); removeElement(el.id)" class="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 scale-75 transition-all">
                                 <mat-icon class="text-sm">delete_outline</mat-icon>
                               </button>
                             </div>
                           </div>
                        </div>
                      }
                      <!-- Dynamic Layers for Metadata/Experience -->
                      <div class="p-3 bg-zinc-50 border border-zinc-100 rounded-xl group transition-all">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            <mat-icon class="text-zinc-400 scale-75">person</mat-icon>
                            <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600" [class.line-through]="!resume.metadataStyle?.isVisible">Metadata Layer</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <button mat-icon-button (click)="resume.metadataStyle!.isLocked = !resume.metadataStyle!.isLocked; updateResume()" 
                                    class="scale-75 transition-colors" [class.text-zinc-300]="!resume.metadataStyle?.isLocked" [class.text-zinc-900]="resume.metadataStyle?.isLocked">
                              <mat-icon class="text-sm">{{ resume.metadataStyle?.isLocked ? 'lock' : 'lock_open' }}</mat-icon>
                            </button>
                            <button mat-icon-button (click)="resume.metadataStyle!.isVisible = !resume.metadataStyle!.isVisible; updateResume()" 
                                    class="scale-75 transition-colors" [class.text-zinc-300]="!resume.metadataStyle?.isVisible" [class.text-zinc-900]="resume.metadataStyle?.isVisible">
                              <mat-icon class="text-sm">{{ resume.metadataStyle?.isVisible ? 'visibility' : 'visibility_off' }}</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="p-3 bg-zinc-50 border border-zinc-100 rounded-xl group transition-all">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            <mat-icon class="text-zinc-400 scale-75">work</mat-icon>
                            <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600" [class.line-through]="!resume.experienceStyle?.isVisible">Experience Layer</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <button mat-icon-button (click)="resume.experienceStyle!.isLocked = !resume.experienceStyle!.isLocked; updateResume()" 
                                    class="scale-75 transition-colors" [class.text-zinc-300]="!resume.experienceStyle?.isLocked" [class.text-zinc-900]="resume.experienceStyle?.isLocked">
                              <mat-icon class="text-sm">{{ resume.experienceStyle?.isLocked ? 'lock' : 'lock_open' }}</mat-icon>
                            </button>
                            <button mat-icon-button (click)="resume.experienceStyle!.isVisible = !resume.experienceStyle!.isVisible; updateResume()" 
                                    class="scale-75 transition-colors" [class.text-zinc-300]="!resume.experienceStyle?.isVisible" [class.text-zinc-900]="resume.experienceStyle?.isVisible">
                              <mat-icon class="text-sm">{{ resume.experienceStyle?.isVisible ? 'visibility' : 'visibility_off' }}</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              </mat-tab>

              <mat-tab>
                <ng-template mat-tab-label>
                  <div class="flex items-center gap-2 py-4">
                    <mat-icon class="text-sm">auto_awesome</mat-icon>
                    <span class="text-[10px] uppercase font-black tracking-widest">Coach</span>
                  </div>
                </ng-template>
                <div class="p-8 space-y-10">
                   <div class="p-6 bg-zinc-900 rounded-3xl space-y-6 text-white overflow-hidden relative">
                      <div class="absolute -top-10 -right-10 w-40 h-40 bg-zinc-800 rounded-full blur-3xl opacity-50"></div>
                      <div class="relative">
                        <div class="flex items-center gap-3 mb-6">
                           <div class="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-emerald-400">
                              <mat-icon>auto_awesome</mat-icon>
                           </div>
                           <div>
                              <p class="text-[8px] font-black uppercase tracking-widest text-zinc-500">AI Intelligence</p>
                              <p class="text-xs font-black uppercase tracking-widest">Review & Optimize</p>
                           </div>
                        </div>
                        
                        @if (isAnalyzing()) {
                          <div class="space-y-4 py-8 text-center animate-in fade-in duration-500">
                             <mat-spinner diameter="30" class="mx-auto"></mat-spinner>
                             <p class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Analyzing your professional DNA...</p>
                          </div>
                        } @else if (coachReport) {
                          <div class="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                             <!-- ATS Score -->
                             <div class="space-y-2">
                                <div class="flex justify-between items-end">
                                   <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400">ATS Correlation Score</span>
                                   <span class="text-2xl font-black text-emerald-400">{{ coachReport.atsScore }}%</span>
                                </div>
                                <mat-progress-bar mode="determinate" [value]="coachReport.atsScore" class="h-1 rounded-full !bg-zinc-800">
                                </mat-progress-bar>
                             </div>

                             <!-- Critical Suggestions -->
                             <div class="space-y-4">
                               <p class="text-[9px] font-black uppercase tracking-widest text-zinc-400">Optimization Targets</p>
                               <div class="space-y-3">
                                  @for (item of coachReport.suggestions; track item) {
                                    <div class="flex gap-3 items-start p-3 bg-zinc-800 rounded-xl">
                                       <mat-icon class="text-emerald-400 scale-75 pt-1">check_circle</mat-icon>
                                       <p class="text-[10px] leading-relaxed text-zinc-300 font-medium">{{ item }}</p>
                                    </div>
                                  }
                               </div>
                             </div>

                             <button mat-flat-button class="w-full !bg-white !text-zinc-900 !rounded-xl h-12 !text-[9px] !font-black !uppercase !tracking-widest" (click)="runCoachAnalysis()">
                                Re-verify Blueprint
                             </button>
                          </div>
                        } @else {
                          <div class="space-y-8 py-4">
                            <p class="text-xs text-zinc-400 leading-relaxed font-bold">
                              Our AI agent will scan your resume against 500+ ATS algorithms and suggest high-impact verbs to reshape your bullet points.
                            </p>
                            <button mat-flat-button class="w-full !bg-white !text-zinc-900 !rounded-xl h-12 !text-[9px] !font-black !uppercase !tracking-widest" (click)="runCoachAnalysis()">
                               Generate Report
                            </button>
                          </div>
                        }
                      </div>
                   </div>

                   <div class="space-y-4">
                      <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Mapping to Job Post</h3>
                      <div class="p-5 bg-white border border-zinc-100 rounded-2xl space-y-4 shadow-sm">
                         <textarea class="w-full h-32 bg-zinc-50 border border-zinc-50 rounded-xl p-4 text-[10px] font-bold text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all resize-none" 
                                   [(ngModel)]="jobUrl" placeholder="Paste the job description or link here..."></textarea>
                         <button mat-stroked-button class="w-full !border-zinc-200 !text-zinc-600 !rounded-xl h-10 !text-[8px] !font-black !uppercase !tracking-widest"
                                 (click)="mapToJob()" [disabled]="isMapping()">
                            @if (isMapping()) {
                               AI Repainting...
                            } @else {
                               Strategize Resume Map
                            }
                         </button>
                      </div>
                   </div>
                </div>
              </mat-tab>
              
              <mat-tab>
                <ng-template mat-tab-label>
                  <div class="flex items-center gap-2 py-4">
                    <mat-icon class="text-sm">bar_chart</mat-icon>
                    <span class="text-[10px] uppercase font-black tracking-widest">Skills</span>
                  </div>
                </ng-template>
                <div class="p-8 space-y-8">
                   <div class="space-y-4">
                      <div class="flex items-center justify-between pl-1">
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Technical Stack</h3>
                        <button mat-icon-button (click)="addSkill()" class="hover:bg-zinc-100 scale-75"><mat-icon>add</mat-icon></button>
                      </div>
                      <div class="space-y-3">
                         <div class="space-y-4">
                            <label class="text-[8px] font-black uppercase tracking-widest text-zinc-300">Portfolio / Social URL</label>
                            <div class="flex gap-2">
                               <input [(ngModel)]="resume.skillUrl" (ngModelChange)="updateResume(); generateQRCode()" placeholder="https://linkedin.com/in/username" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-[10px] font-bold">
                               <div class="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                                  <mat-icon class="scale-75 text-zinc-400">qr_code_2</mat-icon>
                               </div>
                            </div>
                            <p class="text-[8px] font-medium text-zinc-400">This URL will be encoded into the QR code at the bottom of your resume.</p>
                         </div>
                         
                         @for (skill of resume.skills; track skill.name) {
                           <div class="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-2 group">
                              <div class="flex items-center justify-between">
                                 <input [(ngModel)]="skill.name" (ngModelChange)="updateResume()" class="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0">
                                 <button mat-icon-button (click)="removeSkill(skill.name)" class="scale-50 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><mat-icon>delete</mat-icon></button>
                              </div>
                              <div class="flex items-center gap-2">
                                 <input type="range" [(ngModel)]="skill.level" (ngModelChange)="updateResume()" class="flex-1 accent-zinc-900 h-1">
                                 <span class="text-[8px] font-black text-zinc-400">{{ skill.level }}%</span>
                              </div>
                           </div>
                         }
                      </div>
                   </div>
                </div>
              </mat-tab>

              <mat-tab>
                <ng-template mat-tab-label>
                  <div class="flex items-center gap-2 py-4">
                    <mat-icon class="text-sm">brush</mat-icon>
                    <span class="text-[10px] uppercase font-black tracking-widest">Aesthetics</span>
                  </div>
                </ng-template>
                <div class="p-8 space-y-10">
                  <div class="space-y-4">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Layout Framework</h3>
                     <div class="grid grid-cols-2 gap-3">
                        @for (tmpl of frameworks; track tmpl.id) {
                          <div class="p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2"
                               [class.border-zinc-900]="template() === tmpl.id" 
                               [class.bg-zinc-900]="template() === tmpl.id" 
                               [class.text-white]="template() === tmpl.id"
                               [class.border-zinc-50]="template() !== tmpl.id" 
                               [class.bg-zinc-50/50]="template() !== tmpl.id"
                               (click)="template.set(tmpl.id)">
                            <div class="w-full aspect-[4/5] bg-zinc-200/20 rounded-md mb-2 overflow-hidden flex items-center justify-center opacity-40">
                               <mat-icon class="scale-150">grid_view</mat-icon>
                            </div>
                            <span class="text-[9px] font-black uppercase tracking-widest">{{ tmpl.name }}</span>
                          </div>
                        }
                     </div>
                  </div>

                  <div class="space-y-4 pt-8 border-t border-zinc-100">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Style Moods</h3>
                     <div class="grid grid-cols-3 gap-2">
                        <button (click)="applyMood('executive')" class="p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-900 hover:text-white transition-all text-center space-y-2">
                           <mat-icon class="scale-75">business</mat-icon>
                           <p class="text-[8px] font-black uppercase tracking-tighter">Executive</p>
                        </button>
                        <button (click)="applyMood('creative')" class="p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-900 hover:text-white transition-all text-center space-y-2">
                           <mat-icon class="scale-75">brush</mat-icon>
                           <p class="text-[8px] font-black uppercase tracking-tighter">Creative</p>
                        </button>
                        <button (click)="applyMood('startup')" class="p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-900 hover:text-white transition-all text-center space-y-2">
                           <mat-icon class="scale-75">rocket_launch</mat-icon>
                           <p class="text-[8px] font-black uppercase tracking-tighter">Startup</p>
                        </button>
                     </div>
                  </div>

                  <div class="space-y-4 pt-8 border-t border-zinc-100">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Typography</h3>
                     <div class="space-y-4">
                        <div class="space-y-2">
                          <label class="text-[8px] font-black uppercase text-zinc-300">Select Font Family</label>
                          <select [(ngModel)]="resume.aesthetics.fontFamily" (ngModelChange)="updateResume()"
                                  class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs font-bold text-zinc-800 focus:outline-none appearance-none cursor-pointer">
                            @for (font of fonts; track font) {
                              <option [value]="font" [style.font-family]="font">{{ font }}</option>
                            }
                          </select>
                        </div>
                        
                        <div class="space-y-2">
                          <label class="text-[8px] font-black uppercase text-zinc-300">Lettering Size</label>
                          <div class="flex items-center gap-2">
                            <button mat-stroked-button class="!border-zinc-200 !min-w-[40px] !w-10 !h-10 !rounded-lg" (click)="resume.aesthetics.fontSize = resume.aesthetics.fontSize - 1; updateResume()">-</button>
                            <input type="number" [(ngModel)]="resume.aesthetics.fontSize" (ngModelChange)="updateResume()" class="flex-1 bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-center text-xs font-bold">
                            <button mat-stroked-button class="!border-zinc-200 !min-w-[40px] !w-10 !h-10 !rounded-lg" (click)="resume.aesthetics.fontSize = resume.aesthetics.fontSize + 1; updateResume()">+</button>
                          </div>
                        </div>
                     </div>
                  </div>

                  <div class="space-y-6 pt-8 border-t border-zinc-100">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Chromatics</h3>
                     <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                          <label for="typoColor" class="text-[8px] font-black uppercase text-zinc-300">Typography Color</label>
                          <input id="typoColor" name="typoColor" type="color" [(ngModel)]="resume.aesthetics.primaryColor" (ngModelChange)="updateResume()" class="w-full h-10 rounded-xl cursor-pointer bg-zinc-50 border border-zinc-100 p-1">
                        </div>
                        <div class="space-y-2">
                          <label for="canvasColor" class="text-[8px] font-black uppercase text-zinc-300">Canvas Color</label>
                          <input id="canvasColor" name="canvasColor" type="color" [(ngModel)]="resume.aesthetics.backgroundColor" (ngModelChange)="updateResume()" class="w-full h-10 rounded-xl cursor-pointer bg-zinc-50 border border-zinc-100 p-1">
                        </div>
                     </div>
                  </div>

                  <div class="space-y-4 pt-8 border-t border-zinc-100">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Global Scale</h3>
                     <div class="bg-zinc-50 p-6 rounded-2xl">
                       <input type="range" min="50" max="150" [(ngModel)]="scale" class="w-full accent-zinc-900 h-1 rounded-full cursor-pointer">
                       <div class="flex justify-between mt-4">
                         <span class="text-[8px] font-black uppercase tracking-widest text-zinc-400">50%</span>
                         <span class="text-[8px] font-black uppercase tracking-widest text-zinc-900">{{ scale() }}%</span>
                         <span class="text-[8px] font-black uppercase tracking-widest text-zinc-400">150%</span>
                       </div>
                     </div>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
          
          <div class="p-6 bg-zinc-50 border-t border-zinc-100">
             <div class="flex items-center justify-between mb-4">
               <span class="text-[8px] font-black uppercase tracking-widest text-zinc-400">Autosave Status</span>
               @if (resumeService.isPaid()) {
                 <span class="text-[8px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                   <mat-icon class="text-[10px] w-3 h-3">cloud_done</mat-icon> Live Sync Active
                 </span>
               } @else {
                 <span class="text-[8px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-2 py-1 rounded">PRO FEATURE ONLY</span>
               }
             </div>
             @if (!resumeService.isPaid()) {
               <div class="mb-4 p-3 bg-zinc-900 rounded-xl text-white">
                 <p class="text-[8px] font-black uppercase tracking-widest mb-2">Upgrade to Unlock Cloud Sync</p>
                 <button class="w-full h-8 bg-emerald-400 text-zinc-900 rounded-lg text-[8px] font-black hover:bg-emerald-300 transition-colors">GO PRO NOW</button>
               </div>
             }
             <button mat-flat-button class="w-full !bg-zinc-200 !text-zinc-600 !rounded-xl h-10 !text-[9px] !font-black !uppercase !tracking-widest" (click)="restoreDefaults()">
                Reset Blueprint
             </button>
          </div>
        </aside>

        <!-- CANVAS: CENTER (WYSIWYG Viewer) -->
        <main class="flex-1 overflow-hidden relative flex flex-col items-center justify-center">
          <!-- Canvas Controls Area (Top Float) -->
          <div class="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur-md rounded-full border border-zinc-200 p-1 flex items-center shadow-xl">
            <button mat-icon-button (click)="zoomOut()"><mat-icon class="scale-75">remove</mat-icon></button>
            <span class="text-[9px] font-black uppercase tracking-widest text-zinc-900 px-4 whitespace-nowrap">{{ scale() }}% Rendering</span>
            <button mat-icon-button (click)="zoomIn()"><mat-icon class="scale-75">add</mat-icon></button>
            <div class="w-px h-4 bg-zinc-200 mx-2"></div>
            <button mat-icon-button (click)="toggleFullscreen()"><mat-icon class="scale-75">fullscreen</mat-icon></button>
          </div>

          <!-- The Paper -->
          <div #canvasContainer class="canvas-viewport w-full h-full overflow-auto p-20 flex justify-center no-scrollbar group select-text">
            <div 
              id="resume-canvas"
              class="a4-paper bg-white shadow-2xl relative transition-all duration-300 origin-top shrink-0"
              [style.transform]="'scale(' + (scale() / 100) + ')'"
              [ngClass]="'template-' + template()">
              
              <!-- Content Rendering Logic -->
              <div class="absolute inset-0 pointer-events-none overflow-hidden" [style.font-family]="resume.aesthetics.fontFamily">
                @for (el of resume.aesthetics.elements; track el.id) {
                  @if (el.isVisible !== false) {
                    <div class="absolute pointer-events-auto cursor-move group select-none"
                         cdkDrag 
                         [cdkDragData]="el"
                         [cdkDragBoundary]="'#resume-canvas'"
                         [cdkDragDisabled]="el.isLocked"
                         [style.left]="convertToUnit(el.x, el.unit)"
                         [style.top]="convertToUnit(el.y, el.unit)"
                         [style.width]="convertToUnit(el.width, el.unit)"
                         [style.height]="convertToUnit(el.height, el.unit)"
                         [style.transform]="getTransform(el)"
                         (cdkDragEnded)="onDragEnd($event, el)"
                         (click)="activeElementId.set(el.id); activeSectionId.set(null); $event.stopPropagation()">
                      
                      @if (el.type === 'image') {
                        <img [src]="el.url" class="w-full h-full object-cover rounded-sm shadow-sm" referrerpolicy="no-referrer"
                             [style.transform]="getImageMirror(el)" alt="Canvas element">
                      } @else if (el.type === 'line') {
                        <div class="w-full h-full" [style.background-color]="el.style?.['backgroundColor']" 
                             [class.border-t-2]="el.style?.['borderStyle'] === 'dashed' || el.style?.['borderStyle'] === 'dotted'"
                             [style.border-top-style]="el.style?.['borderStyle'] || 'solid'"
                             [style.border-top-color]="el.style?.['backgroundColor']"></div>
                      } @else if (el.type === 'box') {
                        <div class="w-full h-full border border-zinc-200" [style.background-color]="el.style?.['backgroundColor']"
                             [style.border-radius.px]="el.style?.['borderRadius'] || 0"
                             [style.border-width.px]="el.style?.['borderWidth'] || 1"
                             [style.border-style]="el.style?.['borderStyle'] || 'solid'"
                             [style.border-color]="el.style?.['borderColor'] || '#e4e4e7'"></div>
                      } @else if (el.type === 'text') {
                        <div class="w-full h-full p-2 outline-none whitespace-pre-wrap select-text" 
                             [style.font-size.px]="el.style?.['fontSize'] || 12"
                             [style.color]="el.style?.['color'] || '#09090b'"
                             [style.font-weight]="el.style?.['fontWeight'] || '400'"
                             [style.text-align]="el.style?.['textAlign'] || 'left'"
                             [contentEditable]="!el.isLocked"
                             (blur)="el.content = $any($event.target).innerText; updateResume()">{{ el.content }}</div>
                      }

                      <!-- Selection Border -->
                      @if (activeElementId() === el.id) {
                        <div class="absolute -inset-1 border-2 border-zinc-900 border-dashed pointer-events-none rounded-sm"></div>
                        <div class="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-zinc-900 rounded-full"></div>
                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-zinc-900 rounded-full"></div>
                        <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-zinc-900 rounded-full"></div>
                        <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-zinc-900 rounded-full"></div>
                      }

                      <!-- Drag Handle Overlay -->
                      <div class="absolute -top-6 left-0 bg-zinc-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 uppercase font-black tracking-widest transition-opacity pointer-events-none flex items-center gap-2">
                        <mat-icon class="scale-50">{{ el.isLocked ? 'lock' : 'open_with' }}</mat-icon>
                        {{ el.type }}
                      </div>
                    </div>
                  }
                }
              </div>

              <div [style.font-family]="resume.aesthetics.fontFamily">
                @if (template() === 'blank') {
                  <div class="h-full w-full relative">
                    <!-- Blank canvas for free-form design -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                       <mat-icon class="scale-[10]">grid_4x4</mat-icon>
                    </div>
                  </div>
                }

                @if (template() === 'minimal') {
                <div class="p-16 space-y-12 h-full flex flex-col">
                  <header class="text-center pt-8 relative cursor-move group/meta" 
                          cdkDrag
                          [cdkDragDisabled]="resume.metadataStyle?.isLocked"
                          (cdkDragEnded)="onMetadataDragEnd($event)"
                          *ngIf="resume.metadataStyle?.isVisible !== false"
                          [style.border]="resume.metadataStyle?.border === 'none' ? 'none' : '1px ' + resume.metadataStyle?.border + ' #e4e4e7'"
                          [style.padding.px]="resume.metadataStyle?.padding"
                          [style.width.px]="resume.metadataStyle?.width"
                          [style.transform]="'translate(' + (resume.metadataStyle?.x || 0) + 'px, ' + (resume.metadataStyle?.y || 0) + 'px)'">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/meta:opacity-100 uppercase font-black tracking-widest transition-opacity pointer-events-none flex items-center gap-2">
                       <mat-icon class="scale-50">{{ resume.metadataStyle?.isLocked ? 'lock' : 'open_with' }}</mat-icon>
                       Metadata
                    </div>
                    <h1 class="text-6xl font-black tracking-tighter text-zinc-900 mb-6 uppercase" [style.color]="resume.aesthetics.primaryColor">{{ resume.name || 'UNNAMED_ENTITY' }}</h1>
                    <div class="flex flex-wrap justify-center gap-x-8 gap-y-3 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-y border-zinc-100 py-4 max-w-xl mx-auto">
                      <span>{{ resume.phoneCountryCode }} {{ resume.phone }}</span>
                      <span>{{ resume.email }}</span>
                      <span>{{ resume.location }}</span>
                    </div>
                  </header>

                  <section class="max-w-xl mx-auto text-center">
                    <p class="text-lg leading-relaxed text-zinc-600 font-medium italic" [style.color]="resume.aesthetics.primaryColor">"{{ resume.summary }}"</p>
                  </section>

                  <div class="flex-1 space-y-12 pt-8">
                    @if (resume.experience.length > 0) {
                      <section class="space-y-8 relative cursor-move group/exp"
                               cdkDrag
                               [cdkDragDisabled]="resume.experienceStyle?.isLocked"
                               (cdkDragEnded)="onExperienceDragEnd($event)"
                               *ngIf="resume.experienceStyle?.isVisible !== false"
                               [style.transform]="'translate(' + (resume.experienceStyle?.x || 0) + 'px, ' + (resume.experienceStyle?.y || 0) + 'px)'">
                        <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/exp:opacity-100 uppercase font-black tracking-widest transition-opacity pointer-events-none flex items-center gap-2">
                           <mat-icon class="scale-50">{{ resume.experienceStyle?.isLocked ? 'lock' : 'open_with' }}</mat-icon>
                           Experience
                        </div>
                        <h3 class="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-6">
                          Experience
                          <span class="flex-1 h-px bg-zinc-100"></span>
                        </h3>
                        <div class="space-y-10">
                          @for (exp of resume.experience; track exp.id; let i = $index) {
                            <div class="pl-8 border-l border-zinc-100 relative">
                              <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-zinc-900"></div>
                              <div class="flex justify-between items-start mb-2">
                                <div>
                                  <h4 class="font-black uppercase tracking-widest text-zinc-900 text-sm">{{ exp.company }}</h4>
                                  <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{{ exp.title }}</p>
                                </div>
                                <div class="text-right">
                                  <p class="text-[10px] font-black text-zinc-900 uppercase tracking-widest">{{ exp.startDate }} — {{ exp.current ? 'Present' : exp.endDate }}</p>
                                  <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest"><b>{{ calculateDuration(exp) }}</b></p>
                                </div>
                              </div>
                              <p class="text-sm text-zinc-600 leading-relaxed">{{ exp.content }}</p>
                            </div>
                          }
                        </div>
                      </section>
                    }

    @if (resume.skills.length > 0) {
                      <section class="space-y-8">
                        <h3 class="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-6">
                          Proficiencies
                          <span class="flex-1 h-px bg-zinc-100"></span>
                        </h3>
                        <div class="flex justify-center py-10 bg-zinc-50/50 rounded-3xl border border-zinc-50">
                           <div id="skills-radar-chart" class="w-[300px] h-[300px]"></div>
                        </div>
                      </section>
                    }

                    @for (section of resume.sections; track section.id) {
                      <section class="group">
                        <h3 class="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-6">
                          {{ section.title }}
                          <span class="flex-1 h-px bg-zinc-100"></span>
                        </h3>
                        <div class="whitespace-pre-wrap text-zinc-700 leading-relaxed text-sm pl-8 border-l border-zinc-100">{{ section.content }}</div>
                      </section>
                    }

                    @if (resume.referees.length > 0) {
                       <section class="space-y-6">
                        <h3 class="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-6">
                          Referees
                          <span class="flex-1 h-px bg-zinc-100"></span>
                        </h3>
                        <div class="grid grid-cols-2 gap-8">
                          @for (ref of resume.referees; track ref.id) {
                            <div class="space-y-1">
                              <h4 class="text-[10px] font-black uppercase text-zinc-900 tracking-widest">{{ ref.name }}</h4>
                              <p class="text-[9px] text-zinc-400 font-medium">{{ ref.email }} • {{ ref.phone }}</p>
                              <p class="text-[9px] text-zinc-400 font-medium opacity-60">{{ ref.address }}</p>
                            </div>
                          }
                        </div>
                      </section>
                    }
                  </div>
                  
                  
                  <footer class="pt-20 text-center opacity-40 flex flex-col items-center gap-4">
                    @if (qrCodeUrl()) {
                       <img [src]="qrCodeUrl()" class="w-16 h-16 grayscale" alt="Portfolio QR Code">
                       <p class="text-[6px] font-black uppercase tracking-widest text-zinc-900 mb-2">Scan for Portfolio Link</p>
                    }
                  </footer>
                </div>
              }

              @if (template() === 'modern') {
                <div class="flex flex-col h-full bg-white">
                  <header class="p-16 bg-zinc-900 text-white flex justify-between items-end">
                    <div>
                      <h1 class="text-5xl font-black tracking-tighter mb-2 uppercase">{{ resume.name || 'IDENTITY_REQUIRED' }}</h1>
                      <p class="text-indigo-400 font-black tracking-[0.3em] text-[10px] uppercase">Professional Profile Synthesis</p>
                    </div>
                    <div class="text-right space-y-1 opacity-60">
                       <p class="text-[9px] font-black uppercase tracking-widest">{{ resume.location }}</p>
                       <p class="text-[9px] font-black uppercase tracking-widest">{{ resume.email }}</p>
                    </div>
                  </header>

                  <div class="flex-1 flex overflow-hidden">
                    <aside class="w-1/3 bg-zinc-50/50 p-16 border-r border-zinc-100 space-y-12">
                       <section>
                         <h4 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Profile</h4>
                         <p class="text-xs text-zinc-600 leading-loose italic">{{ resume.summary }}</p>
                       </section>

                       @for (section of resume.sections.slice(2); track section.id) {
                         <section>
                           <h4 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">{{ section.title }}</h4>
                           <div class="text-xs text-zinc-700 leading-loose whitespace-pre-wrap">{{ section.content }}</div>
                         </section>
                       }
                    </aside>
                    <main class="flex-1 p-16 space-y-12">
                       @for (section of resume.sections.slice(0, 2); track section.id) {
                         <section>
                           <div class="flex items-center gap-4 mb-6">
                              <span class="w-10 h-1 bg-zinc-900"></span>
                              <h4 class="text-xs font-black uppercase tracking-[0.2em] text-zinc-900">{{ section.title }}</h4>
                           </div>
                           <div class="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap pl-14">{{ section.content }}</div>
                         </section>
                       }
                    </main>
                  </div>
                </div>
              }

              @if (template() === 'classic') {
                <div class="p-24 font-serif space-y-12 text-zinc-900 flex flex-col h-full">
                  <header class="text-center space-y-6">
                    <h1 class="text-6xl font-bold tracking-tight mb-2">{{ resume.name || 'Jonathan Doe' }}</h1>
                    <div class="text-[9px] font-black tracking-widest uppercase text-zinc-400 border-y border-zinc-200 py-4 flex justify-center gap-8">
                      <span>{{ resume.email }}</span>
                      <span>{{ resume.phone }}</span>
                      <span>{{ resume.location }}</span>
                    </div>
                  </header>

                  <section class="max-w-2xl mx-auto">
                    <p class="text-2xl leading-relaxed text-center font-serif text-zinc-800 italic">"{{ resume.summary }}"</p>
                  </section>

                  <div class="flex-1 space-y-12">
                    @for (section of resume.sections; track section.id) {
                      <section>
                        <h4 class="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-zinc-900 pb-2 mb-8">{{ section.title }}</h4>
                        <div class="whitespace-pre-wrap leading-relaxed text-zinc-700 font-serif text-base">{{ section.content }}</div>
                      </section>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </main>
        
        <!-- SIDEBAR: RIGHT (Contextual Properties) -->
        <aside class="w-72 bg-white border-l border-zinc-200 shrink-0 p-8 hidden xl:flex flex-col">
           <header class="mb-10">
              <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Properties</h3>
              <p class="text-xs font-bold text-zinc-900">Element Inspector</p>
           </header>
           
           @if (activeSectionId()) {
              <!-- Section Inspector logic remains same or similar -->
              <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <!-- existing content -->
              </div>
           } @else if (activeElementId()) {
              @let activeEl = getActiveElement();
              @if (activeEl) {
                <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <header class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                         <mat-icon class="scale-75">{{ getIconForType(activeEl.type) }}</mat-icon>
                      </div>
                      <div>
                         <p class="text-[8px] font-black uppercase tracking-widest text-zinc-400">Object Type</p>
                         <p class="text-[10px] font-black uppercase text-zinc-900">{{ activeEl.type }}</p>
                      </div>
                    </div>
                    <button mat-icon-button (click)="activeEl.isLocked = !activeEl.isLocked; updateResume()" 
                            [matTooltip]="activeEl.isLocked ? 'Unlock Element' : 'Lock Element'">
                       <mat-icon class="scale-75">{{ activeEl.isLocked ? 'lock' : 'lock_open' }}</mat-icon>
                    </button>
                  </header>

                  <div class="space-y-6">
                    <!-- Transformations -->
                    <div class="space-y-4">
                       <p class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transformations</p>
                       <div class="grid grid-cols-2 gap-4">
                          <div class="space-y-1">
                             <label class="text-[8px] font-black text-zinc-300 uppercase">Rotation (°)</label>
                             <input type="number" [(ngModel)]="activeEl.rotation" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs font-bold">
                          </div>
                          <div class="space-y-1">
                             <label class="text-[8px] font-black text-zinc-300 uppercase">Unit</label>
                             <select [(ngModel)]="activeEl.unit" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs font-bold appearance-none">
                                <option value="px">Pixels (px)</option>
                                <option value="cm">Centimeters (cm)</option>
                                <option value="mm">Millimeters (mm)</option>
                             </select>
                          </div>
                       </div>
                       @if (activeEl.type === 'image') {
                          <div class="flex gap-2">
                            <button mat-stroked-button class="flex-1 !border-zinc-200 !text-zinc-600 h-10 !rounded-xl !text-[8px] !font-black !uppercase !tracking-widest"
                                    (click)="activeEl.mirror = { horizontal: !activeEl.mirror?.horizontal, vertical: !!activeEl.mirror?.vertical }; updateResume()">
                               Mirror H
                            </button>
                            <button mat-stroked-button class="flex-1 !border-zinc-200 !text-zinc-600 h-10 !rounded-xl !text-[8px] !font-black !uppercase !tracking-widest"
                                    (click)="activeEl.mirror = { horizontal: !!activeEl.mirror?.horizontal, vertical: !activeEl.mirror?.vertical }; updateResume()">
                               Mirror V
                            </button>
                          </div>
                       }
                    </div>

                    <!-- Geometry -->
                    <div class="space-y-4">
                       <p class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Geometry</p>
                       <div class="grid grid-cols-2 gap-4">
                          <div class="space-y-1">
                             <label class="text-[8px] font-black text-zinc-300 uppercase">Width</label>
                             <input type="number" [(ngModel)]="activeEl.width" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs font-bold">
                          </div>
                          <div class="space-y-1">
                             <label class="text-[8px] font-black text-zinc-300 uppercase">Height</label>
                             <input type="number" [(ngModel)]="activeEl.height" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs font-bold">
                          </div>
                          <div class="space-y-1">
                             <label class="text-[8px] font-black text-zinc-300 uppercase">X Position</label>
                             <input type="number" [(ngModel)]="activeEl.x" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs font-bold">
                          </div>
                          <div class="space-y-1">
                             <label class="text-[8px] font-black text-zinc-300 uppercase">Y Position</label>
                             <input type="number" [(ngModel)]="activeEl.y" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs font-bold">
                          </div>
                       </div>
                    </div>

                    <!-- Look & Feel -->
                    <div class="space-y-4 pt-4 border-t border-zinc-100">
                       <p class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Styles</p>
                       
                       @if (activeEl.type === 'box' || activeEl.type === 'line') {
                          <div class="space-y-3">
                             <div class="space-y-1">
                                <label class="text-[8px] font-black text-zinc-300 uppercase">Background Color</label>
                                <div class="flex gap-2">
                                   <input type="color" [(ngModel)]="activeEl.style!['backgroundColor']" (ngModelChange)="updateResume()" class="w-12 h-10 rounded-lg cursor-pointer bg-white border border-zinc-100">
                                   <input type="text" [(ngModel)]="activeEl.style!['backgroundColor']" (ngModelChange)="updateResume()" class="flex-1 bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                </div>
                             </div>
                          </div>
                       }

                       @if (activeEl.type === 'box') {
                          <div class="space-y-3 pt-2">
                             <div class="grid grid-cols-2 gap-2">
                                <div class="space-y-1">
                                   <label class="text-[8px] font-black text-zinc-300 uppercase">Border Radius</label>
                                   <input type="number" [(ngModel)]="activeEl.style!['borderRadius']" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold">
                                </div>
                                <div class="space-y-1">
                                   <label class="text-[8px] font-black text-zinc-300 uppercase">Border Width</label>
                                   <input type="number" [(ngModel)]="activeEl.style!['borderWidth']" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold">
                                </div>
                             </div>
                             <div class="space-y-1">
                                <label class="text-[8px] font-black text-zinc-300 uppercase">Border Color</label>
                                <input type="color" [(ngModel)]="activeEl.style!['borderColor']" (ngModelChange)="updateResume()" class="w-full h-8 rounded-md cursor-pointer">
                             </div>
                          </div>
                       }

                       @if (activeEl.type === 'text') {
                          <div class="space-y-4">
                             <div class="grid grid-cols-2 gap-2">
                               <div class="space-y-1">
                                  <label class="text-[8px] font-black text-zinc-300 uppercase">Font Size</label>
                                  <input type="number" [(ngModel)]="activeEl.style!['fontSize']" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold">
                               </div>
                               <div class="space-y-1">
                                  <label class="text-[8px] font-black text-zinc-300 uppercase">Text Align</label>
                                  <select [(ngModel)]="activeEl.style!['textAlign']" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-[10px] font-black uppercase">
                                     <option value="left">Left</option>
                                     <option value="center">Center</option>
                                     <option value="right">Right</option>
                                  </select>
                               </div>
                             </div>
                             <div class="space-y-1">
                                <label class="text-[8px] font-black text-zinc-300 uppercase">Text Color</label>
                                <input type="color" [(ngModel)]="activeEl.style!['color']" (ngModelChange)="updateResume()" class="w-full h-8 rounded-md cursor-pointer">
                             </div>
                          </div>
                       }
                    </div>

                    <div class="pt-6 space-y-3">
                       <button mat-flat-button class="w-full !bg-zinc-900 !text-white h-12 !rounded-xl !text-[9px] !font-black !uppercase !tracking-widest" (click)="activeElementId.set(null)">
                          Commit changes
                       </button>
                    </div>
                  </div>
                </div>
              }
           } @else {
             <div class="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <mat-icon class="scale-[2] text-zinc-200 font-thin">ads_click</mat-icon>
                <p class="text-[9px] font-black uppercase tracking-widest text-zinc-400">Selection Required</p>
             </div>
           }
           
           <div class="mt-auto pt-8 border-t border-zinc-100">
              <div class="flex items-center gap-3 mb-4">
                 <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <mat-icon class="scale-75">stars</mat-icon>
                 </div>
                 <div>
                    <p class="text-[8px] font-black uppercase tracking-widest text-indigo-400">Current Plan</p>
                    <p class="text-[10px] font-black uppercase text-indigo-700">Enterprise Studio</p>
                 </div>
              </div>
              <p class="text-[8px] font-bold text-zinc-400 leading-relaxed">Advanced rendering enabled. All export filters active.</p>
           </div>
        </aside>

      </div>
    </div>
  `,
  styles: [
    `
      @reference "tailwindcss";
      :host {
        display: block;
      }

      .a4-paper {
        width: 210mm;
        height: 297mm;
        min-width: 210mm;
        min-height: 297mm;
      }

      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      ::ng-deep .studio-tabs .mat-mdc-tab-header {
        border-bottom: 1px solid #f4f4f5;
      }
      ::ng-deep .studio-tabs .mat-mdc-tab .mdc-tab__text-label {
        color: #71717a !important;
      }
      ::ng-deep .studio-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
        color: #09090b !important;
      }
      ::ng-deep .studio-tabs .mat-mdc-tab-ink-bar {
        height: 2px !important;
        background-color: #09090b !important;
      }

      ::ng-deep .studio-toggle-group {
        border: 1px solid #f4f4f5 !important;
        border-radius: 0.75rem !important;
        overflow: hidden;
        height: 40px !important;
      }
      ::ng-deep .studio-toggle-group .mat-button-toggle {
        background-color: #fafafa !important;
        border-left: 1px solid #f4f4f5 !important;
      }
      ::ng-deep .studio-toggle-group .mat-button-toggle-checked {
        background-color: #09090b !important;
        color: white !important;
      }
      ::ng-deep
        .studio-toggle-group
        .mat-button-toggle
        .mat-button-toggle-label-content {
        font-size: 8px !important;
        font-weight: 900 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1em !important;
      }
    `,
  ],
})
export class StudioComponent implements AfterViewInit {
  public resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);

  resume = this.resumeService.resumeState();
  template = signal<string>("minimal");
  scale = signal(75);
  sidebarPosition = signal<"left" | "right">("left");
  activeSectionId = signal<string | null>(null);
  activeElementId = signal<string | null>(null);
  enhancingSections = signal(new Set<string>());
  isPremium = this.resumeService.isPremium;

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

  onImageTrigger(input: HTMLInputElement) {
    input.click();
  }

  ngAfterViewInit() {
    this.autoScale();
    this.generateQRCode();
    setTimeout(() => this.renderSkillsChart(), 500);
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
    this.renderSkillsChart();
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
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional resume coach. Provide ATS scoring and refinement suggestions in JSON format.",
              },
              {
                role: "user",
                content: `Analyze this resume data for ATS scoring and refinement:
              ${JSON.stringify(this.resume)}
              Provide a JSON response with 'atsScore' (0-100) and 'suggestions' (string array of action-verb improvements).`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid or empty response from OpenAI API. Please check your token or quota.");
      }
      const content = data.choices[0].message.content;
      this.coachReport = JSON.parse(content);
    } catch (e) {
      console.error("AI Gen failed", e);
      // alert("AI analysis failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async polishSummary() {
    if (!this.resume.summary) return;
    this.isMapping.set(true);
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional resume writer. Polish the following professional summary to be more impactful and professional.",
              },
              {
                role: "user",
                content: this.resume.summary,
              },
            ],
          }),
        },
      );

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        this.resume.summary = data.choices[0].message.content;
        this.updateResume();
      } else {
        throw new Error("AI could not process the summary. Check API limits.");
      }
    } catch (e) {
      console.error("AI Gen failed", e);
    } finally {
      this.isMapping.set(false);
    }
  }

  async suggestExperienceDescription(index: number) {
    const exp = this.resume.experience[index];
    if (!exp.title || !exp.company) return;

    this.isMapping.set(true);
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional resume writer. Generate 3-4 impactful bullet points for a job description based on the title and company.",
              },
              {
                role: "user",
                content: `Job Title: ${exp.title}\nCompany: ${exp.company}\nDescription: ${exp.content}`,
              },
            ],
          }),
        },
      );

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        this.resume.experience[index].content = data.choices[0].message.content;
        this.updateResume();
      } else {
        throw new Error("AI could not generate description. Check API limits.");
      }
    } catch (e) {
      console.error("AI Gen failed", e);
    } finally {
      this.isMapping.set(false);
    }
  }

  async mapToJob() {
    if (!this.jobUrl) return;
    this.isMapping.set(true);
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional resume writer. Rewrite resume elements to match job descriptions.",
              },
              {
                role: "user",
                content: `Rewrite elements of this resume to better map to this job description: ${this.jobUrl}. 
              Target specifically the Summary and Key projects. 
              Original Data: ${JSON.stringify(this.resume)}
              Return ONLY the updated ResumeData JSON object.`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("AI mapping failed. Check API limits.");
      }
      const content = data.choices[0].message.content;
      const updatedData = JSON.parse(content);
      this.resume = { ...this.resume, ...updatedData };
      this.updateResume();
    } catch (e) {
      console.error("AI Gen failed", e);
    } finally {
      this.isMapping.set(false);
    }
  }

  addSkill() {
    this.resume.skills = [
      ...(this.resume.skills || []),
      { name: "New Skill", level: 50 },
    ];
    this.updateResume();
  }

  removeSkill(name: string) {
    this.resume.skills = this.resume.skills.filter((s) => s.name !== name);
    this.updateResume();
  }

  renderSkillsChart() {
    const container = document.getElementById("skills-radar-chart");
    if (!container || !this.resume.skills.length) return;

    // Basic D3 Radar Chart implementation
    d3.select(container).selectAll("*").remove();

    const width = 300;
    const height = 300;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const data = this.resume.skills;
    const angleSlice = (Math.PI * 2) / data.length;
    const rScale = d3
      .scaleLinear<number, number>()
      .range([0, radius])
      .domain([0, 100]);

    // Grid
    const levels = 5;
    for (let j = 0; j < levels; j++) {
      const levelFactor = radius * ((j + 1) / levels);
      svg
        .selectAll(".levels")
        .data(data)
        .enter()
        .append("line")
        .attr(
          "x1",
          (d: any, i: number) =>
            levelFactor * Math.cos(angleSlice * i - Math.PI / 2),
        )
        .attr(
          "y1",
          (d: any, i: number) =>
            levelFactor * Math.sin(angleSlice * i - Math.PI / 2),
        )
        .attr(
          "x2",
          (d: any, i: number) =>
            levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2),
        )
        .attr(
          "y2",
          (d: any, i: number) =>
            levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2),
        )
        .attr("class", "line")
        .style("stroke", "#f4f4f5")
        .style("stroke-width", "1px");
    }

    // Axes
    const axis = svg
      .selectAll(".axis")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr(
        "x2",
        (d: any, i: number) => radius * Math.cos(angleSlice * i - Math.PI / 2),
      )
      .attr(
        "y2",
        (d: any, i: number) => radius * Math.sin(angleSlice * i - Math.PI / 2),
      )
      .style("stroke", "#f4f4f5")
      .style("stroke-width", "1px");

    // Labels
    axis
      .append("text")
      .attr("class", "legend")
      .style("font-size", "8px")
      .style("font-weight", "900")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr(
        "x",
        (d: any, i: number) =>
          (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2),
      )
      .attr(
        "y",
        (d: any, i: number) =>
          (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2),
      )
      .text((d: any) => d.name.toUpperCase());

    // Radar Area
    const radarLine = d3
      .lineRadial<{ name: string; level: number }>()
      .radius((d: { level: number }) => rScale(d.level))
      .angle((d: any, i: number) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    svg
      .append("path")
      .datum(data)
      .attr("d", radarLine as any)
      .style("fill", this.resume.aesthetics.primaryColor)
      .style("fill-opacity", 0.1)
      .style("stroke", this.resume.aesthetics.primaryColor)
      .style("stroke-width", "2px");
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
              ? "transparent"
              : "transparent",
        borderStyle: "solid",
        borderRadius: 0,
        borderWidth: 1,
        borderColor: "#e4e4e7",
        fontSize: 14,
        color: "#09090b",
        fontWeight: "400",
        textAlign: "left",
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

  onDragEnd(event: CdkDragEnd, element: ResumeElement) {
    const { x, y } = event.source.getFreeDragPosition();
    element.x += x;
    element.y += y;
    event.source.reset();
    this.updateResume();
  }

  onMetadataDragEnd(event: CdkDragEnd) {
    if (this.resume.metadataStyle) {
      const { x, y } = event.source.getFreeDragPosition();
      this.resume.metadataStyle.x = (this.resume.metadataStyle.x || 0) + x;
      this.resume.metadataStyle.y = (this.resume.metadataStyle.y || 0) + y;
      event.source.reset();
      this.updateResume();
      console.log("Metadata position updated:", this.resume.metadataStyle.x, this.resume.metadataStyle.y);
    }
  }

  onExperienceDragEnd(event: CdkDragEnd) {
    if (this.resume.experienceStyle) {
      const { x, y } = event.source.getFreeDragPosition();
      this.resume.experienceStyle.x = (this.resume.experienceStyle.x || 0) + x;
      this.resume.experienceStyle.y = (this.resume.experienceStyle.y || 0) + y;
      event.source.reset();
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
}
