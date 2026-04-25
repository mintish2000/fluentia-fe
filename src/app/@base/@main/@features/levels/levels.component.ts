import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';

type Level = {
  code: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  label: string;
  duration: string;
  who: string;
  outcome: string;
  skills: { title: string; items: string[] }[];
  objectives: string[];
};

@Component({
  selector: 'app-levels',
  standalone: true,
  templateUrl: './levels.component.html',
  styleUrl: './levels.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollRevealContainerDirective],
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
      label: 'Beginner',
      duration: '3–4 Months (Intensive) or 6–8 Months (Regular)',
      who: 'Complete beginners with little or no English knowledge',
      outcome: 'Can communicate in simple situations and understand basic everyday English',
      skills: [
        {
          title: 'Speaking',
          items: ['Greet and introduce yourself in simple conversations'],
        },
        {
          title: 'Listening',
          items: ['Recognize and understand simple phrases and questions'],
        },
        {
          title: 'Reading',
          items: ['Read short, simple texts and everyday signs'],
        },
        {
          title: 'Writing',
          items: ['Write basic personal information and short sentences'],
        },
      ],
      objectives: [
        'Introduce yourself and others confidently',
        'Use essential vocabulary about family, shopping, and work',
        'Describe your home, surroundings, and people you know',
        'Ask and answer simple personal questions',
      ],
    },
    {
      code: 'A2',
      label: 'Elementary',
      duration: '3–4 months (intensive) or 6–8 months (regular)',
      who: 'Students who can handle basic communication',
      outcome: 'Can communicate in routine tasks requiring simple information exchange',
      skills: [
        {
          title: 'Speaking',
          items: ['Discuss familiar topics and daily routines'],
        },
        {
          title: 'Listening',
          items: ['Understand conversations on common everyday topics'],
        },
        {
          title: 'Reading',
          items: ['Read short, simple texts with familiar vocabulary'],
        },
        {
          title: 'Writing',
          items: ['Write simple notes, messages, and short descriptions'],
        },
      ],
      objectives: [
        'Describe your background, environment, and daily life',
        'Make simple purchases, requests, and orders',
        'Understand basic TV programs or multimedia with visual support',
        'Express opinions on familiar topics',
      ],
    },
    {
      code: 'B1',
      label: 'Intermediate',
      duration: '4–5 Months (Intensive) Or 8–10 Months (Regular)',
      who: 'Students who can communicate in most everyday situations',
      outcome: 'Can deal confidently with most situations likely to arise while traveling',
      skills: [
        {
          title: 'Speaking',
          items: ['Participate in conversations on familiar topics with confidence'],
        },
        {
          title: 'Listening',
          items: ['Identify main points in clear, standard speech'],
        },
        {
          title: 'Reading',
          items: ['Understand texts on everyday or familiar subjects'],
        },
        {
          title: 'Writing',
          items: ['Write connected text on personal experiences and familiar topics'],
        },
      ],
      objectives: [
        'Handle most travel and everyday situations effectively',
        'Give reasons and explanations for opinions',
        'Understand TV shows, movies, and basic media with subtitles',
        'Describe experiences, events, dreams, and ambitions',
      ],
    },
    {
      code: 'B2',
      label: 'Upper-Intermediate',
      duration: '4–6 months (Intensive) or 10–12 months (Regular)',
      who: 'Students who can interact with native speakers fluently',
      outcome: 'Can communicate effectively in professional and academic contexts',
      skills: [
        {
          title: 'Speaking',
          items: ['Speak fluently and spontaneously in various contexts'],
        },
        {
          title: 'Listening',
          items: ['Understand extended speech, lectures, and media content'],
        },
        {
          title: 'Reading',
          items: ['Read articles, contemporary prose, and professional texts'],
        },
        {
          title: 'Writing',
          items: ['Write detailed texts on a wide range of subjects'],
        },
      ],
      objectives: [
        'Interact naturally with native speakers',
        'Explain viewpoints and argue ideas on topical issues',
        'Understand most TV news, documentaries, and current affairs',
        'Present clear, detailed descriptions on topics of interest',
      ],
    },
    {
      code: 'C1',
      label: 'Advanced',
      duration: '5–7 months (Intensive) or 12–14 months (Regular)',
      who: 'Students aiming for near-native proficiency',
      outcome:
        'Can use English for all professional, academic, and social purposes with precision',
      skills: [
        {
          title: 'Speaking',
          items: ['Express ideas fluently, accurately, and persuasively'],
        },
        {
          title: 'Listening',
          items: ['Understand virtually all spoken English, including complex discussions'],
        },
        {
          title: 'Reading',
          items: ['Interpret complex texts, literature, and specialized materials'],
        },
        {
          title: 'Writing',
          items: ['Write well-structured, coherent, and detailed texts'],
        },
      ],
      objectives: [
        'Use English flexibly for social, academic, and professional purposes',
        'Understand virtually everything read or heard',
        'Summarize and reconstruct arguments from multiple sources',
        'Produce clear, well-structured texts on complex subjects',
      ],
    },
  ];
}

