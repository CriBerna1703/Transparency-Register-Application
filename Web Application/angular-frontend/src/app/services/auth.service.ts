import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async login(email: string): Promise<any> {

    const res: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}/users/login`, { email })
    );

    localStorage.setItem('user_email', res.email);
    localStorage.setItem('user_admin', res.isAdmin);

    return res;
  }

  logout() {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_admin');
  }

  getEmail() {
    return localStorage.getItem('user_email');
  }

  isAdmin() {
    return localStorage.getItem('user_admin') === 'true';
  }

  isLogged() {
    return !!localStorage.getItem('user_email');
  }
}