/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { InjectionToken } from '@angular/core';
import { Converter } from '@spartacus/core';
import { User } from '@spartacus/user/account/root';

export const USER_ACCOUNT_NORMALIZER = new InjectionToken<Converter<any, User>>(
  'UserAccountNormalizer'
);

export const USER_ACCOUNT_SERIALIZER = new InjectionToken<Converter<User, any>>(
  'UserAccountSerializer'
);
