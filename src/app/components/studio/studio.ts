import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { ResumeService, ResumeSection } from '../../services/resume';
import { PaymentDialogComponent } from '../payment/payment';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule, 
    MatTabsModule,
    MatButtonToggleModule
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
          <button mat-button class="!text-xs !font-black !uppercase !tracking-widest !text-zinc-500 hover:!text-zinc-900 transition-colors" (click)="undo()" matTooltip="Undo Change">
            <mat-icon class="mr-1">undo</mat-icon>
          </button>
          
          <div class="h-6 w-px bg-zinc-200"></div>

          <button mat-icon-button (click)="toggleSidebarPosition()" [matTooltip]="'Move Sidebar to ' + (sidebarPosition() === 'left' ? 'Right' : 'Left')">
            <mat-icon class="scale-75 text-zinc-500">{{ sidebarPosition() === 'left' ? 'format_indent_increase' : 'format_indent_decrease' }}</mat-icon>
          </button>

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
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Identity</h3>
                    <div class="grid grid-cols-1 gap-5">
                      <div class="space-y-2 group">
                        <label class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Field: Full Name</label>
                        <input class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" 
                               [(ngModel)]="resume.name" (ngModelChange)="updateResume()">
                      </div>
                      <div class="space-y-2 group">
                        <label class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Field: Professional Email</label>
                        <input class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" 
                               [(ngModel)]="resume.email" (ngModelChange)="updateResume()">
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2 group">
                          <label class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Phone</label>
                          <input class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" 
                                 [(ngModel)]="resume.phone" (ngModelChange)="updateResume()">
                        </div>
                        <div class="space-y-2 group">
                          <label class="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-focus-within:text-zinc-900 transition-colors">Location</label>
                          <input class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all" 
                                 [(ngModel)]="resume.location" (ngModelChange)="updateResume()">
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Professional Abstract</h3>
                    <textarea class="w-full h-40 bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-sm leading-relaxed text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 resize-none transition-all placeholder:italic" 
                              [(ngModel)]="resume.summary" (ngModelChange)="updateResume()" placeholder="Synthesize your executive presence..."></textarea>
                  </div>
                </div>
              </mat-tab>

              <mat-tab>
                <ng-template mat-tab-label>
                  <div class="flex items-center gap-2 py-4">
                    <mat-icon class="text-sm">layers</mat-icon>
                    <span class="text-[10px] uppercase font-black tracking-widest">Experience</span>
                  </div>
                </ng-template>
                <div class="p-8 space-y-6">
                   <div class="flex items-center justify-between">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Section Stack</h3>
                     <button mat-icon-button (click)="addSection()" class="hover:bg-zinc-100"><mat-icon class="text-sm">add</mat-icon></button>
                   </div>
                   
                   <div class="space-y-4">
                     @for (section of resume.sections; track section.id) {
                       <div class="p-1 bg-zinc-50 border border-zinc-100 rounded-2xl group transition-all" [class.ring-2]="activeSectionId() === section.id" [class.ring-zinc-900]="activeSectionId() === section.id">
                          <div class="p-4 flex items-center justify-between cursor-pointer" (click)="activeSectionId.set(section.id)">
                            <div class="flex items-center gap-3">
                              <mat-icon class="text-zinc-300 scale-75">drag_indicator</mat-icon>
                              <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-900">{{ section.title || 'Untitled Segment' }}</span>
                            </div>
                            <button mat-icon-button (click)="$event.stopPropagation(); removeSection(section.id)" class="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all scale-75">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                          @if (activeSectionId() === section.id) {
                            <div class="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                               <input class="w-full bg-white border border-zinc-200 rounded-lg p-3 text-[10px] font-black uppercase tracking-widest text-zinc-800 focus:outline-none" 
                                      [(ngModel)]="section.title" (ngModelChange)="updateResume()">
                               <textarea class="w-full h-32 bg-white border border-zinc-200 rounded-lg p-4 text-xs leading-relaxed text-zinc-600 focus:outline-none resize-none" 
                                         [(ngModel)]="section.content" (ngModelChange)="updateResume()"></textarea>
                               
                               <button mat-stroked-button class="w-full !border-zinc-200 !text-zinc-600 !rounded-xl h-10 !text-[9px] !font-black !uppercase !tracking-widest"
                                       (click)="enhanceSection(section)" [disabled]="enhancingSections().has(section.id)">
                                  @if (enhancingSections().has(section.id)) {
                                    <mat-icon class="animate-spin scale-75">sync</mat-icon> AI Reshaping...
                                  } @else {
                                    <mat-icon class="scale-75 mr-1">auto_awesome</mat-icon> AI Optimization
                                  }
                               </button>
                            </div>
                          }
                       </div>
                     }
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
                     <div class="grid grid-cols-1 gap-3">
                        <div class="p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between"
                             [class.border-zinc-900]="template() === 'minimal'" [class.bg-zinc-900]="template() === 'minimal'" [class.text-white]="template() === 'minimal'"
                             [class.border-zinc-100]="template() !== 'minimal'" [class.bg-white]="template() !== 'minimal'"
                             (click)="template.set('minimal')">
                          <span class="text-[10px] font-black uppercase tracking-widest">Swiss Minimalist</span>
                          <mat-icon class="scale-75 opacity-50">check_circle</mat-icon>
                        </div>
                        <div class="p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between"
                             [class.border-zinc-900]="template() === 'modern'" [class.bg-zinc-900]="template() === 'modern'" [class.text-white]="template() === 'modern'"
                             [class.border-zinc-100]="template() !== 'modern'" [class.bg-white]="template() !== 'modern'"
                             (click)="template.set('modern')">
                          <span class="text-[10px] font-black uppercase tracking-widest">Bento Modern</span>
                          <mat-icon class="scale-75 opacity-50">check_circle</mat-icon>
                        </div>
                        <div class="p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between"
                             [class.border-zinc-900]="template() === 'classic'" [class.bg-zinc-900]="template() === 'classic'" [class.text-white]="template() === 'classic'"
                             [class.border-zinc-100]="template() !== 'classic'" [class.bg-white]="template() !== 'classic'"
                             (click)="template.set('classic')">
                          <span class="text-[10px] font-black uppercase tracking-widest">Ivy League Classic</span>
                          <mat-icon class="scale-75 opacity-50">check_circle</mat-icon>
                        </div>
                     </div>
                  </div>

                  <div class="space-y-4">
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Global Scale</h3>
                     <div class="px-2">
                       <input type="range" min="50" max="150" [(ngModel)]="scale" class="w-full accent-zinc-900 h-1 rounded-full cursor-pointer">
                       <div class="flex justify-between mt-4">
                         <span class="text-[8px] font-black uppercase tracking-widest text-zinc-400">Micro (50%)</span>
                         <span class="text-[8px] font-black uppercase tracking-widest text-zinc-900">{{ scale() }}%</span>
                         <span class="text-[8px] font-black uppercase tracking-widest text-zinc-400">Macro (150%)</span>
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
               <span class="text-[8px] font-black uppercase tracking-widest text-zinc-900 animate-pulse">Syncing...</span>
             </div>
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
              @if (template() === 'minimal') {
                <div class="p-16 space-y-12 h-full flex flex-col">
                  <header class="text-center pt-8">
                    <h1 class="text-6xl font-black tracking-tighter text-zinc-900 mb-6 uppercase">{{ resume.name || 'UNNAMED_ENTITY' }}</h1>
                    <div class="flex flex-wrap justify-center gap-x-8 gap-y-3 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-y border-zinc-100 py-4 max-w-xl mx-auto">
                      <span>{{ resume.email }}</span>
                      <span>{{ resume.phone }}</span>
                      <span>{{ resume.location }}</span>
                    </div>
                  </header>

                  <section class="max-w-xl mx-auto text-center">
                    <p class="text-lg leading-relaxed text-zinc-600 font-medium italic">"{{ resume.summary }}"</p>
                  </section>

                  <div class="flex-1 space-y-12 pt-8">
                    @for (section of resume.sections; track section.id) {
                      <section class="group">
                        <h3 class="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-6">
                          {{ section.title }}
                          <span class="flex-1 h-px bg-zinc-100"></span>
                        </h3>
                        <div class="whitespace-pre-wrap text-zinc-700 leading-relaxed text-sm pl-8 border-l border-zinc-100">{{ section.content }}</div>
                      </section>
                    }
                  </div>
                  
                  <footer class="pt-20 text-center opacity-20">
                    <p class="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-900">Generated via Creative Studio System</p>
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
        </main>
        
        <!-- SIDEBAR: RIGHT (Contextual Properties) -->
        <aside class="w-72 bg-white border-l border-zinc-200 shrink-0 p-8 hidden xl:flex flex-col">
           <header class="mb-10">
              <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Properties</h3>
              <p class="text-xs font-bold text-zinc-900">Element Inspector</p>
           </header>
           
           @if (activeSectionId()) {
              <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div class="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-3">
                    <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                       <mat-icon class="scale-75">text_fields</mat-icon>
                    </div>
                    <div>
                       <p class="text-[8px] font-black uppercase tracking-widest text-zinc-400">Object Type</p>
                       <p class="text-[10px] font-black uppercase text-zinc-900">Data Segment</p>
                    </div>
                 </div>

                 <div class="space-y-4">
                    <p class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Content Quality</p>
                    <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                       <div class="flex items-center gap-2 mb-2">
                          <mat-icon class="text-emerald-500 text-sm">auto_awesome</mat-icon>
                          <span class="text-[10px] font-black uppercase text-emerald-700">AI Scoring: 98%</span>
                       </div>
                       <div class="h-1 bg-emerald-200 rounded-full overflow-hidden">
                          <div class="h-full bg-emerald-500 w-[98%]"></div>
                       </div>
                    </div>
                 </div>

                 <div class="pt-4 space-y-3">
                    <button mat-stroked-button class="w-full !border-zinc-200 !text-zinc-600 h-12 !rounded-xl !text-[9px] !font-black !uppercase !tracking-widest">
                       Duplicate Segment
                    </button>
                    <button mat-stroked-button class="w-full !border-zinc-200 !text-zinc-600 h-12 !rounded-xl !text-[9px] !font-black !uppercase !tracking-widest">
                       Export as JSON
                    </button>
                 </div>
              </div>
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
  styles: [`
    @reference "tailwindcss";
    :host { display: block; }
    
    .a4-paper {
      width: 210mm;
      height: 297mm;
      min-width: 210mm;
      min-height: 297mm;
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

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
  `]
})
export class StudioComponent implements AfterViewInit {
  private resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  
  resume = this.resumeService.resumeState();
  template = signal<'minimal' | 'modern' | 'classic'>('minimal');
  scale = signal(75);
  sidebarPosition = signal<'left' | 'right'>('left');
  activeSectionId = signal<string | null>(null);
  enhancingSections = signal(new Set<string>());
  isPremium = this.resumeService.isPremium;

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  ngAfterViewInit() {
    this.autoScale();
  }

  @HostListener('window:resize')
  onResize() {
    this.autoScale();
  }

  autoScale() {
    if (this.canvasContainer) {
      const containerWidth = this.canvasContainer.nativeElement.offsetWidth - 160;
      const paperWidth = 210 * 3.78; // approximation for mm to px at 96dpi
      const ratio = containerWidth / paperWidth;
      this.scale.set(Math.floor(ratio * 100));
    }
  }

  updateResume() {
    this.resumeService.updateResume(this.resume);
  }

  addSection() {
    this.resumeService.addSection();
    this.resume = this.resumeService.resumeState();
    const last = this.resume.sections[this.resume.sections.length - 1];
    if (last) this.activeSectionId.set(last.id);
  }

  removeSection(id: string) {
    this.resumeService.removeSection(id);
    this.resume = this.resumeService.resumeState();
    if (this.activeSectionId() === id) this.activeSectionId.set(null);
  }

  async enhanceSection(section: ResumeSection) {
    this.enhancingSections.update(s => {
      s.add(section.id);
      return new Set(s);
    });
    
    const improved = await this.resumeService.enhanceText(section.content);
    section.content = improved;
    this.updateResume();

    this.enhancingSections.update(s => {
      s.delete(section.id);
      return new Set(s);
    });
  }

  zoomIn() { this.scale.update(s => Math.min(s + 10, 200)); }
  zoomOut() { this.scale.update(s => Math.max(s - 10, 10)); }
  
  toggleSidebarPosition() {
    this.sidebarPosition.update(p => p === 'left' ? 'right' : 'left');
  }

  toggleFullscreen() {
    const el = document.getElementById('resume-canvas');
    if (el?.requestFullscreen) el.requestFullscreen();
  }

  undo() {
    // In a real app, implement a stack for undo/redo
    console.log('Undo logic called');
  }

  async exportPdf() {
    const res = await this.resumeService.checkEligibility();
    if (res.canDownload) {
      this.resumeService.downloadPdf();
    } else {
      this.dialog.open(PaymentDialogComponent, { width: '500px' });
    }
  }

  share() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Studio link replicated. Copied to clipboard.');
  }

  restoreDefaults() {
    if (confirm('Reset document to initial blueprint? (Irreversible)')) {
      // Implementation for reset
    }
  }
}
