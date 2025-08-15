import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

interface PaintingFormData {
  title: string;
  category: 'digital' | 'canvas';
  dimensions: {
    width: number;
    height: number;
    unit: 'cm' | 'inches' | 'px';
  };
  description: string;
  image: string;
  tags: string[];
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
})
export class UploadComponent implements OnInit {
  formData: PaintingFormData = {
    title: '',
    category: 'digital',
    dimensions: {
      width: 0,
      height: 0,
      unit: 'cm',
    },
    description: '',
    image: '',
    tags: [],
  };

  loading: boolean = false;
  error: string = '';
  success: string = '';
  tagsInput: string = '';

  formErrors: any = {};

  currentUser: any = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.getCurrentUser();
  }

  getCurrentUser() {
    const token = this.apiService.getToken();
    if (token) {
      this.apiService.getProfile().subscribe({
        next: (response) => {
          this.currentUser = response.user;
        },
        error: (error) => {
          console.error('Error getting user profile:', error);
          this.router.navigate(['/login']);
        },
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!this.formData.title.trim()) {
      this.formErrors.title = 'Title is required';
      isValid = false;
    } else if (this.formData.title.length > 100) {
      this.formErrors.title = 'Title cannot exceed 100 characters';
      isValid = false;
    }

    if (
      !this.formData.dimensions.width ||
      this.formData.dimensions.width <= 0
    ) {
      this.formErrors.width = 'Width must be greater than 0';
      isValid = false;
    }
    if (
      !this.formData.dimensions.height ||
      this.formData.dimensions.height <= 0
    ) {
      this.formErrors.height = 'Height must be greater than 0';
      isValid = false;
    }

    if (!this.formData.description.trim()) {
      this.formErrors.description = 'Description is required';
      isValid = false;
    } else if (this.formData.description.length < 10) {
      this.formErrors.description =
        'Description must be at least 10 characters';
      isValid = false;
    } else if (this.formData.description.length > 1000) {
      this.formErrors.description = 'Description cannot exceed 1000 characters';
      isValid = false;
    }

    if (!this.formData.image.trim()) {
      this.formErrors.image = 'Image URL is required';
      isValid = false;
    } else if (!this.isValidUrl(this.formData.image)) {
      this.formErrors.image = 'Please enter a valid URL';
      isValid = false;
    }

    return isValid;
  }

  isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  processTags() {
    if (this.tagsInput.trim()) {
      this.formData.tags = this.tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    } else {
      this.formData.tags = [];
    }
  }

  onSubmit() {
    this.error = '';
    this.success = '';

    this.processTags();

    if (!this.validateForm()) {
      this.error = 'Please fix the errors below';
      return;
    }

    this.loading = true;

    const paintingData = {
      title: this.formData.title.trim(),
      category: this.formData.category,
      dimensions: {
        width: Number(this.formData.dimensions.width),
        height: Number(this.formData.dimensions.height),
        unit: this.formData.dimensions.unit,
      },
      description: this.formData.description.trim(),
      image: this.formData.image.trim(),
      tags: this.formData.tags,
    };

    this.apiService.addPainting(paintingData).subscribe({
      next: (response) => {
        if (response.error) {
          this.error = response.error;
          this.loading = false;
        } else {
          this.success =
            'Painting uploaded successfully! Redirecting to gallery...';

          this.resetForm();

          setTimeout(() => {
            this.router.navigate(['/gallery']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.error =
          error.error?.error ||
          error.error?.message ||
          'Upload failed. Please try again.';
        this.loading = false;
      },
    });
  }

  resetForm() {
    this.formData = {
      title: '',
      category: 'digital',
      dimensions: {
        width: 0,
        height: 0,
        unit: 'cm',
      },
      description: '',
      image: '',
      tags: [],
    };
    this.tagsInput = '';
    this.formErrors = {};
    this.loading = false;
  }

  previewImage(): boolean {
    return Boolean(this.formData.image) && this.isValidUrl(this.formData.image);
  }

  get dimensionsDisplay(): string {
    if (this.formData.dimensions.width && this.formData.dimensions.height) {
      return `${this.formData.dimensions.width} × ${this.formData.dimensions.height} ${this.formData.dimensions.unit}`;
    }
    return '';
  }

  get isFormValid(): boolean {
    return (
      Boolean(this.formData.title.trim()) &&
      this.formData.dimensions.width > 0 &&
      this.formData.dimensions.height > 0 &&
      this.formData.description.trim().length >= 10 &&
      Boolean(this.formData.image.trim()) &&
      this.isValidUrl(this.formData.image)
    );
  }
}
