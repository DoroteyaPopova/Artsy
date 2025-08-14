import { Component, OnInit } from '@angular/core';
import { TestService } from './test.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  template: '<p>Test Component</p>',
  standalone: true,
  imports: [CommonModule]
})
export class TestComponent implements OnInit {
  constructor(private testService: TestService) {}

  ngOnInit() {
    this.testService.testHttp();
  }
}
