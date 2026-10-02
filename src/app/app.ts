import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@presentation/components/loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  template: `<app-loader /><router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
