import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
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
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './action-button.component.html',
  styleUrl: './action-button.component.scss',
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
