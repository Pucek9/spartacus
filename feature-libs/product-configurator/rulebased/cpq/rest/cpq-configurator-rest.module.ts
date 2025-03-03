/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { provideDefaultConfig } from '@spartacus/core';
import { RulebasedConfiguratorConnector } from '@spartacus/product-configurator/rulebased';
import { CpqConfiguratorNormalizer } from '../common/converters/cpq-configurator-normalizer';
import { CpqConfiguratorOverviewNormalizer } from '../common/converters/cpq-configurator-overview-normalizer';
import { CpqConfiguratorSerializer } from '../common/converters/cpq-configurator-serializer';
import { CpqConfiguratorValueSerializer } from '../common/converters/cpq-configurator-value-serializer';
import {
  CPQ_CONFIGURATOR_NORMALIZER,
  CPQ_CONFIGURATOR_OVERVIEW_NORMALIZER,
  CPQ_CONFIGURATOR_QUANTITY_SERIALIZER,
  CPQ_CONFIGURATOR_SERIALIZER,
} from '../common/converters/cpq-configurator.converters';
import { CpqConfiguratorRestAdapter } from './cpq-configurator-rest.adapter';
import { defaultCpqConfiguratorEndpointConfig } from './default-cpq-configurator-endpoint.config';

@NgModule({
  imports: [CommonModule],

  providers: [
    {
      provide: RulebasedConfiguratorConnector.CONFIGURATOR_ADAPTER_LIST,
      useClass: CpqConfiguratorRestAdapter,
      multi: true,
    },
    //TODO: CXSPA-3392 move converters from here to cpq-configurator-common module
    {
      provide: CPQ_CONFIGURATOR_NORMALIZER,
      useClass: CpqConfiguratorNormalizer,
      multi: true,
    },
    {
      provide: CPQ_CONFIGURATOR_SERIALIZER,
      useClass: CpqConfiguratorSerializer,
      multi: true,
    },
    {
      provide: CPQ_CONFIGURATOR_QUANTITY_SERIALIZER,
      useClass: CpqConfiguratorValueSerializer,
      multi: true,
    },
    {
      provide: CPQ_CONFIGURATOR_OVERVIEW_NORMALIZER,
      useClass: CpqConfiguratorOverviewNormalizer,
      multi: true,
    },
    provideDefaultConfig(defaultCpqConfiguratorEndpointConfig),
  ],
})
export class CpqConfiguratorRestModule {}
