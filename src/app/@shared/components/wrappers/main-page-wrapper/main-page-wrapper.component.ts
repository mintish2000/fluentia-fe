import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-main-page-wrapper',
  imports: [MatCardModule],
  templateUrl: './main-page-wrapper.component.html',
  styleUrl: './main-page-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageWrapperComponent {}
