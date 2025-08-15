import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isBrowser: boolean;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  setAuthenticationState(user: User, token: string): void {
    this.saveToken(token);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  updateUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  clearAuthenticationState(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  saveToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  removeToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
