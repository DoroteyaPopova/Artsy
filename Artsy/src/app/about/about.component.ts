import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPaintBrush,
  faUsers,
  faHeart,
  faGraduationCap,
  faEnvelope,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  faPaintBrush = faPaintBrush;
  faUsers = faUsers;
  faHeart = faHeart;
  faGraduationCap = faGraduationCap;
  faEnvelope = faEnvelope;
  faMapMarkerAlt = faMapMarkerAlt;

  features = [
    {
      icon: this.faPaintBrush,
      title: 'Share Your Art',
      description:
        'Upload and showcase your digital and traditional artwork to a community of art enthusiasts.',
    },
    {
      icon: this.faUsers,
      title: 'Connect with Artists',
      description:
        'Join a vibrant community of artists, comment on artworks, and get feedback on your creations.',
    },
    {
      icon: this.faGraduationCap,
      title: 'Learn & Grow',
      description:
        'Take courses in various art techniques from experienced instructors and improve your skills.',
    },
    {
      icon: this.faHeart,
      title: 'Discover & Support',
      description:
        'Explore amazing artworks, rate your favorites, and support fellow artists in their journey.',
    },
  ];

  teamMembers = [
    {
      name: 'Sarah Mitchell',
      role: 'Art Director & Founder',
      description:
        'Professional artist with 15+ years of experience in digital and traditional art.',
      specialties: ['Digital Art', 'Oil Painting', 'Concept Art'],
    },
    {
      name: 'Michael Chen',
      role: 'Lead Instructor',
      description:
        'Renowned painter specializing in traditional techniques and art history.',
      specialties: ['Oil Painting', 'Watercolor', 'Art History'],
    },
    {
      name: 'Emma Rodriguez',
      role: 'Community Manager',
      description:
        'Passionate about fostering creativity and building supportive art communities.',
      specialties: ['Abstract Art', 'Mixed Media', 'Art Therapy'],
    },
  ];
}
