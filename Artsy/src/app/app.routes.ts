import { Routes } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { HomeComponent } from './home/home.component';
import { GalleryComponent } from './gallery/gallery.component';
import { CoursesComponent } from './courses/courses.component';
import { AboutComponent } from './about/about.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { LogoutComponent } from './logout/logout.component';
import { PaintingDetailsComponent } from './painting-details/painting-details.component';
import { UploadComponent } from './upload/upload.component';
import { ProfileComponent } from './profile/profile.component';
import { EditPaintingComponent } from './edit-painting/edit-painting.component';
import { TeacherFormComponent } from './teacher-form/teacher-form.component';
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
import { CreateCourseComponent } from './teacher-dashboard/create-course/create-course.component';
import { EditCourseComponent } from './teacher-dashboard/edit-course/edit-course.component';
import { CourseDetailsComponent } from './course-details/course-details.component';

// Admin Components
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { TeacherApplicationsComponent } from './admin/teacher-applications/teacher-applications.component';

// Import the guards
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { AdminGuard } from './guards/admin.guard';
import { TeacherGuard } from './guards/teacher.guard';

export const routes: Routes = [
  { path: 'navigation', component: NavigationComponent },
  { path: '', component: HomeComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'courses', component: CoursesComponent },
  { path: 'about', component: AboutComponent },

  // Painting details page
  { path: 'paintings/:id', component: PaintingDetailsComponent },

  // Protected routes - only accessible when NOT logged in
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard],
  },

  // Protected routes - only accessible when logged in
  {
    path: 'upload',
    component: UploadComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'logout',
    component: LogoutComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'edit-painting/:id',
    component: EditPaintingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'become-teacher',
    component: TeacherFormComponent,
    canActivate: [AuthGuard],
  },

  // Teacher routes - only accessible by teachers
  {
    path: 'teacher-dashboard',
    component: TeacherDashboardComponent,
    canActivate: [TeacherGuard],
  },
  {
    path: 'create-course',
    component: CreateCourseComponent,
    canActivate: [TeacherGuard],
  },
  {
    path: 'edit-course/:id',
    component: EditCourseComponent,
    canActivate: [TeacherGuard],
  },

  // Course details - public
  { path: 'courses/:id', component: CourseDetailsComponent },

  // Admin routes - only accessible by admins
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'teacher-applications', component: TeacherApplicationsComponent },
    ],
  },

  // Redirect unknown routes to home
  { path: '**', redirectTo: '' },
];
