import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

/**
 * Cross-fade with a light vertical slide for primary layout navigations.
 * Pairs with `data: { animation: '...' }` on routes (each value should be unique per transition).
 */
export const routerAnimations = trigger('routerAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
      }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate(
          '520ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateY(-12px)' }),
        ),
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        animate(
          '680ms 140ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'none' }),
        ),
      ], { optional: true }),
    ]),
  ]),
]);
