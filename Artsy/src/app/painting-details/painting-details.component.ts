import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from '../api.service';

interface Painting {
  _id: string;
  title: string;
  author: string;
  category: string;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  description: string;
  image: string;
  owner: any;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: string;
  formattedDimensions?: string;
}

interface Comment {
  _id: string;
  content: string;
  userId: {
    username: string;
    _id: string;
  };
  createdAt: string;
  replies?: Comment[];
  parentComment?: string;
}

interface Rating {
  _id: string;
  rating: number;
  userId: string;
}

@Component({
  selector: 'app-painting-details',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './painting-details.component.html',
  styleUrl: './painting-details.component.css',
})
export class PaintingDetailsComponent implements OnInit {
  painting: Painting | null = null;
  comments: Comment[] = [];
  ratings: Rating[] = [];

  loading: boolean = false;
  error: string = '';
  paintingId: string = '';

  currentUser: any = null;
  isLoggedIn: boolean = false;
  isOwner: boolean = false;

  userRating: number = 0;
  hasUserRated: boolean = false;
  currentUserRating: number = 0;
  hoverRating: number = 0;
  showRatingConfirm: boolean = false;
  pendingRating: number = 0;

  newComment: string = '';
  replyContent: string = '';
  replyingToId: string = '';

  starIcon = faStar;
  solidStarIcon = solidStar;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.paintingId = this.route.snapshot.params['id'];
    this.checkUserStatus();
    this.loadPaintingDetails();
    this.loadComments();
  }

  checkUserStatus() {
    this.isLoggedIn = this.apiService.isLoggedIn();
    if (this.isLoggedIn) {
      this.apiService.getProfile().subscribe({
        next: (response) => {
          this.currentUser = response.user;
          this.checkOwnership();
        },
        error: (error) => {
          console.error('Error getting user profile:', error);
          this.isLoggedIn = false;
        },
      });
    }
  }

  loadPaintingDetails() {
    this.loading = true;
    this.error = '';

    this.apiService.getSinglePainting(this.paintingId).subscribe({
      next: (painting: Painting) => {
        this.painting = painting;
        this.loading = false;

        this.checkOwnership();

        if (this.isLoggedIn && this.currentUser && !this.isOwner) {
          this.checkUserRating();
        }
      },
      error: (error) => {
        console.error('Error loading painting:', error);
        this.error = 'Failed to load painting details.';
        this.loading = false;
      },
    });
  }

  checkOwnership() {
    if (!this.isLoggedIn || !this.currentUser || !this.painting) {
      this.isOwner = false;
      return;
    }

    this.isOwner =
      this.painting.owner &&
      (this.painting.owner._id === this.currentUser.id ||
        this.painting.owner === this.currentUser.id);
  }

  checkUserRating() {
    if (!this.currentUser) return;

    this.apiService
      .getUserRating(this.paintingId, this.currentUser.id)
      .subscribe({
        next: (rating) => {
          this.hasUserRated = true;
          this.currentUserRating = rating.rating;
          this.userRating = rating.rating;
        },
        error: (error) => {
          this.hasUserRated = false;
          this.currentUserRating = 0;
        },
      });
  }

  loadComments() {
    this.apiService.getCommentsForPainting(this.paintingId).subscribe({
      next: (response: any) => {
        this.comments = response.comments || [];
      },
      error: (error) => {
        console.error('Error loading comments:', error);
      },
    });
  }

  setRating(rating: number) {
    if (!this.isLoggedIn) {
      alert('Please log in to rate this painting');
      return;
    }

    if (this.isOwner) {
      alert('You cannot rate your own painting');
      return;
    }

    if (this.hasUserRated) {
      this.pendingRating = rating;
      this.showRatingConfirm = true;
    } else {
      this.userRating = rating;
      this.submitRating();
    }
  }

  confirmRatingChange() {
    this.userRating = this.pendingRating;
    this.showRatingConfirm = false;
    this.updateRating();
  }

  cancelRatingChange() {
    this.showRatingConfirm = false;
    this.pendingRating = 0;
    this.hoverRating = 0;
  }

  onRatingHover(rating: number) {
    if (!this.isLoggedIn || this.isOwner) return;
    this.hoverRating = rating;
  }

  onRatingLeave() {
    this.hoverRating = 0;
  }

  getRatingStarType(starIndex: number): any {
    if (!this.isLoggedIn || this.isOwner) {
      return starIndex <= Math.floor(this.painting?.averageRating || 0)
        ? this.solidStarIcon
        : this.starIcon;
    }

    if (this.hasUserRated && !this.hoverRating) {
      return starIndex <= this.currentUserRating
        ? this.solidStarIcon
        : this.starIcon;
    }

    const displayRating =
      this.hoverRating || (this.hasUserRated ? this.currentUserRating : 0);
    return starIndex <= displayRating ? this.solidStarIcon : this.starIcon;
  }

  submitRating() {
    if (!this.isLoggedIn || this.userRating === 0) return;

    const ratingData = {
      paintingId: this.paintingId,
      userId: this.currentUser.id,
      rating: this.userRating,
    };

    this.apiService.submitRating(ratingData).subscribe({
      next: (response) => {
        this.hasUserRated = true;
        this.currentUserRating = this.userRating;
        this.hoverRating = 0;
        this.loadPaintingDetails();
      },
      error: (error) => {
        console.error('Error submitting rating:', error);
        if (error.status === 409) {
          this.hasUserRated = true;
          this.currentUserRating = error.error.currentRating;
          alert(
            'You have already rated this painting. Click on the stars to change your rating.'
          );
        } else {
          this.userRating = 0;
          alert('Failed to submit rating. Please try again.');
        }
      },
    });
  }

  updateRating() {
    if (!this.isLoggedIn || this.userRating === 0) return;

    const ratingData = {
      paintingId: this.paintingId,
      userId: this.currentUser.id,
      rating: this.userRating,
    };

    this.apiService.updateRating(ratingData).subscribe({
      next: (response) => {
        this.currentUserRating = this.userRating;
        this.hoverRating = 0;
        this.loadPaintingDetails();
      },
      error: (error) => {
        console.error('Error updating rating:', error);
        this.userRating = this.currentUserRating;
        alert('Failed to update rating. Please try again.');
      },
    });
  }

  submitComment() {
    if (!this.isLoggedIn || !this.newComment.trim()) return;

    const commentData = {
      paintingId: this.paintingId,
      content: this.newComment.trim(),
    };

    this.apiService.addComment(commentData).subscribe({
      next: (response) => {
        this.newComment = '';
        this.loadComments();
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
      },
    });
  }

  startReply(commentId: string) {
    this.replyingToId = commentId;
    this.replyContent = '';
  }

  cancelReply() {
    this.replyingToId = '';
    this.replyContent = '';
  }

  submitReply(parentCommentId: string) {
    if (!this.isLoggedIn || !this.replyContent.trim()) return;

    const replyData = {
      paintingId: this.paintingId,
      content: this.replyContent.trim(),
      parentComment: parentCommentId,
    };

    this.apiService.addComment(replyData).subscribe({
      next: (response) => {
        this.cancelReply();
        this.loadComments();
      },
      error: (error) => {
        console.error('Error adding reply:', error);
        alert('Failed to add reply. Please try again.');
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

  getUserRatingStars(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  goBack() {
    this.router.navigate(['/gallery']);
  }
}
