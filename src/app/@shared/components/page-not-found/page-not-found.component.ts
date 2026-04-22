import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { CoreModule } from '@core/core.module';

@Component({
  selector: 'app-page-not-found',
  imports: [CoreModule, MatButtonModule],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.scss',
})
export class PageNotFoundComponent {
  private _router = inject(Router);

  goHome() {
    this._router.navigateByUrl('/main/home');
  }
}
