import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  constructor(private apiService: ApiService, private router: Router) {}

  canActivate(): boolean {
    const token = this.apiService.getToken();

    if (!token) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}
