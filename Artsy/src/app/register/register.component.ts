// src/app/register/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  repass: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  onRegister() {
    this.error = '';
    this.success = '';

    // Validation
    if (!this.username || !this.email || !this.password || !this.repass) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    if (this.password !== this.repass) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.username.length < 3) {
      this.error = 'Username must be at least 3 characters long';
      return;
    }

    this.loading = true;

    const userData = {
      username: this.username,
      email: this.email,
      password: this.password,
      repass: this.repass,
    };

    this.apiService.register(userData).subscribe({
      next: (response) => {
        if (response.error) {
          this.error = response.error;
          this.loading = false;
        } else if (response.message && response.user && response.token) {
          this.success = 'Registration successful! Redirecting to Home page...';
          this.loading = false;

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        } else {
          this.error =
            'Registration completed but received unexpected response';
          this.loading = false;
        }
      },
      error: (error) => {
        if (error.error && error.error.error) {
          this.error = error.error.error;
        } else if (error.error && error.error.message) {
          this.error = error.error.message;
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error = 'Registration failed. Please try again.';
        }

        this.loading = false;
      },
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
