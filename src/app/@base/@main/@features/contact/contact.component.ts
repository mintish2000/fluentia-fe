import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollRevealContainerDirective],
})
export default class ContactComponent {}

