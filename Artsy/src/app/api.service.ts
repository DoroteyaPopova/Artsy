import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './services/auth.service';

interface User {
  username: string;
  email: string;
  password: string;
  repass?: string;
}

interface Painting {
  _id?: string;
  title: string;
  description: string;
  image: string;
  owner?: string;
}

interface AuthResponse {
  message?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
  token?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/atp';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  register(user: User): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users/register`, user)
      .pipe(
        tap((response) => {
          // Automatically set auth state on successful registration
          if (response.token && response.user) {
            this.authService.setAuthenticationState(
              response.user,
              response.token
            );
          }
        })
      );
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.token && response.user) {
            this.authService.setAuthenticationState(
              response.user,
              response.token
            );
          }
        })
      );
  }

  getProfile(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/users/profile`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response: any) => {
          if (response.user) {
            this.authService.updateUser(response.user);
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/logout`).pipe(
      tap(() => {
        this.authService.clearAuthenticationState();
      })
    );
  }

  // ==========================================
  // USER MANAGEMENT METHODS
  // ==========================================

  getExtendedProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}`);
  }

  getUserStats(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}/stats`);
  }

  updateUser(userData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/users/update`, userData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response: any) => {
          if (response.user) {
            this.authService.updateUser(response.user);
          }
        })
      );
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==========================================
  // PAINTING METHODS
  // ==========================================

  getPaintings(category?: string): Observable<any> {
    let url = `${this.baseUrl}/paintings/catalog`;

    if (category && category !== 'all') {
      url += `?category=${category}`;
    }

    return this.http.get<any>(url);
  }

  addPainting(painting: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/paintings/upload`, painting, {
      headers: this.getAuthHeaders(),
    });
  }

  updatePainting(id: string, painting: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/paintings/${id}`, painting, {
      headers: this.getAuthHeaders(),
    });
  }

  deletePainting(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/paintings/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserPaintings(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/paintings/user/${userId}`);
  }

  getSinglePainting(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/paintings/${id}`);
  }

  getPaintingById(paintingId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/paintings/${paintingId}`);
  }

  getHighestRatedPainting(): Observable<any> {
    return this.http.get(`${this.baseUrl}/paintings/top-rated`);
  }

  // Admin: Get all paintings with enhanced options
  getAllPaintingsAdmin(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Observable<any> {
    let url = `${this.baseUrl}/paintings/catalog?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==========================================
  // COMMENT METHODS
  // ==========================================

  getCommentsForPainting(paintingId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/comments/painting/${paintingId}`);
  }

  addComment(commentData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/comments`, commentData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Admin: Get all comments
  getAllComments(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/comments/all?page=${page}&limit=${limit}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Admin: Delete comment
  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comments/${commentId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==========================================
  // RATING METHODS
  // ==========================================

  submitRating(ratingData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/rating`, ratingData, {
      headers: this.getAuthHeaders(),
    });
  }

  checkUserRating(paintingId: string, userId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/rating/check/${userId}/${paintingId}`
    );
  }

  getUserRating(paintingId: string, userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/rating/user/${userId}/${paintingId}`);
  }

  updateRating(ratingData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/rating`, ratingData, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==========================================
  // TEACHER APPLICATION METHODS
  // ==========================================

  // User: Submit teacher application
  submitTeacherApplication(applicationData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/teachers/apply`, applicationData, {
      headers: this.getAuthHeaders(),
    });
  }

  // User: Get own application status
  getTeacherApplicationStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/teachers/my-application`, {
      headers: this.getAuthHeaders(),
    });
  }

  // User: Update own pending application
  updateTeacherApplication(applicationData: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/teachers/my-application`,
      applicationData,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // User: Delete own pending application
  deleteTeacherApplication(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/teachers/my-application`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Public: Get approved teachers
  getApprovedTeachers(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/teachers/approved?page=${page}&limit=${limit}`
    );
  }

  // Admin: Get all teacher applications
  getAllTeacherApplications(
    status: string = 'all',
    page: number = 1,
    limit: number = 10
  ): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/teachers/applications?status=${status}&page=${page}&limit=${limit}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Admin: Get pending applications only
  getPendingTeacherApplications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/teachers/applications/pending`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Admin: Approve teacher application
  approveTeacherApplication(applicationId: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/teachers/applications/${applicationId}/approve`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Admin: Reject teacher application
  rejectTeacherApplication(
    applicationId: string,
    reason: string
  ): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/teachers/applications/${applicationId}/reject`,
      { reason },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // ==========================================
  // ADMIN METHODS
  // ==========================================

  // Admin: Get dashboard statistics
  getAdminStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/stats`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==========================================
  // TOKEN MANAGEMENT METHODS
  // ==========================================

  saveToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  removeToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }

  isLoggedIn(): boolean {
    return this.isBrowser && !!this.getToken();
  }

  // ==========================================
  // COURSE METHODS
  // ==========================================

  // Get all courses
  getCourses(filters?: {
    category?: string;
    level?: string;
    status?: string;
    teacher?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    let url = `${this.baseUrl}/courses`;

    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return this.http.get(url);
  }

  // Get single course by ID
  getCourseById(courseId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses/${courseId}`);
  }

  // Create new course (teachers only)
  createCourse(courseData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/courses`, courseData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Update course (teacher only)
  updateCourse(courseId: string, courseData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/courses/${courseId}`, courseData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Delete course (teacher only)
  deleteCourse(courseId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/courses/${courseId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Get courses by teacher
  getCoursesByTeacher(teacherId: string, status?: string): Observable<any> {
    let url = `${this.baseUrl}/courses/teacher/${teacherId}`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get(url);
  }

  // Enroll in course
  enrollInCourse(courseId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/courses/${courseId}/enroll`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Unenroll from course
  unenrollFromCourse(courseId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/courses/${courseId}/unenroll`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Get user's enrolled courses
  getUserEnrolledCourses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses/user/enrolled`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Get course statistics
  getCourseStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses/stats`);
  }
}
