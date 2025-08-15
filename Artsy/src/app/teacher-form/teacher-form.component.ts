import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

interface TeacherApplicationData {
  username: string;
  email: string;
  specialties: string[];
  bio: string;
}

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.css',
})
export class TeacherFormComponent implements OnInit {
  formData: TeacherApplicationData = {
    username: '',
    email: '',
    specialties: ['', '', ''],
    bio: '',
  };

  loading: boolean = false;
  submitting: boolean = false;
  error: string = '';
  success: string = '';

  currentUser: any = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.checkAuthAndLoadUser();
  }

  checkAuthAndLoadUser() {
    const token = this.apiService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.apiService.getProfile().subscribe({
      next: (response) => {
        this.currentUser = response.user;
        this.populateUserData();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error getting user profile:', error);
        this.error = 'Failed to load user information';
        this.loading = false;

        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  populateUserData() {
    if (this.currentUser) {
      this.formData.username = this.currentUser.username;
      this.formData.email = this.currentUser.email;
    }
  }

  validateForm(): boolean {
    this.error = '';

    const filledSpecialties = this.formData.specialties.filter(
      (specialty) => specialty.trim() !== ''
    );
    if (filledSpecialties.length === 0) {
      this.error = 'Please enter at least one specialty';
      return false;
    }

    if (!this.formData.bio.trim()) {
      this.error = 'Please enter a bio';
      return false;
    }

    if (this.formData.bio.trim().length < 10) {
      this.error = 'Bio must be at least 10 characters long';
      return false;
    }

    if (this.formData.bio.trim().length > 200) {
      this.error = 'Bio cannot exceed 200 characters';
      return false;
    }

    return true;
  }

  onSubmit() {
    this.error = '';
    this.success = '';

    if (!this.validateForm()) {
      return;
    }

    this.submitting = true;

    const cleanedSpecialties = this.formData.specialties
      .map((specialty) => specialty.trim())
      .filter((specialty) => specialty !== '');

    const teacherData = {
      specialties: cleanedSpecialties,
      bio: this.formData.bio.trim(),
    };

    this.apiService.submitTeacherApplication(teacherData).subscribe({
      next: (response) => {
        this.success =
          'Teacher application submitted successfully! We will review your application and get back to you soon.';
        this.submitting = false;

        setTimeout(() => {
          this.router.navigate(['/profile'], {
            state: { success: 'Teacher application submitted successfully!' },
          });
        }, 3000);
      },
      error: (error) => {
        console.error('Error submitting teacher application:', error);

        if (error.status === 409) {
          this.error =
            'You have already submitted a teacher application. Please check your profile for status updates.';
        } else {
          this.error =
            error.error?.error ||
            'Failed to submit application. Please try again.';
        }

        this.submitting = false;
      },
    });
  }

  getFilledSpecialtiesCount(): number {
    return this.formData.specialties.filter(
      (specialty) => specialty.trim() !== ''
    ).length;
  }

  isFormValid(): boolean {
    const hasSpecialties = this.getFilledSpecialtiesCount() > 0;
    const hasBio =
      this.formData.bio.trim().length >= 10 &&
      this.formData.bio.trim().length <= 200;
    return hasSpecialties && hasBio;
  }

  goBack() {
    this.router.navigate(['/about']);
  }
}
