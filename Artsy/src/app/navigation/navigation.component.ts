import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css',
})
export class NavigationComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  currentUser: any = null;

  private authSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authSubscription.add(
      this.authService.isAuthenticated$.subscribe((isAuth) => {
        this.isLoggedIn = isAuth;

        if (isAuth && !this.currentUser) {
          this.loadUserProfile();
        }
      })
    );

    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      })
    );

    if (this.authService.isLoggedIn()) {
      this.loadUserProfile();
    }
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  private loadUserProfile() {
    this.apiService.getProfile().subscribe({
      next: (response) => {
        console.log('User profile loaded');
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
        if (error.status === 401) {
          this.authService.clearAuthenticationState();
        }
      },
    });
  }
}
