import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  OnDestroy,
  Renderer2,
} from '@angular/core';

/**
 * Adds scroll-triggered fade/slide-in to major blocks: direct `section` / `article` children,
 * or (for `.page`-style layouts) each direct child of the host element.
 */
@Directive({
  selector: '[appScrollRevealContainer]',
  standalone: true,
})
export class ScrollRevealContainerDirective implements AfterViewInit, OnDestroy {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _doc = inject(DOCUMENT);
  private readonly _renderer = inject(Renderer2);
  private _observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    const win = this._doc.defaultView;
    if (!win) {
      return;
    }
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.revealAllImmediately();
      return;
    }

    const root = this._el.nativeElement;
    const targets = this.collectTargets(root);
    const imageTargets = this.collectImageTargets(root);
    if (targets.length === 0) {
      if (imageTargets.length === 0) {
        return;
      }
    }

    for (const el of targets) {
      this._renderer.setAttribute(el, 'data-scroll-reveal', '');
    }
    for (const img of imageTargets) {
      this._renderer.setAttribute(img, 'data-image-reveal', '');
    }

    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const t = entry.target as HTMLElement;
          this._renderer.addClass(t, 'scroll-reveal--visible');
          this._observer?.unobserve(t);
        }
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    for (const el of [...targets, ...imageTargets]) {
      this._observer.observe(el);
    }
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
    this._observer = null;
  }

  private revealAllImmediately(): void {
    const root = this._el.nativeElement;
    for (const el of this.collectTargets(root)) {
      this._renderer.setAttribute(el, 'data-scroll-reveal', '');
      this._renderer.addClass(el, 'scroll-reveal--visible');
    }
    for (const img of this.collectImageTargets(root)) {
      this._renderer.setAttribute(img, 'data-image-reveal', '');
      this._renderer.addClass(img, 'scroll-reveal--visible');
    }
  }

  private collectTargets(root: HTMLElement): HTMLElement[] {
    const fromSections = Array.from(
      root.querySelectorAll<HTMLElement>(':scope > section, :scope > article'),
    );
    if (fromSections.length > 0) {
      return fromSections;
    }

    const direct = Array.from(root.querySelectorAll<HTMLElement>(':scope > *')).filter(
      (el) => {
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
          return false;
        }
        if (el.classList.contains('checkout-backdrop')) {
          return false;
        }
        return true;
      },
    );
    if (direct.length > 0) {
      return direct;
    }

    if (root.matches('section, article')) {
      return [root];
    }

    return [];
  }

  /**
   * Collects content images under the container for one-time first-viewport reveal.
   */
  private collectImageTargets(root: HTMLElement): HTMLImageElement[] {
    return Array.from(root.querySelectorAll<HTMLImageElement>('img')).filter((img) => {
      if ((img.closest('[data-image-reveal]') as HTMLElement | null) !== null) {
        return false;
      }
      return true;
    });
  }
}
