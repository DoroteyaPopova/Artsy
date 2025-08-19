import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faUsers,
  faCalendar,
  faClock,
  faDollarSign,
  faArrowLeft,
  faChalkboardTeacher,
  faRefresh,
  faPlay,
  faTimes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../api.service';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';

interface TeacherCourse {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  cost: {
    amount: number;
    currency: string;
  };
  schedule: {
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    timezone?: string;
  };
  duration: {
    weeks: number;
    totalHours: number;
  };
  maxStudents: number;
  currentStudents: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  teacher: any;
  teacherName: string;
  image?: string;
  tags?: string[];
  requirements?: string;
  materials?: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    FontAwesomeModule,
    ConfirmationModalComponent,
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css'],
})
export class TeacherDashboardComponent implements OnInit {
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faUsers = faUsers;
  faCalendar = faCalendar;
  faClock = faClock;
  faDollarSign = faDollarSign;
  faArrowLeft = faArrowLeft;
  faChalkboardTeacher = faChalkboardTeacher;
  faRefresh = faRefresh;
  faPlay = faPlay;
  faTimes = faTimes;
  faCheck = faCheck;

  teacherCourses: TeacherCourse[] = [];
  currentUser: any = null;

  loading = true;
  coursesLoading = false;
  error = '';
  success = '';

  showDeleteModal = false;
  showStatusModal = false;
  modalLoading = false;
  selectedCourse: TeacherCourse | null = null;
  selectedStatus: string = '';

  stats = {
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    draftCourses: 0,
  };

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.checkTeacherAccess();
    this.loadCurrentUser();
    this.loadTeacherCourses();

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['success']) {
      this.success = navigation.extras.state['success'];

      setTimeout(() => {
        this.success = '';
      }, 3000);
    }
  }

  checkTeacherAccess() {
    const token = this.apiService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getProfile().subscribe({
      next: (response) => {
        const user = response.user;
        if (user.role !== 'teacher' && user.role !== 'admin') {
          alert('Access denied. Teacher privileges required.');
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Auth check failed:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  loadCurrentUser() {
    this.apiService.getProfile().subscribe({
      next: (response) => {
        this.currentUser = response.user;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.loading = false;
      },
    });
  }

  loadTeacherCourses() {
    if (!this.currentUser?.id) {
      setTimeout(() => {
        if (this.currentUser?.id) {
          this.loadTeacherCourses();
        }
      }, 500);
      return;
    }

    this.coursesLoading = true;
    this.error = '';

    this.apiService.getCoursesByTeacher(this.currentUser.id).subscribe({
      next: (response: TeacherCourse[]) => {
        this.teacherCourses = response || [];
        this.updateStats();
        this.coursesLoading = false;
      },
      error: (error) => {
        console.error('Error loading teacher courses:', error);

        if (error.status === 404) {
          this.error =
            'Courses API not yet implemented. Using demo data for now.';
          this.loadDemoData();
        } else {
          this.error = 'Failed to load your courses. Please try again.';
        }
        this.coursesLoading = false;
      },
    });
  }

  loadDemoData() {
    console.log('Loading demo data as fallback...');
    this.teacherCourses = [
      {
        _id: 'demo1',
        title: 'Digital Art Fundamentals',
        description:
          'Learn the basics of digital art creation using industry-standard tools and techniques.',
        category: 'digital-art',
        level: 'beginner',
        cost: { amount: 149, currency: 'USD' },
        schedule: {
          daysOfWeek: ['monday', 'wednesday'],
          startTime: '19:00',
          endTime: '21:00',
        },
        duration: { weeks: 8, totalHours: 32 },
        maxStudents: 15,
        currentStudents: 12,
        status: 'draft',
        startDate: '2024-02-01',
        endDate: '2024-03-28',
        createdAt: '2024-01-15',
        teacher: this.currentUser?.id,
        teacherName: this.currentUser?.username || 'Demo Teacher',
      },
    ];
    this.updateStats();
  }

  updateStats() {
    this.stats.totalCourses = this.teacherCourses.length;
    this.stats.activeCourses = this.teacherCourses.filter(
      (course) => course.status === 'published' || course.status === 'ongoing'
    ).length;
    this.stats.totalStudents = this.teacherCourses.reduce(
      (total, course) => total + (course.currentStudents || 0),
      0
    );
    this.stats.draftCourses = this.teacherCourses.filter(
      (course) => course.status === 'draft'
    ).length;
  }

  createNewCourse() {
    this.router.navigate(['/create-course']);
  }

  editCourse(courseId: string) {
    this.router.navigate(['/edit-course', courseId]);
  }

  viewCourse(courseId: string) {
    this.router.navigate(['/courses', courseId]);
  }

  publishCourse(course: TeacherCourse) {
    this.selectedCourse = course;
    this.selectedStatus = 'published';
    this.showStatusModal = true;
  }

  cancelCourse(course: TeacherCourse) {
    this.selectedCourse = course;
    this.selectedStatus = 'cancelled';
    this.showStatusModal = true;
  }

  onStatusChangeConfirmed() {
    if (!this.selectedCourse || !this.selectedStatus) return;

    this.modalLoading = true;

    this.apiService
      .updateCourseStatus(this.selectedCourse._id, this.selectedStatus)
      .subscribe({
        next: (response) => {
          const statusText =
            this.selectedStatus === 'published' ? 'published' : 'cancelled';
          this.success = `Course ${statusText} successfully!`;
          this.hideStatusModal();
          this.loadTeacherCourses();
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (error) => {
          console.error('Error updating course status:', error);
          this.error =
            error.error?.error ||
            'Failed to update course status. Please try again.';
          this.hideStatusModal();
          setTimeout(() => (this.error = ''), 5000);
        },
      });
  }

  onStatusChangeCancelled() {
    this.hideStatusModal();
  }

  hideStatusModal() {
    this.showStatusModal = false;
    this.modalLoading = false;
    this.selectedCourse = null;
    this.selectedStatus = '';
  }

  deleteCourse(courseId: string) {
    const course = this.teacherCourses.find((c) => c._id === courseId);
    if (!course) return;

    if (course.currentStudents > 0) {
      alert(
        `Cannot delete course "${course.title}" because it has ${course.currentStudents} enrolled students.`
      );
      return;
    }

    this.selectedCourse = course;
    this.showDeleteModal = true;
  }

  onDeleteConfirmed() {
    if (!this.selectedCourse) return;

    this.modalLoading = true;

    this.apiService.deleteCourse(this.selectedCourse._id).subscribe({
      next: (response) => {
        this.success = 'Course deleted successfully!';
        this.hideDeleteModal();
        this.loadTeacherCourses();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (error) => {
        console.error('Error deleting course:', error);
        this.error =
          error.error?.error || 'Failed to delete course. Please try again.';
        this.hideDeleteModal();
        setTimeout(() => (this.error = ''), 5000);
      },
    });
  }

  onDeleteCancelled() {
    this.hideDeleteModal();
  }

  hideDeleteModal() {
    this.showDeleteModal = false;
    this.modalLoading = false;
    this.selectedCourse = null;
  }

  refreshCourses() {
    this.loadTeacherCourses();
  }

  formatSchedule(schedule: any): string {
    if (!schedule || !schedule.daysOfWeek) return 'Schedule TBD';

    const days = schedule.daysOfWeek
      .map((day: string) => day.charAt(0).toUpperCase() + day.slice(1))
      .join(', ');
    return `${days} ${schedule.startTime || ''}-${schedule.endTime || ''}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'published':
        return '#28a745';
      case 'ongoing':
        return '#007bff';
      case 'draft':
        return '#ffc107';
      case 'completed':
        return '#6c757d';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'digital-art':
        return 'Digital Art';
      case 'traditional-painting':
        return 'Traditional Painting';
      case 'drawing':
        return 'Drawing';
      case 'mixed-media':
        return 'Mixed Media';
      case 'sculpture':
        return 'Sculpture';
      case 'art-history':
        return 'Art History';
      default:
        return 'Other';
    }
  }

  getLevelLabel(level: string): string {
    switch (level) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      case 'all-levels':
        return 'All Levels';
      default:
        return level;
    }
  }

  canDeleteCourse(course: TeacherCourse): boolean {
    return course.currentStudents === 0;
  }

  canPublishCourse(course: TeacherCourse): boolean {
    return course.status === 'draft';
  }

  canCancelCourse(course: TeacherCourse): boolean {
    return course.status === 'published' || course.status === 'draft';
  }

  getCourseDuration(course: TeacherCourse): string {
    if (!course.duration) return 'Duration TBD';
    return `${course.duration.weeks} weeks (${course.duration.totalHours}h total)`;
  }

  getCoursePrice(course: TeacherCourse): string {
    if (!course.cost) return 'Price TBD';
    return `${course.cost.amount} ${course.cost.currency}`;
  }

  getStatusModalTitle(): string {
    return this.selectedStatus === 'published'
      ? 'Publish Course'
      : 'Cancel Course';
  }

  getStatusModalMessage(): string {
    const action = this.selectedStatus === 'published' ? 'publish' : 'cancel';
    return `Are you sure you want to ${action} this course?`;
  }

  getStatusModalConfirmText(): string {
    return this.selectedStatus === 'published'
      ? 'Publish Course'
      : 'Cancel Course';
  }

  getStatusModalLoadingText(): string {
    return this.selectedStatus === 'published'
      ? 'Publishing...'
      : 'Cancelling...';
  }

  getStatusModalType(): 'info' | 'warning' | 'danger' {
    return this.selectedStatus === 'published' ? 'info' : 'warning';
  }

  getStatusModalIcon() {
    return this.selectedStatus === 'published' ? this.faCheck : this.faTimes;
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
