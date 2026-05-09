import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ResumeService } from '../../services/resume';
import {
//   Component,
  inject,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { PaymentDialogComponent } from "../payment/payment";
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-properties',
  templateUrl: './propperties.component.html',
  styleUrls: ['./studio.component.css'],
  imports:[CommonModule, MatIconModule, MatButtonModule, MatTooltipModule]
})
export class PropertiesComponent {
//   @Input() resume: any;
  @Output() resumeChange = new EventEmitter<any>();
  public resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  selectedElementIds = new Set<string>();
  resume = this.resumeService.resumeState();
//   isPremium = this.resumeService.isPremium;

  

  updateResume() {
    this.resumeChange.emit(this.resume);
  }

  // Navigation
  backToDashboard() {
    this.router.navigate(["/dashboard"]);
  }
  goToViewer() {
    console.log('Go to viewer');
  }

  // Model selection
   onModelChange(event: any) {
    this.resumeService.setModel(event.target.value);
  }

  // Undo/Redo
  undo() {
    this.resumeService.undo();
    this.resume = this.resumeService.resumeState();
  }

  redo() {
    this.resumeService.redo();
    this.resume = this.resumeService.resumeState();
  }

  // Alignment

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


  // Premium actions
  isPremium() {
    return this.resumeService.isPremium();
  }

  saveToCloud() {
    console.log('Save to cloud');
  }

  // Export/Share
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

}
