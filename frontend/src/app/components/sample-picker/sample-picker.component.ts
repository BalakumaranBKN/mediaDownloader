import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sample-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sample-picker.component.html',
  styleUrl: './sample-picker.component.css'
})
export class SamplePickerComponent {
  @Output() selectSample = new EventEmitter<string>();

  samples = [
    {
      id: 'single',
      label: 'Single Photo',
      icon: 'photo',
      badge: 'Image',
      url: 'demo://single-image'
    },
    {
      id: 'carousel',
      label: 'Carousel (4 Photos)',
      icon: 'view_carousel',
      badge: 'Grid',
      url: 'demo://carousel'
    },
    {
      id: 'video',
      label: 'Video (Audio/Mute)',
      icon: 'movie',
      badge: 'Video',
      url: 'demo://video-with-audio'
    },
    {
      id: 'policy',
      label: 'Platform Rules',
      icon: 'gavel',
      badge: 'Policy',
      url: 'https://www.instagram.com/p/C_sample_post/'
    }
  ];

  pick(url: string): void {
    this.selectSample.emit(url);
  }
}
