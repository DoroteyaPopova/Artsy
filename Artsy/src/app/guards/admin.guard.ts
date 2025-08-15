import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
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
        const isAdmin = this.checkAdminAccess(user);

        if (isAdmin) {
          console.log(
            `Admin access granted for: ${user.email} (role: ${user.role})`
          );
          return true;
        } else {
          console.log(
            `Admin access denied for: ${user.email} (role: ${
              user.role || 'user'
            })`
          );
          alert('Access denied. Administrator privileges required.');
          this.router.navigate(['/']);
          return false;
        }
      }),
      catchError((error) => {
        console.error('Admin check failed:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  private checkAdminAccess(user: any): boolean {
    if (user.role === 'admin') {
      return true;
    }

    const ADMIN_EMAIL = 'doriadmin@gmail.com';
    const isAdminEmail = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const hasAdminField = user.isAdmin === true;

    return isAdminEmail || hasAdminField;
  }
}
