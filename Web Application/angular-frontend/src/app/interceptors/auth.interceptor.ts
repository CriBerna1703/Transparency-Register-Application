import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const email = localStorage.getItem('user_email');

    if (!email) {
      return next.handle(req);
    }

    const cloned = req.clone({
      setHeaders: {
        'x-user-email': email
      }
    });

    return next.handle(cloned);
  }
}