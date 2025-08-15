import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, NavigationComponent],
})
export class AppComponent implements OnInit {
  paintings: any[] = [];
  isLoggedIn: boolean = false;
  currentUser: any = null;
  loading: boolean = false;
  error: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.getPaintings();
  }

  checkAuthStatus() {
    const token = this.apiService.getToken();
    if (token) {
      this.apiService.getProfile().subscribe({
        next: (response) => {
          this.isLoggedIn = true;
          this.currentUser = response.user;
        },
        error: (error) => {
          console.error('Auth check failed:', error);
          this.apiService.removeToken();
          this.isLoggedIn = false;
        },
      });
    }
  }

  getPaintings() {
    this.loading = true;
    this.error = '';

    this.apiService.getPaintings().subscribe({
      next: (data) => {
        this.paintings = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading paintings:', error);
        this.error =
          'Failed to load paintings. Make sure your backend server is running on port 8000.';
        this.loading = false;
      },
    });
  }

  addPainting() {
    if (!this.isLoggedIn) {
      alert('Please log in to add a painting');
      return;
    }

    const newPainting = {
      title: 'New Painting',
      description: 'A beautiful new artwork',
      image: 'https://via.placeholder.com/400x400?text=New+Painting',
    };

    this.apiService.addPainting(newPainting).subscribe({
      next: (response) => {
        this.getPaintings(); // Refresh the list
      },
      error: (error) => {
        console.error('Error adding painting:', error);
        alert(
          'Failed to add painting: ' + (error.error?.error || error.message)
        );
      },
    });
  }
}
