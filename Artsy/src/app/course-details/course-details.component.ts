import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';

import {
  faArrowLeft,
  faCalendar,
  faClock,
  faDollarSign,
  faUsers,
  faGraduationCap,
  faStar,
  faCheckCircle,
  faTimesCircle,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as starOutline } from '@fortawesome/free-regular-svg-icons';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FontAwesomeModule,
    ConfirmationModalComponent,
  ],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css',
})
export class CourseDetailsComponent implements OnInit {
  faArrowLeft = faArrowLeft;
  faCalendar = faCalendar;
  faClock = faClock;
  faDollarSign = faDollarSign;
  faUsers = faUsers;
  faGraduationCap = faGraduationCap;
  faStar = faStar;
  starOutline = starOutline;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faSignOutAlt = faSignOutAlt;

  course: any = null;
  courseId: string = '';
  loading = true;
  error = '';
  currentUser: any = null;
  isUserEnrolled = false;

  showSuccessNotification = false;
  showErrorNotification = false;
  notificationMessage = '';

  showLoginModal = false;
  showUnenrollModal = false;

  categories = [
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'traditional-painting', label: 'Traditional Painting' },
    { value: 'drawing', label: 'Drawing' },
    { value: 'mixed-media', label: 'Mixed Media' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'art-history', label: 'Art History' },
    { value: 'other', label: 'Other' },
  ];

  levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all-levels', label: 'All Levels' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.courseId = this.route.snapshot.params['id'];
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    if (this.apiService.isLoggedIn()) {
      this.apiService.getProfile().subscribe({
        next: (response) => {
          this.currentUser = response.user;
          this.loadCourseDetails();
        },
        error: (error) => {
          console.error('Error getting user profile:', error);
          this.loadCourseDetails();
        },
      });
    } else {
      this.loadCourseDetails();
    }
  }

  loadCourseDetails() {
    this.loading = true;
    this.error = '';

    this.apiService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.checkEnrollmentStatus();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading course details:', error);
        this.error = 'Failed to load course details.';
        this.loading = false;
      },
    });
  }

  checkEnrollmentStatus() {
    if (!this.currentUser || !this.course || !this.course.enrolledStudents) {
      this.isUserEnrolled = false;
      return;
    }

    this.isUserEnrolled = this.course.enrolledStudents.some(
      (enrollment: any) => {
        const studentId =
          typeof enrollment.student === 'string'
            ? enrollment.student
            : enrollment.student?._id || enrollment.student?.id;

        return studentId === this.currentUser.id;
      }
    );
  }

  enrollInCourse() {
    if (!this.apiService.isLoggedIn()) {
      this.showLoginModal = true;
      return;
    }

    this.apiService.enrollInCourse(this.courseId).subscribe({
      next: (response) => {
        this.showSuccessNotification = true;
        this.notificationMessage = 'Successfully enrolled in the course!';
        this.isUserEnrolled = true;
        this.loadCourseDetails();
        this.hideNotificationAfterDelay();
      },
      error: (error) => {
        console.error('Error enrolling in course:', error);
        this.showErrorNotification = true;
        this.notificationMessage =
          error.error?.error || 'Failed to enroll in course';
        this.hideNotificationAfterDelay();
      },
    });
  }

  confirmUnenrollFromCourse() {
    this.showUnenrollModal = true;
  }

  unenrollFromCourse() {
    this.apiService.unenrollFromCourse(this.courseId).subscribe({
      next: (response) => {
        this.showSuccessNotification = true;
        this.notificationMessage = 'Successfully unenrolled from the course!';
        this.isUserEnrolled = false;
        this.showUnenrollModal = false;
        this.loadCourseDetails();
        this.hideNotificationAfterDelay();
      },
      error: (error) => {
        console.error('Error unenrolling from course:', error);
        this.showErrorNotification = true;
        this.notificationMessage =
          error.error?.error || 'Failed to unenroll from course';
        this.showUnenrollModal = false;
        this.hideNotificationAfterDelay();
      },
    });
  }

  hideNotificationAfterDelay() {
    setTimeout(() => {
      this.showSuccessNotification = false;
      this.showErrorNotification = false;
      this.notificationMessage = '';
    }, 5000);
  }

  hideNotification() {
    this.showSuccessNotification = false;
    this.showErrorNotification = false;
    this.notificationMessage = '';
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
  }

  formatSchedule(schedule: any): string {
    if (!schedule || !schedule.daysOfWeek) return 'Schedule TBD';

    const days = schedule.daysOfWeek
      .map((day: string) => day.charAt(0).toUpperCase() + day.slice(1))
      .join(', ');
    return `${days} ${schedule.startTime}-${schedule.endTime}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDuration(duration: any): string {
    return `${duration.weeks} weeks (${duration.totalHours} hours total)`;
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

  getSpotsAvailable(): number {
    return this.course.maxStudents - this.course.currentStudents;
  }

  isCourseFull(course: any): boolean {
    return this.getSpotsAvailable() <= 0;
  }

  hasStarted(course: any): boolean {
    return new Date(course.startDate) <= new Date();
  }

  canEnroll(course: any): boolean {
    return (
      !this.isCourseFull(course) &&
      !this.hasStarted(course) &&
      !this.isUserEnrolled
    );
  }

  canUnenroll(course: any): boolean {
    return this.isUserEnrolled && course.status !== 'completed';
  }

  getEnrollmentStatus(course: any): string {
    if (this.isUserEnrolled) return 'You are enrolled';
    if (this.hasStarted(course)) return 'Course Started';
    if (this.isCourseFull(course)) return 'Course Full';
    return `${this.getSpotsAvailable()} spots available`;
  }

  goBack() {
    this.router.navigate(['/courses']);
  }
}
