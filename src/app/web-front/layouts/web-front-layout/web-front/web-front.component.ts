import { ChangeDetectorRef, Component } from '@angular/core';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-web-front',
  imports: [ CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './web-front.component.html',
  styles: `
    #controls {
      position: fixed;
      bottom: 0px;
      width: 100%;
      height: 70px;
      z-index: 10;
    }

    .main-content {
      margin-bottom: 100px;
      min-height: calc(100vh - 100px);
    }

    .map-content {
      margin: 0;
      padding: 0;
      height: calc(100vh - 64px - 90px); /* viewport - navbar - (footer + gap) */
      width: 100%;
      position: relative;
    }
  `
})
export class WebFrontComponent {
  isMapRoute = false;
  private routeSubscription?: Subscription;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkRoute(this.router.url);

    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkRoute(event.url);
    });
  }

  private checkRoute(url: string) {
    const wasMapRoute = this.isMapRoute;
    this.isMapRoute = url.includes('fullscreen_map');

    if (wasMapRoute !== this.isMapRoute) {
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
