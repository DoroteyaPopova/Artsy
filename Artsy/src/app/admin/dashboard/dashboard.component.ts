import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUsers,
  faChalkboardTeacher,
  faPaintBrush,
  faComments,
  faEye,
  faCheck,
  faClock,
  faTimes,
  faArrowUp,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../api.service';

interface DashboardStats {
  totalUsers: number;
  totalPaintings: number;
  pendingTeachers: number;
  totalComments: number;
  recentUsers: any[];
  recentPaintings: any[];
  recentApplications: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  faUsers = faUsers;
  faChalkboardTeacher = faChalkboardTeacher;
  faPaintBrush = faPaintBrush;
  faComments = faComments;
  faEye = faEye;
  faCheck = faCheck;
  faClock = faClock;
  faTimes = faTimes;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;

  stats: DashboardStats = {
    totalUsers: 0,
    totalPaintings: 0,
    pendingTeachers: 0,
    totalComments: 0,
    recentUsers: [],
    recentPaintings: [],
    recentApplications: [],
  };

  loading = true;
  error = '';

  statsCards = [
    {
      title: 'Total Users',
      value: 0,
      icon: this.faUsers,
      color: 'blue',
      route: '/admin/users',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Total Paintings',
      value: 0,
      icon: this.faPaintBrush,
      color: 'green',
      route: '/admin/paintings',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Pending Teachers',
      value: 0,
      icon: this.faChalkboardTeacher,
      color: 'orange',
      route: '/admin/teacher-applications',
      change: '+3',
      changeType: 'neutral',
    },
    {
      title: 'Total Comments',
      value: 0,
      icon: this.faComments,
      color: 'purple',
      route: '/admin/comments',
      change: '+25%',
      changeType: 'positive',
    },
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = '';

    Promise.all([
      this.loadUsers(),
      this.loadPaintings(),
      this.loadTeacherApplications(),
    ])
      .then(() => {
        this.updateStatsCards();
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      });
  }

  async loadUsers() {
    try {
      const response = await this.apiService.getAllUsers().toPromise();
      this.stats.totalUsers = response.length;
      this.stats.recentUsers = response.slice(0, 5);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async loadPaintings() {
    try {
      const response = await this.apiService.getPaintings().toPromise();
      if (Array.isArray(response)) {
        this.stats.totalPaintings = response.length;
        this.stats.recentPaintings = response.slice(0, 5);
      } else if (response.paintings) {
        this.stats.totalPaintings =
          response.pagination?.totalItems || response.paintings.length;
        this.stats.recentPaintings = response.paintings.slice(0, 5);
      }
    } catch (error) {
      console.error('Error loading paintings:', error);
    }
  }

  async loadTeacherApplications() {
    try {
      const response = await this.apiService
        .getPendingTeacherApplications()
        .toPromise();
      this.stats.pendingTeachers = response.applications?.length || 0;
      this.stats.recentApplications = response.applications?.slice(0, 5) || [];
    } catch (error) {
      console.error('Error loading teacher applications:', error);
    }
  }

  updateStatsCards() {
    this.statsCards[0].value = this.stats.totalUsers;
    this.statsCards[1].value = this.stats.totalPaintings;
    this.statsCards[2].value = this.stats.pendingTeachers;
    this.statsCards[3].value = this.stats.totalComments;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  refreshData() {
    this.loadDashboardData();
  }
}
