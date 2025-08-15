import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css',
})
export class LogoutComponent implements OnInit {
  currentUser: any = null;
  loading: boolean = false;
  isLoggedIn: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    const token = this.apiService.getToken();
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.apiService.getProfile().subscribe({
      next: (response) => {
        this.currentUser = response.user;
        this.isLoggedIn = true;
      },
      error: (error) => {
        console.error('Error getting profile:', error);
        this.router.navigate(['/']);
      },
    });
  }

  confirmLogout() {
    this.loading = true;

    this.apiService.logout().subscribe({
      next: () => {},
      error: (error) => {
        console.error('Logout API error:', error);
      },
      complete: () => {
        this.apiService.removeToken();
        this.isLoggedIn = false;
        this.currentUser = null;

        window.dispatchEvent(new CustomEvent('authStatusChanged'));

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      },
    });
  }

  cancelLogout() {
    this.router.navigate(['/']);
  }
}
