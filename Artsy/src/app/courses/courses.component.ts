import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';
import {
  faCalendar,
  faClock,
  faDollarSign,
  faUsers,
  faGraduationCap,
  faFilter,
  faSearch,
  faRefresh,
  faStar,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as starOutline } from '@fortawesome/free-regular-svg-icons';
import { ApiService } from '../api.service';

interface Course {
  _id: string;
  title: string;
  description: string;
  teacher: {
    _id: string;
    username: string;
    email: string;
  };
  teacherName: string;
  duration: {
    weeks: number;
    totalHours: number;
  };
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
  startDate: string;
  endDate: string;
  category: string;
  level: string;
  maxStudents: number;
  currentStudents: number;
  status: string;
  requirements?: string;
  materials?: string;
  image?: string;
  tags?: string[];
  spotsAvailable?: number;
  createdAt: string;
  enrolledStudents?: Array<{
    student: string;
    enrolledAt: string;
    progress: number;
    status: string;
  }>;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    FontAwesomeModule,
    ConfirmationModalComponent,
  ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
})
export class CoursesComponent implements OnInit {
  faCalendar = faCalendar;
  faClock = faClock;
  faDollarSign = faDollarSign;
  faUsers = faUsers;
  faGraduationCap = faGraduationCap;
  faFilter = faFilter;
  faSearch = faSearch;
  faRefresh = faRefresh;
  faStar = faStar;
  starOutline = starOutline;
  faSignOutAlt = faSignOutAlt;

  showLoginModal = false;
  showUnenrollModal = false;
  unenrollingCourse: Course | null = null;

  courses: Course[] = [];
  filteredCourses: Course[] = [];
  userEnrolledCourses: string[] = [];
  currentUser: any = null;

  loading = true;
  error = '';
  success = '';

  selectedCategory = 'all';
  selectedLevel = 'all';
  searchTerm = '';
  sortBy = 'startDate';
  sortOrder = 'asc';

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'traditional-painting', label: 'Traditional Painting' },
    { value: 'drawing', label: 'Drawing' },
    { value: 'mixed-media', label: 'Mixed Media' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'art-history', label: 'Art History' },
    { value: 'other', label: 'Other' },
  ];

  levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all-levels', label: 'All Levels' },
  ];

  sortOptions = [
    { value: 'startDate', label: 'Start Date' },
    { value: 'cost.amount', label: 'Price' },
    { value: 'title', label: 'Title' },
    { value: 'createdAt', label: 'Newest' },
  ];

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.loadCourses();
    this.loadUserEnrolledCourses();
  }

  checkAuthStatus() {
    if (this.apiService.isLoggedIn()) {
      this.apiService.getProfile().subscribe({
        next: (response) => {
          this.currentUser = response.user;
        },
        error: (error) => {
          console.error('Error getting user profile:', error);
        },
      });
    }
  }

  loadUserEnrolledCourses() {
    if (!this.apiService.isLoggedIn()) return;

    this.apiService.getUserEnrolledCourses().subscribe({
      next: (courses) => {
        this.userEnrolledCourses = courses.map((course: any) => course._id);
      },
      error: (error) => {
        console.error('Error loading user enrolled courses:', error);
      },
    });
  }

  loadCourses() {
    this.loading = true;
    this.error = '';

    const filters: any = {
      status: 'published',
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      order: this.sortOrder,
    };

    if (this.selectedCategory !== 'all') {
      filters.category = this.selectedCategory;
    }

    if (this.selectedLevel !== 'all') {
      filters.level = this.selectedLevel;
    }

    this.apiService.getCourses(filters).subscribe({
      next: (response) => {
        this.courses = response.courses || [];
        this.filteredCourses = [...this.courses];

        if (response.pagination) {
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
        }

        if (this.searchTerm) {
          this.applyLocalFilters();
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.error = 'Failed to load courses. Please try again later.';
        this.loading = false;
      },
    });
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.loadCourses();
  }

  onLevelChange() {
    this.currentPage = 1;
    this.loadCourses();
  }

  onSortChange() {
    this.currentPage = 1;
    this.loadCourses();
  }

  onSearchChange() {
    this.applyLocalFilters();
  }

  applyLocalFilters() {
    let filtered = [...this.courses];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term) ||
          course.teacherName.toLowerCase().includes(term) ||
          course.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    this.filteredCourses = filtered;
  }

  refreshCourses() {
    this.currentPage = 1;
    this.loadCourses();
    this.loadUserEnrolledCourses();
  }

  isUserEnrolled(courseId: string): boolean {
    return this.userEnrolledCourses.includes(courseId);
  }

  enrollInCourse(courseId: string) {
    if (!this.apiService.isLoggedIn()) {
      this.showLoginModal = true;
      return;
    }

    this.apiService.enrollInCourse(courseId).subscribe({
      next: (response) => {
        this.success = 'Successfully enrolled in course!';
        this.userEnrolledCourses.push(courseId);
        this.loadCourses();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (error) => {
        console.error('Error enrolling in course:', error);
        this.error = error.error?.error || 'Failed to enroll in course';
        setTimeout(() => (this.error = ''), 5000);
      },
    });
  }

  confirmUnenrollFromCourse(course: Course) {
    this.unenrollingCourse = course;
    this.showUnenrollModal = true;
  }

  unenrollFromCourse() {
    if (!this.unenrollingCourse) return;

    this.apiService.unenrollFromCourse(this.unenrollingCourse._id).subscribe({
      next: (response) => {
        this.success = `Successfully unenrolled from ${
          this.unenrollingCourse!.title
        }!`;

        this.userEnrolledCourses = this.userEnrolledCourses.filter(
          (id) => id !== this.unenrollingCourse!._id
        );
        this.loadCourses();
        this.showUnenrollModal = false;
        this.unenrollingCourse = null;
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (error) => {
        console.error('Error unenrolling from course:', error);
        this.error = error.error?.error || 'Failed to unenroll from course';
        this.showUnenrollModal = false;
        this.unenrollingCourse = null;
        setTimeout(() => (this.error = ''), 5000);
      },
    });
  }

  onLoginConfirmed() {
    this.router.navigate(['/login']);
    this.showLoginModal = false;
  }

  onLoginCancelled() {
    this.showLoginModal = false;
  }

  onUnenrollConfirmed() {
    this.unenrollFromCourse();
  }

  onUnenrollCancelled() {
    this.showUnenrollModal = false;
    this.unenrollingCourse = null;
  }

  formatSchedule(schedule: any): string {
    if (!schedule || !schedule.daysOfWeek) return 'Schedule TBD';

    const days = schedule.daysOfWeek
      .map(
        (day: string) => day.charAt(0).toUpperCase() + day.slice(1).slice(0, 2)
      )
      .join(', ');
    return `${days} ${schedule.startTime}-${schedule.endTime}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDuration(duration: any): string {
    return `${duration.weeks} weeks (${duration.totalHours}h total)`;
  }

  formatPrice(cost: any): string {
    return `${cost.amount} ${cost.currency}`;
  }

  getCategoryLabel(category: string): string {
    const found = this.categories.find((cat) => cat.value === category);
    return found ? found.label : category;
  }

  getLevelLabel(level: string): string {
    const found = this.levels.find((lvl) => lvl.value === level);
    return found ? found.label : level;
  }

  getSpotsAvailable(course: Course): number {
    return course.maxStudents - course.currentStudents;
  }

  isCourseFull(course: Course): boolean {
    return this.getSpotsAvailable(course) <= 0;
  }

  canEnroll(course: Course): boolean {
    return (
      !this.isCourseFull(course) &&
      new Date(course.startDate) > new Date() &&
      !this.isUserEnrolled(course._id)
    );
  }

  canUnenroll(course: Course): boolean {
    return this.isUserEnrolled(course._id) && course.status !== 'completed';
  }

  getEnrollmentStatus(course: Course): string {
    if (this.isUserEnrolled(course._id)) return 'Enrolled';
    if (this.isCourseFull(course)) return 'Full';
    if (new Date(course.startDate) <= new Date()) return 'Started';
    return `${this.getSpotsAvailable(course)} spots left`;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCourses();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCourses();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCourses();
    }
  }
}
