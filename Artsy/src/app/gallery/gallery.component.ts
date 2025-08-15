import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../api.service';

interface Painting {
  _id?: string;
  title: string;
  description: string;
  image: string;
  owner?: string;
  author?: string;
  category?: string;
  averageRating?: number;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
})
export class GalleryComponent implements OnInit {
  paintings: Painting[] = [];
  loading: boolean = false;
  error: string = '';
  selectedCategory: string = 'all';
  showDropdown: boolean = false;

  starIcon = faStar;
  solidStarIcon = solidStar;

  currentPage: number = 1;
  totalPages: number = 1;
  totalPaintings: number = 0;

  constructor(private apiService: ApiService) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.dropdown');

    if (dropdown && !dropdown.contains(target)) {
      this.showDropdown = false;
    }
  }

  ngOnInit() {
    this.loadPaintings();
  }

  isUserLoggedIn(): boolean {
    return this.apiService.isLoggedIn();
  }

  loadPaintings() {
    this.loading = true;
    this.error = '';

    const categoryFilter =
      this.selectedCategory === 'all' ? undefined : this.selectedCategory;

    this.apiService.getPaintings(categoryFilter).subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.paintings = response;
        } else if (response.paintings) {
          this.paintings = response.paintings;
          if (response.pagination) {
            this.currentPage = response.pagination.currentPage;
            this.totalPages = response.pagination.totalPages;
            this.totalPaintings = response.pagination.totalItems;
          }
        } else {
          this.paintings = [];
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading paintings:', error);
        this.error = 'Failed to load paintings. Please try again later.';
        this.loading = false;
      },
    });
  }

  getStarRating(rating: number | undefined): number[] {
    if (!rating) return [0, 0, 0, 0, 0];

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(1);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(0.5);
      } else {
        stars.push(0);
      }
    }

    return stars;
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.loadPaintings();
  }

  refreshPaintings() {
    this.loadPaintings();
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  selectCategory(category: string) {
    this.showDropdown = false;
    this.filterByCategory(category);
  }

  getSelectedCategoryLabel(): string {
    switch (this.selectedCategory) {
      case 'digital':
        return 'Digital Art';
      case 'canvas':
        return 'Canvas/Traditional';
      default:
        return 'All Categories';
    }
  }
}
