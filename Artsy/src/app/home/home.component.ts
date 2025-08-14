import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';

interface FeaturedPainting {
  _id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  image: string;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: string;
  owner: any;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  // Featured painting data
  featuredPainting: FeaturedPainting | null = null;
  loadingFeatured = false;
  errorFeatured = '';

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.loadFeaturedPainting();
  }

  loadFeaturedPainting() {
    this.loadingFeatured = true;
    this.errorFeatured = '';

    this.apiService.getHighestRatedPainting().subscribe({
      next: (response) => {
        this.featuredPainting = response.painting;
        this.loadingFeatured = false;
      },
      error: (error) => {
        console.error('Error loading featured painting:', error);
        // Don't show error message to user, just don't display the section
        this.errorFeatured = 'Failed to load featured painting';
        this.loadingFeatured = false;
      },
    });
  }

  goToGallery() {
    this.router.navigate(['/gallery']);
  }

  goToCourses() {
    this.router.navigate(['/courses']);
  }

  viewPainting(paintingId: string) {
    this.router.navigate(['/paintings', paintingId]);
  }
}
