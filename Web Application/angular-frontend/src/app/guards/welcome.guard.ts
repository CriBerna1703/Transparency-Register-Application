import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class WelcomeGuard implements CanActivate {

  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    const seen = localStorage.getItem('welcome_seen');
    return seen ? true : this.router.parseUrl('/welcome');
  }
}
