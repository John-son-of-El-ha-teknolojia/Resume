import { ChangeDetectionStrategy, Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PdfAiService } from '../../services/pdf-ai';

// Configure PDF.js worker (using legacy build for better compatibility)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js`;

interface ResumeSection {
  id: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

@Component({
  selector: 'app-pdf-editor',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pdf-editor.html',
  styles: [`
    .editor-container {
      background: radial-gradient(circle at top left, #f9fafb, #f3f4f6);
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f4f4f5;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e4e4e7;
      border-radius: 10px;
    }
  `]
})
export class PdfEditorComponent {
  private router = inject(Router);
  private pdfAi = inject(PdfAiService);
  
  isUploading = signal(false);
  isProcessing = signal(false);
  isAiLoading = signal<string | null>(null);
  sections = signal<ResumeSection[]>([]);
  isSyncing = signal(false);
  showCoverLetter = signal(false);
  generatedCoverLetter = signal('');
  originalFileName = signal<string | null>(null);

  constructor() {
    // Auto-save effect
    effect(() => {
      const currentSections = this.sections();
      if (currentSections.length > 0) {
        // Debounce would be better here, but for simplicity we'll just log or trigger a save
        // In a real app we'd use a subject.debounceTime
        console.log('Blueprint JSON updated, syncing with backend...');
        this.pdfAi.saveBlueprint(currentSections);
      }
    });
  }

  async saveBlueprint() {
    this.isSyncing.set(true);
    try {
      await this.pdfAi.saveBlueprint(this.sections());
    } finally {
      // Small timeout to show the syncing state for UX
      setTimeout(() => this.isSyncing.set(false), 1000);
    }
  }
  
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    
    this.isUploading.set(true);
    this.originalFileName.set(file.name);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (result instanceof ArrayBuffer) {
          const typedarray = new Uint8Array(result);
          await this.parsePdf(typedarray);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading PDF:', error);
      this.isUploading.set(false);
    }
  }

  async parsePdf(data: Uint8Array) {
    this.isProcessing.set(true);
    try {
      const loadingTask = pdfjsLib.getDocument(data);
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        }).join(' ');
        fullText += pageText + '\n';
      }

      this.processRawText(fullText);
    } catch (error) {
      console.error('Error parsing PDF:', error);
    } finally {
      this.isProcessing.set(false);
      this.isUploading.set(false);
    }
  }

  processRawText(text: string) {
    const sectionNames = ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS', 'SUMMARY', 'CONTACT', 'CERTIFICATIONS', 'LANGUAGES'];
    const lines = text.split('\n');
    const detectedSections: ResumeSection[] = [];
    
    let currentSection: ResumeSection = { id: 'contact', title: 'CONTACT', content: '' };
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const matchedSection = sectionNames.find(s => trimmed.toUpperCase().includes(s) && trimmed.length < 20);
      
      if (matchedSection) {
        if (currentSection.content.trim()) {
          detectedSections.push({ ...currentSection });
        }
        currentSection = { 
          id: matchedSection.toLowerCase() + '-' + Math.random().toString(36).substring(2, 5), 
          title: matchedSection, 
          content: '' 
        };
      } else {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection.content.trim()) {
      detectedSections.push(currentSection);
    }
    
    this.sections.set(detectedSections.length > 1 ? detectedSections : [{ id: 'raw', title: 'RESUME CONTENT', content: text }]);
  }

  async aiAction(section: ResumeSection, action: 'rewrite' | 'shorten' | 'expand' | 'ats') {
    this.isAiLoading.set(section.id);
    try {
      const newContent = await this.pdfAi.processAction(section.content, action);
      this.sections.update(secs => secs.map(s => s.id === section.id ? { ...s, content: newContent } : s));
    } finally {
      this.isAiLoading.set(null);
    }
  }

  async generateCoverLetter() {
    this.isAiLoading.set('cover-letter');
    try {
      const resumeContent = this.sections().map(s => `${s.title}:\n${s.content}`).join('\n\n');
      const letter = await this.pdfAi.generateCoverLetter(resumeContent);
      this.generatedCoverLetter.set(letter);
      this.showCoverLetter.set(true);
    } finally {
      this.isAiLoading.set(null);
    }
  }

  addSection() {
    const newSection: ResumeSection = {
      id: 'custom-' + Date.now(),
      title: 'NEW SECTION',
      content: '',
      isCustom: true
    };
    this.sections.update(s => [...s, newSection]);
  }

  removeSection(id: string) {
    this.sections.update(s => s.filter(sec => sec.id !== id));
  }

  async exportPdf() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const content = document.getElementById('pdf-render-canvas');
    if (!content) return;

    try {
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(this.originalFileName()?.replace('.pdf', '_edited.pdf') || 'resume_edited.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
