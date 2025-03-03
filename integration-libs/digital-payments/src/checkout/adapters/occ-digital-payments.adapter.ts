/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PaymentDetails } from '@spartacus/cart/base/root';
import {
  ConverterService,
  HttpParamsURIEncoder,
  Occ,
  OccEndpointsService,
} from '@spartacus/core';
import { Observable } from 'rxjs';
import { CURRENT_CART } from '../../utils/dp-constants';
import { DpPaymentRequest } from '../models/dp-checkout.model';
import { DP_DETAILS_NORMALIZER, DP_REQUEST_NORMALIZER } from './converters';
import { DigitalPaymentsAdapter } from './digital-payments.adapter';
import { OccDpPaymentRequest } from './occ.models';

@Injectable()
export class OccDigitalPaymentsAdapter implements DigitalPaymentsAdapter {
  private readonly paramEncoder = new HttpParamsURIEncoder();

  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService,
    protected converter: ConverterService
  ) {}

  createPaymentRequest(
    userId: string,
    cartId = CURRENT_CART
  ): Observable<DpPaymentRequest> {
    const url = this.occEndpoints.buildUrl('paymentRequest', {
      urlParams: { userId, cartId },
    });
    return this.http
      .post<OccDpPaymentRequest>(url, null)
      .pipe(this.converter.pipeable(DP_REQUEST_NORMALIZER));
  }

  createPaymentDetails(
    sessionId: string,
    signature: string,
    userId: string,
    cartId = CURRENT_CART
  ): Observable<PaymentDetails> {
    let params = new HttpParams({ encoder: this.paramEncoder });
    params = params.append('sid', sessionId);
    params = params.append('sign', signature);
    const url = this.occEndpoints.buildUrl('paymentDetails', {
      urlParams: { userId, cartId },
    });
    return this.http
      .post<Occ.PaymentDetails>(url, null, { params: params })
      .pipe(this.converter.pipeable(DP_DETAILS_NORMALIZER));
  }
}
