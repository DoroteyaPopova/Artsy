import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faStar,
  faEdit,
  faTrash,
  faUser,
  faEnvelope,
  faCalendar,
  faPaintBrush,
  faCog,
  faChalkboardTeacher,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as starOutline } from '@fortawesome/free-regular-svg-icons';
import { ApiService } from '../api.service';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  location?: string;
  avatar?: string;
  role?: 'user' | 'teacher' | 'admin';
  isAdmin?: boolean;
}

interface UserPainting {
  _id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: string;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
}

interface CourseEnrollment {
  _id: string;
  title: string;
  courseName: string;
  instructor: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  schedule: any;
  formattedSchedule?: string;
  progress: number;
  status: 'active' | 'completed' | 'upcoming' | 'dropped';
  enrolledAt: string;
  duration: {
    weeks: number;
    totalHours: number;
  };
  category: string;
  level: string;
  image?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  faEdit = faEdit;
  faTrash = faTrash;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faCalendar = faCalendar;
  faPaintBrush = faPaintBrush;
  faStar = faStar;
  starOutline = starOutline;
  faCog = faCog;
  faChalkboardTeacher = faChalkboardTeacher;

  user: UserProfile | null = null;
  userPaintings: UserPainting[] = [];
  userCourses: CourseEnrollment[] = [];

  isEditingProfile = false;
  isAdmin = false;
  isTeacher = false;

  editProfileForm = {
    username: '',
    email: '',
    bio: '',
    location: '',
    avatar: '',
  };

  loading = true;
  error = '';
  success = '';
  profileUpdateLoading = false;
  coursesLoading = false;

  showDeleteConfirm = false;
  deletingPaintingId: string | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  checkAdminStatus() {
    if (this.user && this.user.email) {
      if (this.user.role === 'admin') {
        this.isAdmin = true;
        return;
      }

      if (this.user.role === 'teacher') {
        this.isAdmin = false;
        this.isTeacher = true;
        return;
      }

      const ADMIN_EMAIL = 'doriadmin@gmail.com';
      const isAdminEmail =
        this.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const hasAdminField = this.user.isAdmin === true;

      this.isAdmin = isAdminEmail || hasAdminField;
      this.isTeacher = false;
    }
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadUserPaintings();
    this.loadUserCourses();

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['success']) {
      this.success = navigation.extras.state['success'];
      setTimeout(() => {
        this.success = '';
      }, 3000);
    }
  }

  loadUserProfile() {
    this.loading = true;
    this.apiService.getProfile().subscribe({
      next: (response) => {
        this.user = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          bio: response.user.bio || '',
          location: response.user.location || '',
          avatar: response.user.avatar || '',
          role: response.user.role || 'user',
          isAdmin: response.user.isAdmin || false,
        };
        this.populateEditForm();
        this.checkAdminStatus();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.error = 'Failed to load profile information';
        this.loading = false;
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  goToAdminPanel() {
    this.router.navigate(['/admin']);
  }

  goToTeacherPanel() {
    this.router.navigate(['/teacher-dashboard']);
  }

  loadUserPaintings() {
    if (!this.user?.id) {
      setTimeout(() => {
        if (this.user?.id) {
          this.loadUserPaintings();
        }
      }, 500);
      return;
    }

    this.apiService.getUserPaintings(this.user.id).subscribe({
      next: (paintings: any[]) => {
        this.userPaintings = paintings.map((painting) => ({
          _id: painting._id,
          title: painting.title,
          description: painting.description,
          image: painting.image,
          category: painting.category || 'digital',
          averageRating: painting.averageRating || 0,
          ratingCount: painting.ratingCount || 0,
          commentCount: painting.commentCount || 0,
          createdAt: painting.createdAt,
          dimensions: painting.dimensions || {
            width: 0,
            height: 0,
            unit: 'cm',
          },
        }));
      },
      error: (error) => {
        console.error('Error loading user paintings:', error);
      },
    });
  }

  loadUserCourses() {
    this.coursesLoading = true;

    this.apiService.getUserEnrolledCourses().subscribe({
      next: (courses: CourseEnrollment[]) => {
        this.userCourses = courses.map((course) => ({
          ...course,
          courseName: course.title || course.courseName,
          instructor: course.teacherName || course.instructor,
          formattedSchedule: this.formatCourseSchedule(course.schedule),
        }));
        this.coursesLoading = false;
      },
      error: (error) => {
        console.error('Error loading user courses:', error);
        this.userCourses = [];
        this.coursesLoading = false;
      },
    });
  }

  formatCourseSchedule(schedule: any): string {
    if (!schedule || !schedule.daysOfWeek) {
      return 'Schedule TBD';
    }

    const days = schedule.daysOfWeek
      .map((day: string) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');

    return `${days} ${schedule.startTime}-${schedule.endTime}`;
  }

  startEditingProfile() {
    this.isEditingProfile = true;
    this.populateEditForm();
  }

  cancelEditingProfile() {
    this.isEditingProfile = false;
    this.populateEditForm();
    this.error = '';
    this.success = '';
  }

  populateEditForm() {
    if (this.user) {
      this.editProfileForm = {
        username: this.user.username,
        email: this.user.email,
        bio: this.user.bio || '',
        location: this.user.location || '',
        avatar: this.user.avatar || '',
      };
    }
  }

  saveProfile() {
    if (!this.user) return;

    this.profileUpdateLoading = true;
    this.error = '';
    this.success = '';

    const updateData = {
      id: this.user.id,
      username: this.editProfileForm.username,
      email: this.editProfileForm.email,
      bio: this.editProfileForm.bio,
      location: this.editProfileForm.location,
      avatar: this.editProfileForm.avatar,
    };

    this.apiService.updateUser(updateData).subscribe({
      next: (response) => {
        this.user = { ...this.user!, ...this.editProfileForm };
        this.isEditingProfile = false;
        this.success = 'Profile updated successfully!';
        this.profileUpdateLoading = false;

        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.error = error.error?.error || 'Failed to update profile';
        this.profileUpdateLoading = false;
      },
    });
  }

  editPainting(paintingId: string) {
    this.router.navigate(['/edit-painting', paintingId]);
  }

  confirmDeletePainting(paintingId: string) {
    this.deletingPaintingId = paintingId;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deletingPaintingId = null;
  }

  deletePainting() {
    if (!this.deletingPaintingId) return;

    this.apiService.deletePainting(this.deletingPaintingId).subscribe({
      next: (response) => {
        this.userPaintings = this.userPaintings.filter(
          (p) => p._id !== this.deletingPaintingId
        );
        this.showDeleteConfirm = false;
        this.deletingPaintingId = null;
        this.success = 'Painting deleted successfully!';

        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error deleting painting:', error);
        this.error = error.error?.error || 'Failed to delete painting';
        this.showDeleteConfirm = false;
        this.deletingPaintingId = null;
      },
    });
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getCourseStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'completed':
        return '#6c757d';
      case 'upcoming':
        return '#007bff';
      case 'dropped':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#28a745';
    if (progress >= 50) return '#ffc107';
    return '#dc3545';
  }

  hasProfilePicture(): boolean {
    return Boolean(this.user?.avatar?.trim());
  }

  getProfilePictureUrl(): string {
    return this.user?.avatar || '';
  }

  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      const imageExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.svg',
      ];
      const lowercaseUrl = url.toLowerCase();
      return (
        imageExtensions.some((ext) => lowercaseUrl.includes(ext)) ||
        lowercaseUrl.includes('image') ||
        lowercaseUrl.includes('avatar') ||
        lowercaseUrl.includes('profile')
      );
    } catch {
      return false;
    }
  }

  previewAvatar(): boolean {
    return this.isValidImageUrl(this.editProfileForm.avatar);
  }
}
