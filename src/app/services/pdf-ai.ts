import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfAiService {
  private http = inject(HttpClient);

  async processAction(text: string, action: 'rewrite' | 'shorten' | 'expand' | 'ats'): Promise<string> {
    if (!text.trim()) return text;
    try {
      const response = await firstValueFrom(
        this.http.post<{ result: string }>('/api/ai/process-pdf-text', { text, action })
      );
      return response.result;
    } catch (error) {
      console.error(`AI ${action} error:`, error);
      return text;
    }
  }

  async generateCoverLetter(resumeContent: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ result: string }>('/api/ai/generate-cover-letter', { resumeContent })
      );
      return response.result;
    } catch (error) {
      console.error('Cover letter generation error:', error);
      return 'Failed to generate cover letter. Please try again.';
    }
  }

  async saveBlueprint(sections: any[]): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post('/api/ai/save-blueprint', { sections }));
      return true;
    } catch (error) {
      console.error('Error saving blueprint:', error);
      return false;
    }
  }
}
