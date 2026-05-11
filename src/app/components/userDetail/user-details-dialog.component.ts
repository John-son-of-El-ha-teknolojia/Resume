import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ResumeService } from '../../services/resume';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResumeData } from '../../services/resume';

@Component({
  selector: 'app-user-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="text-xl font-black text-slate-800 uppercase tracking-tight">
      User Details
    </h2>
    <mat-dialog-content class="space-y-4">
      <p><strong>Name:</strong> {{ data.name }}</p>
      <p><strong>Email:</strong> {{ data.email }}</p>
      <p><strong>Email Status:</strong>
        <span [ngClass]="data.otpCode ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'">
          {{ data.otpCode ? 'Verified' : 'Not Verified' }}
        </span>
      </p>
      <p><strong>Downloads Remaining:</strong>
        <span *ngIf="data.tier !== 'free'">Unlimited Exports</span>
        <span *ngIf="data.tier === 'free'">
          {{ data.freeDownloadsUsed === 0 ? '1 Free Export' : '0 Free Exports' }}
        </span>
      </p>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class UserDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ResumeData) {}
}
