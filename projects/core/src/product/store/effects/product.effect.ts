/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { merge, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { AuthActions } from '../../../auth/user-auth/store/actions';
import { LoggerService } from '../../../logger';
import { SiteContextActions } from '../../../site-context/store/actions/index';
import { normalizeHttpError } from '../../../util/normalize-http-error';
import { bufferDebounceTime } from '../../../util/rxjs/buffer-debounce-time';
import { withdrawOn } from '../../../util/rxjs/withdraw-on';
import { ProductConnector } from '../../connectors/product/product.connector';
import { ScopedProductData } from '../../connectors/product/scoped-product-data';
import { ProductActions } from '../actions/index';

@Injectable()
export class ProductEffects {
  protected logger = inject(LoggerService);

  // we want to cancel all ongoing requests when currency or language changes,
  private contextChange$: Observable<Action> = this.actions$.pipe(
    ofType(
      SiteContextActions.CURRENCY_CHANGE,
      SiteContextActions.LANGUAGE_CHANGE
    )
  );

  loadProduct$ = createEffect(
    () =>
      ({ scheduler, debounce = 0 } = {}): Observable<
        ProductActions.LoadProductSuccess | ProductActions.LoadProductFail
      > =>
        this.actions$.pipe(
          ofType(ProductActions.LOAD_PRODUCT),
          map((action: ProductActions.LoadProduct) => ({
            code: action.payload,
            scope: action.meta.scope,
          })),
          // we are grouping all load actions that happens at the same time
          // to optimize loading and pass them all to productConnector.getMany
          bufferDebounceTime(debounce, scheduler),
          mergeMap((products) =>
            merge(
              ...this.productConnector
                .getMany(products)
                .map((productLoad) => this.productLoadEffect(productLoad))
            )
          ),
          withdrawOn(this.contextChange$)
        )
  );

  private productLoadEffect(
    productLoad: ScopedProductData
  ): Observable<
    ProductActions.LoadProductSuccess | ProductActions.LoadProductFail
  > {
    return (
      productLoad.data$?.pipe(
        map(
          (data) =>
            new ProductActions.LoadProductSuccess(
              { code: productLoad.code, ...data },
              productLoad.scope
            )
        ),
        catchError((error) => {
          return of(
            new ProductActions.LoadProductFail(
              productLoad.code,
              normalizeHttpError(error, this.logger),
              productLoad.scope
            )
          );
        })
      ) ??
      of(
        new ProductActions.LoadProductFail(
          productLoad.code,
          'Scoped product data does not exist',
          productLoad.scope
        )
      )
    );
  }

  clearProductPrice$: Observable<ProductActions.ClearProductPrice> =
    createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.LOGOUT, AuthActions.LOGIN),
        map(() => new ProductActions.ClearProductPrice())
      )
    );

  constructor(
    private actions$: Actions,
    private productConnector: ProductConnector
  ) {}
}
