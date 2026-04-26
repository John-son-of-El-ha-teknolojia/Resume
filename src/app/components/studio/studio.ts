import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { ResumeService, ResumeSection, ResumeElement } from '../../services/resume';
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
    MatButtonToggleModule,
    MatSliderModule,
    DragDropModule
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
                     } @empty {
                       <div class="py-12 text-center space-y-4 opacity-40 border-2 border-dashed border-zinc-100 rounded-2xl">
                          <mat-icon class="scale-[1.5] text-zinc-300">layers_clear</mat-icon>
                          <p class="text-[8px] font-black uppercase tracking-widest text-zinc-400">Empty Stack</p>
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
                     <h3 class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Typography</h3>
                     <div class="grid grid-cols-1 gap-2">
                        @for (font of fonts; track font) {
                          <button class="p-4 rounded-xl border text-[10px] font-bold transition-all text-left flex items-center justify-between"
                                  [class.border-zinc-900]="resume.aesthetics.fontFamily === font"
                                  [class.bg-zinc-900]="resume.aesthetics.fontFamily === font"
                                  [class.text-white]="resume.aesthetics.fontFamily === font"
                                  [class.border-zinc-50]="resume.aesthetics.fontFamily !== font"
                                  (click)="resume.aesthetics.fontFamily = font; updateResume()"
                                  [style.font-family]="font">
                            {{ font }}
                            <mat-icon class="scale-50 opacity-40">font_download</mat-icon>
                          </button>
                        }
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
                             [style.transform]="getImageMirror(el)">
                      } @else if (el.type === 'line') {
                        <div class="w-full h-full" [style.background-color]="el.style?.backgroundColor" 
                             [class.border-t-2]="el.style?.borderStyle === 'dashed' || el.style?.borderStyle === 'dotted'"
                             [style.border-top-style]="el.style?.borderStyle || 'solid'"
                             [style.border-top-color]="el.style?.backgroundColor"></div>
                      } @else if (el.type === 'box') {
                        <div class="w-full h-full border border-zinc-200" [style.background-color]="el.style?.backgroundColor"
                             [style.border-radius.px]="el.style?.borderRadius || 0"
                             [style.border-width.px]="el.style?.borderWidth || 1"
                             [style.border-style]="el.style?.borderStyle || 'solid'"
                             [style.border-color]="el.style?.borderColor || '#e4e4e7'"></div>
                      } @else if (el.type === 'text') {
                        <div class="w-full h-full p-2 outline-none whitespace-pre-wrap select-text" 
                             [style.font-size.px]="el.style?.fontSize || 12"
                             [style.color]="el.style?.color || '#09090b'"
                             [style.font-weight]="el.style?.fontWeight || '400'"
                             [style.text-align]="el.style?.textAlign || 'left'"
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
                                   <input type="color" [(ngModel)]="activeEl.style.backgroundColor" (ngModelChange)="updateResume()" class="w-12 h-10 rounded-lg cursor-pointer bg-white border border-zinc-100">
                                   <input type="text" [(ngModel)]="activeEl.style.backgroundColor" (ngModelChange)="updateResume()" class="flex-1 bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                </div>
                             </div>
                          </div>
                       }

                       @if (activeEl.type === 'box') {
                          <div class="space-y-3 pt-2">
                             <div class="grid grid-cols-2 gap-2">
                                <div class="space-y-1">
                                   <label class="text-[8px] font-black text-zinc-300 uppercase">Border Radius</label>
                                   <input type="number" [(ngModel)]="activeEl.style.borderRadius" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold">
                                </div>
                                <div class="space-y-1">
                                   <label class="text-[8px] font-black text-zinc-300 uppercase">Border Width</label>
                                   <input type="number" [(ngModel)]="activeEl.style.borderWidth" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold">
                                </div>
                             </div>
                             <div class="space-y-1">
                                <label class="text-[8px] font-black text-zinc-300 uppercase">Border Color</label>
                                <input type="color" [(ngModel)]="activeEl.style.borderColor" (ngModelChange)="updateResume()" class="w-full h-8 rounded-md cursor-pointer">
                             </div>
                          </div>
                       }

                       @if (activeEl.type === 'text') {
                          <div class="space-y-4">
                             <div class="grid grid-cols-2 gap-2">
                               <div class="space-y-1">
                                  <label class="text-[8px] font-black text-zinc-300 uppercase">Font Size</label>
                                  <input type="number" [(ngModel)]="activeEl.style.fontSize" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold">
                               </div>
                               <div class="space-y-1">
                                  <label class="text-[8px] font-black text-zinc-300 uppercase">Text Align</label>
                                  <select [(ngModel)]="activeEl.style.textAlign" (ngModelChange)="updateResume()" class="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-[10px] font-black uppercase">
                                     <option value="left">Left</option>
                                     <option value="center">Center</option>
                                     <option value="right">Right</option>
                                  </select>
                               </div>
                             </div>
                             <div class="space-y-1">
                                <label class="text-[8px] font-black text-zinc-300 uppercase">Text Color</label>
                                <input type="color" [(ngModel)]="activeEl.style.color" (ngModelChange)="updateResume()" class="w-full h-8 rounded-md cursor-pointer">
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
    ::ng-deep .studio-toggle-group .mat-button-toggle .mat-button-toggle-label-content {
      font-size: 8px !important;
      font-weight: 900 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
    }
  `]
})
export class StudioComponent implements AfterViewInit {
  private resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  
  resume = this.resumeService.resumeState();
  template = signal<string>('minimal');
  scale = signal(75);
  sidebarPosition = signal<'left' | 'right'>('left');
  activeSectionId = signal<string | null>(null);
  activeElementId = signal<string | null>(null);
  enhancingSections = signal(new Set<string>());
  isPremium = this.resumeService.isPremium;

  frameworks = [
    { id: 'blank', name: 'Ultra Blank' },
    { id: 'minimal', name: 'Swiss Minimalist' },
    { id: 'modern', name: 'Bento Modern' },
    { id: 'classic', name: 'Ivy League Classic' },
    { id: 'executive', name: 'Premium Executive' },
    { id: 'creative', name: 'Gradient Bold' },
    { id: 'technical', name: 'Dev Console' },
    { id: 'startup', name: 'Monochrome Startup' },
    { id: 'academic', name: 'Oxford Serif' },
    { id: 'brutalist', name: 'Neo-Brutalist' },
    { id: 'glitch', name: 'Digital Glitch' },
    { id: 'elegant', name: 'Vogue Editorial' },
  ];

  fonts = ['Inter', 'Space Grotesk', 'Outfit', 'Playfair Display', 'JetBrains Mono', 'Fira Code', 'Montserrat', 'Roboto', 'Syne', 'Clash Display'];

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  
  onImageTrigger(input: HTMLInputElement) {
    input.click();
  }

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
    this.activeElementId.set(null);
  }

  removeSection(id: string) {
    this.resumeService.removeSection(id);
    this.resume = this.resumeService.resumeState();
    if (this.activeSectionId() === id) this.activeSectionId.set(null);
  }

  getIconForType(type: string): string {
    switch(type) {
      case 'image': return 'image';
      case 'line': return 'horizontal_rule';
      case 'box': return 'crop_square';
      case 'text': return 'title';
      default: return 'help_outline';
    }
  }

  convertToUnit(value: number, unit?: string): string {
    if (!unit || unit === 'px') return value + 'px';
    return value + unit;
  }

  getTransform(el: ResumeElement): string {
    let transform = '';
    if (el.rotation) transform += ` rotate(${el.rotation}deg)`;
    return transform || 'none';
  }

  getImageMirror(el: ResumeElement): string {
    let mirror = '';
    if (el.mirror?.horizontal) mirror += ' scaleX(-1)';
    if (el.mirror?.vertical) mirror += ' scaleY(-1)';
    return mirror || 'none';
  }

  addElement(type: 'image' | 'line' | 'box' | 'text') {
    const newElement: ResumeElement = {
      id: Math.random().toString(36).substring(7),
      type,
      x: 300,
      y: 300,
      width: type === 'line' ? 400 : 200,
      height: type === 'line' ? 2 : (type === 'text' ? 100 : 200),
      rotation: 0,
      isLocked: false,
      isVisible: true,
      unit: 'px',
      content: type === 'text' ? 'Double click to edit text...' : undefined,
      url: type === 'image' ? 'https://picsum.photos/seed/' + Math.random() + '/400/400' : undefined,
      style: { 
        backgroundColor: type === 'line' ? '#09090b' : (type === 'box' ? 'transparent' : 'transparent'),
        borderStyle: 'solid',
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#e4e4e7',
        fontSize: 14,
        color: '#09090b',
        fontWeight: '400',
        textAlign: 'left'
      }
    };
    this.resume.aesthetics.elements.unshift(newElement); // Add to top of stack
    this.updateResume();
    this.activeElementId.set(newElement.id);
    this.activeSectionId.set(null);
  }

  removeElement(id: string) {
    this.resume.aesthetics.elements = this.resume.aesthetics.elements.filter(el => el.id !== id);
    this.updateResume();
    if (this.activeElementId() === id) this.activeElementId.set(null);
  }

  getActiveElement() {
    return this.resume.aesthetics.elements.find(el => el.id === this.activeElementId());
  }

  onDragEnd(event: CdkDragEnd, element: ResumeElement) {
    const { x, y } = event.source.getFreeDragPosition();
    // Element position is relative to its starting point in cdkDrag usually
    // but we can update its state x and y.
    // However, if we use [cdkDragFreeDragPosition] it's better.
    // For now, let's just calculate the new position.
    
    // Actually, getFreeDragPosition returns the offset from start.
    // I'll update the resume state with the NEW total position.
    element.x += x;
    element.y += y;
    
    // Reset the internal position of cdkDrag so it doesn't "double add" next time
    event.source.reset();
    
    this.updateResume();
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const url = e.target.result;
        const newElement: ResumeElement = {
          id: Math.random().toString(36).substring(7),
          type: 'image',
          x: 200,
          y: 200,
          width: 200,
          height: 200,
          rotation: 0,
          isLocked: false,
          isVisible: true,
          unit: 'px',
          mirror: { horizontal: false, vertical: false },
          url: url,
          style: {}
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
