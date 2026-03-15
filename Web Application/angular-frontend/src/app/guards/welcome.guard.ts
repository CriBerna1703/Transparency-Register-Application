import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class WelcomeGuard implements CanActivate {

  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    const seen = localStorage.getItem('welcome_seen');
    const email = localStorage.getItem('user_email');

    if (seen && email) {
      return true;
    }

    return this.router.parseUrl('/welcome');
  }
}
