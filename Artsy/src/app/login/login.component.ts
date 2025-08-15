import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  onLogin() {
    this.error = '';
    this.success = '';

    // Validation
    if (!this.email || !this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;

    this.apiService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          if (response.error) {
            this.error = response.error;
            this.loading = false;
          } else if (response.token && response.user) {
            this.success = 'Login successful! Redirecting...';
            this.apiService.saveToken(response.token);

            setTimeout(() => {
              this.router.navigate(['/']);
            }, 1000);
          } else {
            this.error = 'Unexpected response from server';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.error =
            error.error?.error ||
            error.error?.message ||
            'Login failed. Please try again.';
          this.loading = false;
        },
      });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
