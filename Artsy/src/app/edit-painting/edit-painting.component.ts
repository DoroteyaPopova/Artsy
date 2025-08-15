import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faSave,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../api.service';

interface PaintingData {
  _id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: string;
}

@Component({
  selector: 'app-edit-painting',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './edit-painting.component.html',
  styleUrl: './edit-painting.component.css',
})
export class EditPaintingComponent implements OnInit {
  faArrowLeft = faArrowLeft;
  faSave = faSave;
  faTimes = faTimes;

  painting: PaintingData | null = null;
  paintingId: string = '';

  editForm = {
    title: '',
    description: '',
    category: 'digital',
  };

  loading = true;
  saving = false;
  error = '';
  success = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.paintingId = params['id'];
      this.loadPainting();
    });
  }

  loadPainting() {
    this.loading = true;
    this.error = '';

    this.apiService.getPaintingById(this.paintingId).subscribe({
      next: (response: any) => {
        this.painting = response;
        this.populateForm();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading painting:', error);
        this.error = 'Failed to load painting details';
        this.loading = false;

        if (error.status === 404 || error.status === 403) {
          this.router.navigate(['/profile']);
        }
      },
    });
  }

  populateForm() {
    if (this.painting) {
      this.editForm = {
        title: this.painting.title,
        description: this.painting.description,
        category: this.painting.category,
      };
    }
  }

  savePainting() {
    if (!this.painting) return;

    this.saving = true;
    this.error = '';

    const updatePayload = {
      title: this.editForm.title.trim(),
      description: this.editForm.description.trim(),
      category: this.editForm.category,
    };

    if (!updatePayload.title) {
      this.error = 'Title is required';
      this.saving = false;
      return;
    }

    this.apiService.updatePainting(this.paintingId, updatePayload).subscribe({
      next: (response: any) => {
        this.success = 'Painting updated successfully!';
        this.saving = false;

        setTimeout(() => {
          this.router.navigate(['/profile'], {
            state: { success: 'Painting updated successfully!' },
          });
        }, 1000);
      },
      error: (error: any) => {
        console.error('Error updating painting:', error);
        this.error = error.error?.error || 'Failed to update painting';
        this.saving = false;
      },
    });
  }

  cancelEdit() {
    this.router.navigate(['/profile']);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  isFormValid(): boolean {
    return this.editForm.title.trim().length > 0;
  }

  hasChanges(): boolean {
    if (!this.painting) return false;

    return (
      this.editForm.title !== this.painting.title ||
      this.editForm.description !== this.painting.description ||
      this.editForm.category !== this.painting.category
    );
  }
}
