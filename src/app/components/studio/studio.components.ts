import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeService, ResumeData } from '../../services/resume';
import { SidebarComponent } from './sidebar.component';
import { CanvasComponent } from './canvas.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, 
    CanvasComponent,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './studio.component.html',
  styles: [`
    @reference "tailwindcss";
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class StudioComponent {
  public resumeService = inject(ResumeService);
  
  resume = this.resumeService.resumeState();
  sidebarPosition = signal<'left' | 'right'>('left');

  updateResume(updatedResume: ResumeData) {
    this.resume = updatedResume;
    this.resumeService.updateResume(this.resume);
    this.resumeService.commit();
  }
}
