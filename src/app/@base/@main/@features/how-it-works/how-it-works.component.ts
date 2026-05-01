import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollRevealContainerDirective, TranslateModule],
})
export default class HowItWorksComponent {}

