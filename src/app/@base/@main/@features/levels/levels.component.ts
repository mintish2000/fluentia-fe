import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';

type Level = {
  code: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  labelKey: string;
  durationKey: string;
  whoKey: string;
  outcomeKey: string;
  skills: { titleKey: string; itemsKeys: string[] }[];
  objectivesKeys: string[];
};

@Component({
  selector: 'app-levels',
  standalone: true,
  templateUrl: './levels.component.html',
  styleUrl: './levels.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollRevealContainerDirective, TranslateModule],
})
export default class LevelsComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  constructor() {
    afterNextRender(() => {
      const id = this.document.defaultView?.location.hash?.slice(1);
      if (!id?.startsWith('level-')) {
        return;
      }
      const el = this.document.getElementById(id);
      if (!el) {
        return;
      }
      const reduceMotion = this.document.defaultView?.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      el.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  levelJumpHref(code: Level['code']): string {
    const tree = this.router.createUrlTree(['/main', 'levels'], {
      fragment: `level-${code}`,
    });
    return this.router.serializeUrl(tree);
  }

  onLevelJumpClick(event: MouseEvent, code: Level['code']): void {
    if (event.button !== 0) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();

    const id = `level-${code}`;
    const el = this.document.getElementById(id);
    if (!el) {
      return;
    }
    const w = this.document.defaultView;
    const reduceMotion = w?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
    el.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    if (w) {
      w.history.replaceState(
        null,
        '',
        `${w.location.pathname}${w.location.search}#${id}`,
      );
    }
  }

  levels: Level[] = [
    {
      code: 'A1',
      labelKey: 'pages.levels.levels.a1.label',
      durationKey: 'pages.levels.levels.a1.duration',
      whoKey: 'pages.levels.levels.a1.who',
      outcomeKey: 'pages.levels.levels.a1.outcome',
      skills: [
        {
          titleKey: 'pages.levels.skills.speaking',
          itemsKeys: ['pages.levels.levels.a1.skills.speaking.0'],
        },
        {
          titleKey: 'pages.levels.skills.listening',
          itemsKeys: ['pages.levels.levels.a1.skills.listening.0'],
        },
        {
          titleKey: 'pages.levels.skills.reading',
          itemsKeys: ['pages.levels.levels.a1.skills.reading.0'],
        },
        {
          titleKey: 'pages.levels.skills.writing',
          itemsKeys: ['pages.levels.levels.a1.skills.writing.0'],
        },
      ],
      objectivesKeys: [
        'pages.levels.levels.a1.objectives.0',
        'pages.levels.levels.a1.objectives.1',
        'pages.levels.levels.a1.objectives.2',
        'pages.levels.levels.a1.objectives.3',
      ],
    },
    {
      code: 'A2',
      labelKey: 'pages.levels.levels.a2.label',
      durationKey: 'pages.levels.levels.a2.duration',
      whoKey: 'pages.levels.levels.a2.who',
      outcomeKey: 'pages.levels.levels.a2.outcome',
      skills: [
        {
          titleKey: 'pages.levels.skills.speaking',
          itemsKeys: ['pages.levels.levels.a2.skills.speaking.0'],
        },
        {
          titleKey: 'pages.levels.skills.listening',
          itemsKeys: ['pages.levels.levels.a2.skills.listening.0'],
        },
        {
          titleKey: 'pages.levels.skills.reading',
          itemsKeys: ['pages.levels.levels.a2.skills.reading.0'],
        },
        {
          titleKey: 'pages.levels.skills.writing',
          itemsKeys: ['pages.levels.levels.a2.skills.writing.0'],
        },
      ],
      objectivesKeys: [
        'pages.levels.levels.a2.objectives.0',
        'pages.levels.levels.a2.objectives.1',
        'pages.levels.levels.a2.objectives.2',
        'pages.levels.levels.a2.objectives.3',
      ],
    },
    {
      code: 'B1',
      labelKey: 'pages.levels.levels.b1.label',
      durationKey: 'pages.levels.levels.b1.duration',
      whoKey: 'pages.levels.levels.b1.who',
      outcomeKey: 'pages.levels.levels.b1.outcome',
      skills: [
        {
          titleKey: 'pages.levels.skills.speaking',
          itemsKeys: ['pages.levels.levels.b1.skills.speaking.0'],
        },
        {
          titleKey: 'pages.levels.skills.listening',
          itemsKeys: ['pages.levels.levels.b1.skills.listening.0'],
        },
        {
          titleKey: 'pages.levels.skills.reading',
          itemsKeys: ['pages.levels.levels.b1.skills.reading.0'],
        },
        {
          titleKey: 'pages.levels.skills.writing',
          itemsKeys: ['pages.levels.levels.b1.skills.writing.0'],
        },
      ],
      objectivesKeys: [
        'pages.levels.levels.b1.objectives.0',
        'pages.levels.levels.b1.objectives.1',
        'pages.levels.levels.b1.objectives.2',
        'pages.levels.levels.b1.objectives.3',
      ],
    },
    {
      code: 'B2',
      labelKey: 'pages.levels.levels.b2.label',
      durationKey: 'pages.levels.levels.b2.duration',
      whoKey: 'pages.levels.levels.b2.who',
      outcomeKey: 'pages.levels.levels.b2.outcome',
      skills: [
        {
          titleKey: 'pages.levels.skills.speaking',
          itemsKeys: ['pages.levels.levels.b2.skills.speaking.0'],
        },
        {
          titleKey: 'pages.levels.skills.listening',
          itemsKeys: ['pages.levels.levels.b2.skills.listening.0'],
        },
        {
          titleKey: 'pages.levels.skills.reading',
          itemsKeys: ['pages.levels.levels.b2.skills.reading.0'],
        },
        {
          titleKey: 'pages.levels.skills.writing',
          itemsKeys: ['pages.levels.levels.b2.skills.writing.0'],
        },
      ],
      objectivesKeys: [
        'pages.levels.levels.b2.objectives.0',
        'pages.levels.levels.b2.objectives.1',
        'pages.levels.levels.b2.objectives.2',
        'pages.levels.levels.b2.objectives.3',
      ],
    },
    {
      code: 'C1',
      labelKey: 'pages.levels.levels.c1.label',
      durationKey: 'pages.levels.levels.c1.duration',
      whoKey: 'pages.levels.levels.c1.who',
      outcomeKey: 'pages.levels.levels.c1.outcome',
      skills: [
        {
          titleKey: 'pages.levels.skills.speaking',
          itemsKeys: ['pages.levels.levels.c1.skills.speaking.0'],
        },
        {
          titleKey: 'pages.levels.skills.listening',
          itemsKeys: ['pages.levels.levels.c1.skills.listening.0'],
        },
        {
          titleKey: 'pages.levels.skills.reading',
          itemsKeys: ['pages.levels.levels.c1.skills.reading.0'],
        },
        {
          titleKey: 'pages.levels.skills.writing',
          itemsKeys: ['pages.levels.levels.c1.skills.writing.0'],
        },
      ],
      objectivesKeys: [
        'pages.levels.levels.c1.objectives.0',
        'pages.levels.levels.c1.objectives.1',
        'pages.levels.levels.c1.objectives.2',
        'pages.levels.levels.c1.objectives.3',
      ],
    },
  ];
}

