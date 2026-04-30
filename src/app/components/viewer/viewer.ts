import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ResumeService } from '../../services/resume';
import { PaymentDialogComponent } from '../payment/payment';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatButtonToggleModule,
    MatDialogModule
  ],
  template: `
    <div class="min-h-screen bg-[#F3F4F6] py-12 px-6 overflow-x-hidden">
      <header class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-4 rounded-2xl border border-zinc-200">
        <div class="flex items-center gap-6">
          <button (click)="backToDashboard()" class="flex items-center gap-2 group">
            <div class="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
              <mat-icon class="text-zinc-500 scale-75 group-hover:text-white">arrow_back</mat-icon>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">Dashboard</span>
          </button>
          <div class="h-6 w-px bg-zinc-200"></div>
          <button (click)="backToStudio()" class="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Studio</button>
          <div class="h-6 w-px bg-zinc-200"></div>
          <h1 class="text-[10px] font-black uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-900 pb-1">Viewer</h1>
        </div>
        
        <div class="flex items-center gap-4">
          <button mat-flat-button class="!bg-zinc-900 !text-white h-10 px-8 rounded-xl !text-[10px] !font-black !uppercase !tracking-widest shadow-xl shadow-zinc-200" (click)="exportPdf()">
            <mat-icon class="mr-1 text-sm">download</mat-icon> Export Document
          </button>
        </div>
      </header>

      <div class="flex justify-center items-start overflow-auto no-scrollbar pb-20">
         <div 
           id="resume-canvas"
           class="a4-paper bg-white shadow-2xl relative shrink-0 overflow-hidden"
           [style.transform]="'scale(' + scale() + ')'"
           [style.height.mm]="(resume().pageCount || 1) * 297"
           [style.font-family]="resume().aesthetics.fontFamily">
           
           <!-- Page Dividers -->
           @for (i of [].constructor((resume().pageCount || 1) - 1); track $index) {
             <div class="absolute w-full h-px border-t border-dashed border-zinc-200 z-[1] pointer-events-none" 
                  [style.top.mm]="($index + 1) * 297">
             </div>
           }
           
           <!-- Elements Layer -->
           <div class="absolute inset-0 pointer-events-none overflow-hidden">
              @for (el of resume().aesthetics.elements; track el.id) {
                 @if (el.isVisible !== false) {
                    <div class="absolute"
                         [style.left]="convertToUnit(el.x, el.unit)"
                         [style.top]="convertToUnit(el.y, el.unit)"
                         [style.width]="convertToUnit(el.width, el.unit)"
                         [style.height]="convertToUnit(el.height, el.unit)"
                         [style.transform]="getTransform(el)">
                       
                       @if (el.type === 'image') {
                          <img [src]="el.url" class="w-full h-full object-cover shadow-sm" referrerpolicy="no-referrer"
                               [style.border-radius.px]="el.style?.['borderRadius'] || 0"
                               [style.opacity]="el.style?.['opacity'] ?? 1"
                               [style.transform]="getImageMirror(el)" alt="">
                       } @else if (el.type === 'line') {
                          <div class="w-full h-full" 
                               [style.border-top-width.px]="el.style?.['thickness'] || 2"
                               [style.border-top-style]="el.style?.['borderStyle'] || 'solid'"
                               [style.border-top-color]="el.style?.['backgroundColor']"></div>
                       } @else if (el.type === 'box') {
                          <div class="w-full h-full flex items-center justify-center text-center p-2" 
                               [style.background-color]="el.style?.['backgroundColor']"
                               [style.border-radius.px]="el.style?.['borderRadius'] || 0"
                               [style.border-width.px]="el.style?.['borderWidth'] || 0"
                               [style.border-style]="el.style?.['borderStyle'] || 'none'"
                               [style.border-color]="el.style?.['borderColor'] || '#e4e4e7'"
                               [style.color]="el.style?.['color'] || '#09090b'"
                               [style.font-size.px]="el.style?.['fontSize'] || 12">
                               {{ el.content }}
                          </div>
                       } @else if (el.type === 'text') {
                          <div class="w-full h-full p-2 outline-none whitespace-pre-wrap" 
                               [style.font-size.px]="el.style?.['fontSize'] || 12"
                               [style.color]="el.style?.['color'] || '#09090b'"
                               [style.font-weight]="el.style?.['fontWeight'] || '400'"
                               [style.text-align]="el.style?.['textAlign'] || 'left'"
                               [style.border]="el.style?.['borderWidth'] ? (el.style?.['borderWidth'] + 'px ' + (el.style?.['borderStyle'] || 'solid') + ' ' + (el.style?.['borderColor'] || '#000')) : 'none'">{{ el.content }}</div>
                       }
                    </div>
                 }
              }
           </div>

           <!-- Standard Layout Content -->
           <div class="px-16 pt-8 pb-16 h-full flex flex-col relative overflow-hidden" [style.background-color]="resume().aesthetics.backgroundColor">
              <header class="flex flex-col justify-center items-center relative overflow-hidden mb-8" 
                      *ngIf="resume().metadataStyle?.isVisible !== false"
                      [style.max-height]="((resume().pageCount || 1) * 297 * 0.05) + 'mm'"
                      [style.transform]="'translate(' + (resume().metadataStyle?.x || 0) + 'px, ' + (resume().metadataStyle?.y || 0) + 'px)'"
                      [style.border]="resume().metadataStyle?.border === 'none' ? 'none' : '1px ' + resume().metadataStyle?.border + ' #e4e4e7'"
                      [style.padding.px]="resume().metadataStyle?.padding"
                      [style.width.px]="resume().metadataStyle?.width">
                 <h1 class="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-zinc-900 uppercase leading-none mb-2" [style.color]="resume().aesthetics.primaryColor">{{ resume().name || 'IDENTITY_UNDEFINED' }}</h1>
                 <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 text-zinc-400 text-[8px] font-black uppercase tracking-[0.2em] py-2 max-w-xl mx-auto border-t border-zinc-100 mt-2">
                    <span>{{ resume().phoneCountryCode }} {{ resume().phone }}</span>
                    <span>{{ resume().email }}</span>
                    <span>{{ resume().location }}</span>
                 </div>
              </header>

              <section class="max-w-xl mx-auto text-center mb-8">
                 <p class="text-xs md:text-sm lg:text-base leading-relaxed text-zinc-600 font-medium italic" [style.color]="resume().aesthetics.primaryColor">"{{ resume().summary }}"</p>
              </section>

              <div class="flex-1 space-y-10 pt-4">
                 @if (resume().experience.length > 0 && resume().experienceStyle?.isVisible !== false) {
                    <section class="space-y-8" [style.transform]="'translate(' + (resume().experienceStyle?.x || 0) + 'px, ' + (resume().experienceStyle?.y || 0) + 'px)'">
                       <h3 class="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-6">
                         Experience
                         <span class="flex-1 h-px bg-zinc-100"></span>
                       </h3>
                       <div class="space-y-10">
                          @for (exp of resume().experience; track exp.id) {
                             <div class="pl-8 border-l border-zinc-100 relative">
                                <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-zinc-900"></div>
                                <div class="flex justify-between items-start mb-2">
                                   <div>
                                      <h4 class="font-black uppercase tracking-widest text-zinc-900 text-sm">{{ exp.company }}</h4>
                                      <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{{ exp.title }}</p>
                                   </div>
                                   <div class="text-right text-[10px] font-black text-zinc-900 uppercase tracking-widest">
                                      {{ exp.startDate }} — {{ exp.current ? 'Present' : exp.endDate }}
                                   </div>
                                </div>
                                <p class="text-sm text-zinc-600 leading-relaxed">{{ exp.content }}</p>
                             </div>
                          }
                       </div>
                    </section>
                 }

                 @if (resume().skills.length > 0) {
                    <section class="space-y-12 pb-12">
                       <h3 class="text-xs font-black tracking-[0.3em] uppercase text-zinc-400 mb-6 flex items-center gap-6">
                         Skills
                         <span class="flex-1 h-px bg-zinc-100"></span>
                       </h3>
                       <div class="grid grid-cols-2 gap-x-12 gap-y-8">
                          @for (skill of resume().skills; track skill.name) {
                             <div class="space-y-3">
                                <div class="flex justify-between items-end mb-1">
                                   <span class="text-[10px] font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-900 pb-1">{{ skill.name }}</span>
                                   @if (skill.displayMode !== 'text') {
                                     <span class="text-[9px] font-black text-zinc-400">{{ skill.level }}%</span>
                                   }
                                </div>
                                
                                @if (skill.displayMode === 'horizontal_bar') {
                                   <div class="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                      <div class="h-full bg-zinc-900" [style.width.%]="skill.level"></div>
                                   </div>
                                }
                                @if (skill.displayMode === 'vertical_bar') {
                                   <div class="h-20 w-8 bg-zinc-100 rounded-lg overflow-hidden relative mx-auto">
                                      <div class="absolute bottom-0 left-0 right-0 bg-zinc-900" [style.height.%]="skill.level"></div>
                                   </div>
                                }
                             </div>
                          }
                       </div>
                    </section>
                 }
              </div>

              <footer class="absolute bottom-8 left-0 right-0 text-center opacity-40 flex flex-col items-center gap-2 pointer-events-none">
                 @if (qrCodeUrl()) {
                    <img [src]="qrCodeUrl()" class="w-10 h-10 grayscale" alt="Portfolio QR Code">
                    <p class="text-[5px] font-black uppercase tracking-widest text-zinc-900">Scan for Portfolio Link</p>
                 }
              </footer>
           </div>
         </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .a4-paper {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
    }
    @media (max-width: 210mm) {
      .a4-paper {
        width: 100vw;
        height: auto;
        min-height: 100vh;
      }
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ViewerComponent {
  private resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  
  resume = this.resumeService.resumeState;
  isPremium = this.resumeService.isPremium;
  scale = signal(1);
  qrCodeUrl = signal("");

  constructor() {
    this.generateQRCode();
  }

  async generateQRCode() {
    const url = this.resume().skillUrl || `https://resume-studio.app/v/${this.resume().name.replace(/\s+/g, '-').toLowerCase()}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        margin: 2,
        width: 256,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      this.qrCodeUrl.set(qrDataUrl);
    } catch (err) {
      console.error('QR Generation failed:', err);
    }
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  backToStudio() {
    this.router.navigate(['/writer']);
  }

  convertToUnit(value: number, unit?: string): string {
    if (!unit || unit === "px") return value + "px";
    return value + unit;
  }

  getTransform(el: any): string {
    let transform = "";
    if (el.rotation) transform += ` rotate(${el.rotation}deg)`;
    return transform || "none";
  }

  getImageMirror(el: any): string {
    let mirror = "";
    if (el.mirror?.horizontal) mirror += " scaleX(-1)";
    if (el.mirror?.vertical) mirror += " scaleY(-1)";
    return mirror || "none";
  }

  async exportPdf() {
    const res = await this.resumeService.checkEligibility();
    if (res.canDownload) {
      this.resumeService.downloadPdf();
    } else {
      this.dialog.open(PaymentDialogComponent, { width: '500px' });
    }
  }
}
