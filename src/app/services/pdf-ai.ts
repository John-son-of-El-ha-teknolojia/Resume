import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfAiService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'https://resume-backend-777-5555-1.onrender.com';

  // Supported models to be handled by the backend
  public readonly SUPPORTED_MODELS = [
    { id: 'python-ai-pro', name: 'Python AI Pro (High Precision)' },
    { id: 'python-ai-base', name: 'Python AI Base (Fast)' },
    { id: 'python-ai-custom', name: 'Python Custom AI' }
  ];

  private selectedModelId = 'python-ai-pro';

  setModel(modelId: string) {
    this.selectedModelId = modelId;
  }

  getSelectedModel() {
    return this.selectedModelId;
  }

  async processAction(text: string, action: 'rewrite' | 'shorten' | 'expand' | 'ats'): Promise<string> {
    if (!text.trim()) return text;
    try {
      const response = await firstValueFrom(
        this.http.post<{ result: string }>(`${this.API_BASE}/api/ai/process-pdf-text`, { 
          text, 
          action,
          model: this.selectedModelId
        })
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
        this.http.post<{ result: string }>(`${this.API_BASE}/api/ai/generate-cover-letter`, { 
          resumeContent,
          model: this.selectedModelId
        })
      );
      return response.result;
    } catch (error) {
      console.error('Cover letter generation error:', error);
      return 'Failed to generate cover letter. Please try again.';
    }
  }

  async saveBlueprint(sections: unknown[]): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.API_BASE}/api/ai/save-blueprint`, { sections }));
      return true;
    } catch (error) {
      console.error('Error saving blueprint:', error);
      return false;
    }
  }
}
