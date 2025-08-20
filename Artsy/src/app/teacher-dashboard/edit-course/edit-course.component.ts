import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faTimes,
  faSave,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-edit-course',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './edit-course.component.html',
  styleUrl: './edit-course.component.css',
})
export class EditCourseComponent implements OnInit {
  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faTimes = faTimes;
  faSave = faSave;
  faRefresh = faRefresh;

  courseForm!: FormGroup;
  courseId: string = '';
  originalCourse: any = null;
  originalFormValues: any = null; // Store original form values for comparison

  loading = true;
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

  courseStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.courseId = this.route.snapshot.params['id'];
    this.loadCurrentUser();
    this.loadCourse();
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
        status: ['draft', Validators.required],

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
    this.apiService.getProfile().subscribe({
      next: (response) => {
        this.currentUser = response.user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  loadCourse() {
    this.loading = true;
    this.error = '';

    this.apiService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.originalCourse = course;

        if (
          course.teacher._id !== this.currentUser?.id &&
          course.teacher !== this.currentUser?.id &&
          this.currentUser?.role !== 'admin'
        ) {
          this.error = 'You are not authorized to edit this course';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/teacher-dashboard']);
          }, 2000);
          return;
        }

        this.populateForm(course);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.error = 'Failed to load course details';
        this.loading = false;
      },
    });
  }

  populateForm(course: any) {
    const startDate = new Date(course.startDate).toISOString().split('T')[0];
    const endDate = new Date(course.endDate).toISOString().split('T')[0];

    // Clear existing tags
    while (this.tagsArray.length !== 0) {
      this.tagsArray.removeAt(0);
    }

    // Add tags if they exist
    if (course.tags && course.tags.length > 0) {
      course.tags.forEach((tag: string) => {
        this.tagsArray.push(
          this.formBuilder.control(tag, [Validators.maxLength(30)])
        );
      });
    }

    // Patch form values
    this.courseForm.patchValue({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      image: course.image || '',
      status: course.status || 'draft',
      duration: {
        weeks: course.duration.weeks,
        totalHours: course.duration.totalHours,
      },
      cost: {
        amount: course.cost.amount,
        currency: course.cost.currency,
      },
      schedule: {
        daysOfWeek: course.schedule.daysOfWeek || [],
        startTime: course.schedule.startTime,
        endTime: course.schedule.endTime,
        timezone: course.schedule.timezone || 'UTC',
      },
      startDate: startDate,
      endDate: endDate,
      maxStudents: course.maxStudents,
      requirements: course.requirements || '',
      materials: course.materials || '',
    });

    // Store original form values for comparison
    this.storeOriginalFormValues();
  }

  storeOriginalFormValues() {
    // Deep clone of form values to avoid reference issues
    this.originalFormValues = JSON.parse(JSON.stringify(this.courseForm.value));
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

  hasChanges(): boolean {
    if (!this.originalFormValues) return false;

    const currentValues = this.courseForm.value;

    // Helper function to deeply compare objects
    const deepEqual = (obj1: any, obj2: any): boolean => {
      if (obj1 === obj2) return true;

      if (obj1 == null || obj2 == null) return obj1 === obj2;

      if (typeof obj1 !== typeof obj2) return false;

      if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        return obj1.every((val, index) => deepEqual(val, obj2[index]));
      }

      if (typeof obj1 === 'object') {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        return keys1.every((key) => deepEqual(obj1[key], obj2[key]));
      }

      return obj1 === obj2;
    };

    return !deepEqual(currentValues, this.originalFormValues);
  }

  resetForm() {
    if (this.originalCourse) {
      this.populateForm(this.originalCourse);
      this.error = '';
      this.success = '';
    }
  }

  canEditStudentLimit(): boolean {
    return (
      !this.originalCourse ||
      this.originalCourse.currentStudents === 0 ||
      this.courseForm.get('maxStudents')?.value >=
        this.originalCourse.currentStudents
    );
  }

  onSubmit() {
    if (this.courseForm.valid) {
      if (
        this.originalCourse &&
        this.originalCourse.currentStudents > 0 &&
        this.courseForm.get('maxStudents')?.value <
          this.originalCourse.currentStudents
      ) {
        this.error = `Cannot reduce max students below current enrollment (${this.originalCourse.currentStudents} students)`;
        return;
      }

      this.saving = true;
      this.error = '';

      const formData = this.courseForm.value;

      // Filter out empty tags
      formData.tags = formData.tags.filter((tag: string) => tag.trim() !== '');

      const updateData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      console.log('Submitting update data:', updateData); // Debug log

      this.apiService.updateCourse(this.courseId, updateData).subscribe({
        next: (response) => {
          this.success = 'Course updated successfully!';
          this.saving = false;
          this.originalCourse = response.course;

          // Update the stored original values to reflect the saved state
          this.storeOriginalFormValues();

          setTimeout(() => {
            this.router.navigate(['/teacher-dashboard'], {
              state: { success: 'Course updated successfully!' },
            });
          }, 2000);
        },
        error: (error) => {
          console.error('Error updating course:', error);
          this.error =
            error.error?.error || 'Failed to update course. Please try again.';
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

  // Getter methods for form controls
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
  get status() {
    return this.courseForm.get('status');
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
