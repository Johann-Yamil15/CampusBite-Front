import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ProductFacade } from '@application/facades/product.facade';

@Component({
  selector: 'app-products-page',
  imports: [CurrencyPipe],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  protected readonly vm = inject(ProductFacade);

  ngOnInit(): void {
    this.vm.load();
  }
}
