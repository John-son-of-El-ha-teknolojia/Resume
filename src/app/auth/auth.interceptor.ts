import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private http: HttpClient) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = localStorage.getItem('jwt');

    if (token) {
      const decoded = decodeJwt(token);
      const exp = decoded?.exp ? decoded.exp * 1000 : 0;
      const now = Date.now();

      // Only refresh if user is active
      const appRoot = document.querySelector('app-root') as any;
      const isActive = appRoot?.__ngContext__?.[8]?.getActivityState?.() ?? true;

      if (isActive && exp - now < 2 * 60 * 1000) {
        return from(
          this.http.post<{ token: string }>('/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).toPromise()
        ).pipe(
          switchMap(res => {
            if (res?.token) {
              localStorage.setItem('jwt', res.token);
              token = res.token;
            }
            const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
            return next.handle(cloned);
          })
        );
      }

      const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}

function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
