import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ActionButtonColor,
  ActionButtonSize,
  ActionButtonType,
} from './action-button.type';

@Component({
  selector: 'app-action-button',
  imports: [
    NgClass,
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './action-button.component.html',
  styleUrl: './action-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonComponent {
  text = input.required<string>();

  type = input<ActionButtonType>('raised');
  size = input<ActionButtonSize>('medium');
  color = input<ActionButtonColor>('primary');
  icon = input<string | null>(null);

  disabled = input<boolean>(false);
  fullWidth = input<boolean>(false);
  isLoading = input<boolean>(false);

  clicked = output<void>();

  handleClickEvent() {
    this.clicked.emit();
  }
}
