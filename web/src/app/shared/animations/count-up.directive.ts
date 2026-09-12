import { Directive, ElementRef, PLATFORM_ID, effect, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const FORMATTER = new Intl.NumberFormat('de-AT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COUNT_UP_DURATION_MS = 500;

/** Animates a currency figure from its previous value to the new one on change. */
@Directive({
  selector: '[countUp]',
  standalone: true,
})
export class CountUpDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly countUp = input<number | null | undefined>(null);

  private current = 0;
  private frame: number | null = null;

  constructor() {
    effect(() => {
      this.animateTo(this.countUp() ?? 0);
    });
  }

  private animateTo(target: number): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    // Sin navegador (SSR/prerender) no hay requestAnimationFrame: fijamos el valor final.
    const reduceMotion =
      !this.isBrowser || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      this.current = target;
      this.el.nativeElement.textContent = FORMATTER.format(target);
      return;
    }

    const start = this.current;
    const delta = target - start;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / COUNT_UP_DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.current = start + delta * eased;
      this.el.nativeElement.textContent = FORMATTER.format(this.current);

      if (progress < 1) {
        this.frame = requestAnimationFrame(step);
      } else {
        this.current = target;
        this.frame = null;
      }
    };

    this.frame = requestAnimationFrame(step);
  }
}
