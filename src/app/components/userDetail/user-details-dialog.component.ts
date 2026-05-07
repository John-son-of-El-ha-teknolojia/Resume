import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-user-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="text-xl font-black text-slate-800 uppercase tracking-tight">
      User Details
    </h2>
    <mat-dialog-content class="space-y-4">
      <p><strong>Name:</strong> {{ resume().name }}</p>
      <p><strong>Email:</strong> {{ resume().email }}</p>
      <p><strong>Subscription:</strong> 
        @if (isPremium()) {
          Premium
        } @else {
          Free Tier
        }
      </p>
      <p><strong>Downloads Remaining:</strong> 
        @if (hasFreeDownloadLeft()) {
          1 Free Export
        } @else {
          0 Free Exports
        }
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class UserDetailsDialogComponent {
  private resumeService = inject(ResumeService);
  resume = this.resumeService.resumeState;
  isPremium = this.resumeService.isPremium;
  hasFreeDownloadLeft = this.resumeService.hasFreeDownloadLeft;
}
