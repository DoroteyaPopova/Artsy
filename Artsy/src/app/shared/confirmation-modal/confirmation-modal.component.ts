import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faExclamationTriangle,
  faTimes,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css',
})
export class ConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() loadingText = 'Processing...';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';
  @Input() loading = false;
  @Input() courseTitle = '';
  @Input() warningNote = '';
  @Input() confirmIcon: any = null;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  faExclamationTriangle = faExclamationTriangle;
  faTimes = faTimes;
  faTrash = faTrash;

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
