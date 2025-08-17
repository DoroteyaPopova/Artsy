import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TeacherGuard implements CanActivate {
  constructor(private apiService: ApiService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const token = this.apiService.getToken();

    if (!token) {
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.apiService.getProfile().pipe(
      map((response) => {
        const user = response.user;
        const isTeacherOrAdmin = this.checkTeacherAccess(user);

        if (isTeacherOrAdmin) {
          return true;
        } else {
          alert('Access denied. Teacher privileges required.');
          this.router.navigate(['/']);
          return false;
        }
      }),
      catchError((error) => {
        console.error('Teacher check failed:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  private checkTeacherAccess(user: any): boolean {
    if (user.role === 'teacher' || user.role === 'admin') {
      return true;
    }
    return false;
  }
}
