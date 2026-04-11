import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CoreModule } from '@core/core.module';
import { BaseComponent } from '@shared/components/base/base.component';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { TutorHubService } from './tutor-hub.service';

@Component({
  selector: 'app-tutor',
  imports: [CommonModule, CoreModule, ScrollRevealContainerDirective],
  templateUrl: './tutor.component.html',
  styleUrl: './tutor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TutorHubService],
})
export default class TutorComponent extends BaseComponent {
  private readonly _hub = inject(TutorHubService);

  readonly displayName = this._hub.displayName;
}
