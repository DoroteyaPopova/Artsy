import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTachometerAlt,
  faUsers,
  faChalkboardTeacher,
  faPaintBrush,
  faComments,
  faCog,
  faSignOutAlt,
  faHome,
  faBars,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FontAwesomeModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent implements OnInit {
  faTachometerAlt = faTachometerAlt;
  faUsers = faUsers;
  faChalkboardTeacher = faChalkboardTeacher;
  faPaintBrush = faPaintBrush;
  faComments = faComments;
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;
  faHome = faHome;
  faBars = faBars;
  faTimes = faTimes;

  currentUser: any = null;
  sidebarOpen = false;

  navItems = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: this.faTachometerAlt,
    },
    {
      label: 'Teacher Applications',
      route: '/admin/teacher-applications',
      icon: this.faChalkboardTeacher,
    },
    {
      label: 'Users',
      route: '/admin/users',
      icon: this.faUsers,
    },
    {
      label: 'Paintings',
      route: '/admin/paintings',
      icon: this.faPaintBrush,
    },
    {
      label: 'Comments & Ratings',
      route: '/admin/comments',
      icon: this.faComments,
    },
    {
      label: 'Settings',
      route: '/admin/settings',
      icon: this.faCog,
    },
  ];

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.apiService.getProfile().subscribe({
      next: (response) => {
        this.currentUser = response.user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      },
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  goToMainSite() {
    this.router.navigate(['/']);
  }

  logout() {
    this.apiService.logout().subscribe({
      next: () => {},
      error: () => {},
      complete: () => {
        this.apiService.removeToken();
        window.dispatchEvent(new CustomEvent('authStatusChanged'));
        this.router.navigate(['/']);
      },
    });
  }
}
