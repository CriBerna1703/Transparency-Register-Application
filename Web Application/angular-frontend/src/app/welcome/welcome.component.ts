import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  showVideo = false;
  email = '';
  emailError = false;
  alreadyLogged = false;

  ngOnInit() {
    const savedEmail = this.auth.getEmail();
    if (savedEmail) {
      this.email = savedEmail;
      this.alreadyLogged = true;
    }
  }

  logout() {
    this.auth.logout();
    localStorage.removeItem('welcome_seen');
    this.email = '';
    this.alreadyLogged = false;
  }

  playVideo() {
    this.showVideo = true;
  }

  skip() {
    this.enterApp();
  }

  async enterApp() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(this.email)) {
      this.emailError = true;
      return;
    }

    await this.auth.login(this.email);

    localStorage.setItem('welcome_seen', 'true');

    this.router.navigateByUrl('/');
  }
}
