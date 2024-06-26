import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { FilterType } from '../../shared/enums/filter-type.enum';
import { SortType } from '../../shared/enums/sort-type.enum';
import { MOCK_PRODUCTS } from '../../shared/mocks/mock-data';
import { Criteria } from '../../shared/models/criteria.model';
import { Product } from '../../shared/models/product.model';
import { error, log } from 'console';

@Injectable()
export class ProductService {
  httpClient = inject(HttpClient);

  sendRequestToProductAPI(url: string, products: Product[]) {
    firstValueFrom(this.httpClient.get(url)).then((response: any) => {
      if (response) {
        console.log("Content " + response.content);
        console.log("Links " + response.links);
        console.log("Page " + response.page);
      }
      if (products === undefined) {
        products = response.content;
      } else {
        products = products.concat(response.content);
      }
      let nextLink = '';
      response.links.forEach((link:any) => {
        if (link.rel === 'next') {
          nextLink = link.href;
          return;
        }
      })

      if (nextLink != '') {
        this.sendRequestToProductAPI(nextLink, products);
      } else {
        console.log('Finished');
      }
    }).catch(err => {
      console.log(err.error.errorCode + err.error.message, err.error.helpText);
    }).finally(() => console.log('Finish call'));
  }

  getAllProducts(criteria: Criteria) {
    let dummyProduct: Product[] = [];
    this.sendRequestToProductAPI("api/product/" + criteria.type, dummyProduct);
  }

  getProductById(productId: string): Observable<Product> {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    if (product) {
      return of(product);
    }
    return of({} as Product);
  }

  getProductsByCriteria(criteria: Criteria): Observable<Product[]> {
    // TODO
    this.getAllProducts(criteria);
    // END TODO

    let products = MOCK_PRODUCTS;
    products = this.getProductByNameOrDescription(products, criteria.search);

    if (criteria.type) {
      products = this.getProductByType(products, criteria.type);
    }

    if (criteria.sort) {
      products = this.getProductsWithSort(products, criteria.sort);
    }

    return of(products);
  }

  private getProductByNameOrDescription(
    products: Product[],
    searchText: string
  ): Product[] {
    if (searchText === '') {
      return products;
    }

    return products.filter(
      product =>
        product.name.toLowerCase().includes(searchText) ||
        product.description.toLocaleLowerCase().includes(searchText)
    );
  }

  private getProductByType(
    products: Product[],
    productType: string
  ): Product[] {
    if (productType === '' || productType === FilterType.All_TYPES) {
      return products;
    }
    return products.filter(product => product.type === productType);
  }

  private getProductsWithSort(products: Product[], sortType: SortType) {
    const collator = new Intl.Collator('en');
    switch (sortType) {
      case SortType.POPULARITY:
        return products.sort((a: Product, b: Product) =>
          collator.compare(a.platformReview, b.platformReview)
        );
      case SortType.ALPHABETICALLY:
        return products.sort((a: Product, b: Product) =>
          collator.compare(a.name, b.name)
        );
      case SortType.RECENT:
      default:
        return products;
    }
  }
}
