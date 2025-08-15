import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-create-course',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './create-course.component.html',
  styleUrl: './create-course.component.css',
})
export class CreateCourseComponent implements OnInit {
  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faTimes = faTimes;

  courseForm!: FormGroup;

  loading = false;
  saving = false;
  error = '';
  success = '';

  currentUser: any = null;

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

  currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'BGN', label: 'BGN (лв)' },
    { value: 'GBP', label: 'GBP (£)' },
  ];

  daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadCurrentUser();
  }

  initializeForm() {
    this.courseForm = this.formBuilder.group(
      {
        title: ['', [Validators.required, Validators.maxLength(100)]],
        description: [
          '',
          [
            Validators.required,
            Validators.minLength(20),
            Validators.maxLength(1000),
          ],
        ],
        category: ['digital-art', Validators.required],
        level: ['beginner', Validators.required],
        image: [''],

        duration: this.formBuilder.group({
          weeks: [
            1,
            [Validators.required, Validators.min(1), Validators.max(52)],
          ],
          totalHours: [1, [Validators.required, Validators.min(1)]],
        }),
        cost: this.formBuilder.group({
          amount: [0, [Validators.required, Validators.min(0)]],
          currency: ['USD', Validators.required],
        }),

        schedule: this.formBuilder.group({
          daysOfWeek: [[], [Validators.required, this.minArrayLength(1)]],
          startTime: ['', [Validators.required, this.timeValidator]],
          endTime: ['', [Validators.required, this.timeValidator]],
          timezone: ['UTC'],
        }),

        startDate: ['', Validators.required],
        endDate: ['', Validators.required],

        maxStudents: [
          10,
          [Validators.required, Validators.min(1), Validators.max(50)],
        ],

        requirements: ['', Validators.maxLength(500)],
        materials: ['', Validators.maxLength(500)],

        tags: this.formBuilder.array([]),
      },
      { validators: this.dateRangeValidator }
    );
  }

  timeValidator(control: any) {
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(control.value) ? null : { invalidTime: true };
  }

  minArrayLength(min: number) {
    return (control: any) => {
      return control.value && control.value.length >= min
        ? null
        : { minLength: true };
    };
  }

  dateRangeValidator(form: FormGroup) {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return start < end ? null : { dateRange: true };
    }
    return null;
  }

  loadCurrentUser() {
    this.loading = true;
    this.apiService.getProfile().subscribe({
      next: (response) => {
        this.currentUser = response.user;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  get tagsArray() {
    return this.courseForm.get('tags') as FormArray;
  }

  addTag() {
    if (this.tagsArray.length < 10) {
      this.tagsArray.push(
        this.formBuilder.control('', [Validators.maxLength(30)])
      );
    }
  }

  removeTag(index: number) {
    this.tagsArray.removeAt(index);
  }

  onDayChange(day: string, event: any) {
    const daysControl = this.courseForm.get('schedule.daysOfWeek');
    let currentDays = daysControl?.value || [];

    if (event.target.checked) {
      if (!currentDays.includes(day)) {
        currentDays.push(day);
      }
    } else {
      currentDays = currentDays.filter((d: string) => d !== day);
    }

    daysControl?.setValue(currentDays);
  }

  isDaySelected(day: string): boolean {
    const days = this.courseForm.get('schedule.daysOfWeek')?.value || [];
    return days.includes(day);
  }

  onSubmit() {
    if (this.courseForm.valid) {
      this.saving = true;
      this.error = '';

      const formData = this.courseForm.value;

      formData.tags = formData.tags.filter((tag: string) => tag.trim() !== '');

      const courseData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      this.apiService.createCourse(courseData).subscribe({
        next: (response) => {
          this.success = 'Course created successfully!';
          this.saving = false;

          setTimeout(() => {
            this.router.navigate(['/teacher-dashboard'], {
              state: { success: 'Course created successfully!' },
            });
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating course:', error);
          this.error =
            error.error?.error || 'Failed to create course. Please try again.';
          this.saving = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.courseForm);
      this.error = 'Please fix the errors below and try again.';
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  goBack() {
    this.router.navigate(['/teacher-dashboard']);
  }

  get title() {
    return this.courseForm.get('title');
  }
  get description() {
    return this.courseForm.get('description');
  }
  get category() {
    return this.courseForm.get('category');
  }
  get level() {
    return this.courseForm.get('level');
  }
  get weeks() {
    return this.courseForm.get('duration.weeks');
  }
  get totalHours() {
    return this.courseForm.get('duration.totalHours');
  }
  get amount() {
    return this.courseForm.get('cost.amount');
  }
  get currency() {
    return this.courseForm.get('cost.currency');
  }
  get daysOfWeekControl() {
    return this.courseForm.get('schedule.daysOfWeek');
  }
  get startTime() {
    return this.courseForm.get('schedule.startTime');
  }
  get endTime() {
    return this.courseForm.get('schedule.endTime');
  }
  get startDate() {
    return this.courseForm.get('startDate');
  }
  get endDate() {
    return this.courseForm.get('endDate');
  }
  get maxStudents() {
    return this.courseForm.get('maxStudents');
  }
  get requirements() {
    return this.courseForm.get('requirements');
  }
  get materials() {
    return this.courseForm.get('materials');
  }
}
