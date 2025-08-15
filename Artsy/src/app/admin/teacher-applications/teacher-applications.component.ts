import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChalkboardTeacher,
  faCheck,
  faTimes,
  faEye,
  faSearch,
  faFilter,
  faRefresh,
  faCalendarAlt,
  faUser,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../api.service';

interface TeacherApplication {
  _id: string;
  userId: any;
  username: string;
  email: string;
  specialties: string[];
  bio: string;
  status: 'pending' | 'approved' | 'rejected';
  applicationDate: string;
  approvedDate?: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-teacher-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './teacher-applications.component.html',
  styleUrl: './teacher-applications.component.css',
})
export class TeacherApplicationsComponent implements OnInit {
  faChalkboardTeacher = faChalkboardTeacher;
  faCheck = faCheck;
  faTimes = faTimes;
  faEye = faEye;
  faSearch = faSearch;
  faFilter = faFilter;
  faRefresh = faRefresh;
  faCalendarAlt = faCalendarAlt;
  faUser = faUser;
  faEnvelope = faEnvelope;

  applications: TeacherApplication[] = [];
  filteredApplications: TeacherApplication[] = [];
  selectedApplication: TeacherApplication | null = null;

  loading = true;
  error = '';
  success = '';

  statusFilter = 'all';
  searchTerm = '';

  showApplicationModal = false;
  showApprovalModal = false;
  showRejectionModal = false;
  rejectionReason = '';

  processing = false;

  stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading = true;
    this.error = '';

    this.apiService.getAllTeacherApplications().subscribe({
      next: (response) => {
        this.applications = response.applications || [];
        this.updateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teacher applications:', error);
        this.error = 'Failed to load teacher applications';
        this.loading = false;
      },
    });
  }

  updateStats() {
    this.stats.total = this.applications.length;
    this.stats.pending = this.applications.filter(
      (app) => app.status === 'pending'
    ).length;
    this.stats.approved = this.applications.filter(
      (app) => app.status === 'approved'
    ).length;
    this.stats.rejected = this.applications.filter(
      (app) => app.status === 'rejected'
    ).length;
  }

  applyFilters() {
    let filtered = [...this.applications];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.username.toLowerCase().includes(term) ||
          app.email.toLowerCase().includes(term) ||
          app.specialties.some((s) => s.toLowerCase().includes(term))
      );
    }

    this.filteredApplications = filtered;
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  viewApplication(application: TeacherApplication) {
    this.selectedApplication = application;
    this.showApplicationModal = true;
  }

  closeModal() {
    this.showApplicationModal = false;
    this.showApprovalModal = false;
    this.showRejectionModal = false;
    this.selectedApplication = null;
    this.rejectionReason = '';
  }

  openApprovalModal(application: TeacherApplication) {
    this.selectedApplication = application;
    this.showApprovalModal = true;
  }

  openRejectionModal(application: TeacherApplication) {
    this.selectedApplication = application;
    this.showRejectionModal = true;
    this.rejectionReason = '';
  }

  approveApplication() {
    if (!this.selectedApplication) return;

    this.processing = true;
    this.error = '';

    this.apiService
      .approveTeacherApplication(this.selectedApplication._id)
      .subscribe({
        next: (response) => {
          this.success = `Application for ${
            this.selectedApplication!.username
          } approved successfully!`;
          this.processing = false;
          this.closeModal();
          this.loadApplications();

          setTimeout(() => (this.success = ''), 3000);
        },
        error: (error) => {
          console.error('Error approving application:', error);
          this.error = error.error?.error || 'Failed to approve application';
          this.processing = false;
        },
      });
  }

  rejectApplication() {
    if (!this.selectedApplication || !this.rejectionReason.trim()) {
      this.error = 'Please provide a reason for rejection';
      return;
    }

    this.processing = true;
    this.error = '';

    this.apiService
      .rejectTeacherApplication(
        this.selectedApplication._id,
        this.rejectionReason.trim()
      )
      .subscribe({
        next: (response) => {
          this.success = `Application for ${
            this.selectedApplication!.username
          } rejected.`;
          this.processing = false;
          this.closeModal();
          this.loadApplications();

          setTimeout(() => (this.success = ''), 3000);
        },
        error: (error) => {
          console.error('Error rejecting application:', error);
          this.error = error.error?.error || 'Failed to reject application';
          this.processing = false;
        },
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  refreshApplications() {
    this.loadApplications();
  }
}
