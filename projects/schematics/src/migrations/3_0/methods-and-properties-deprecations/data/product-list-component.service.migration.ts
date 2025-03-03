/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PRODUCT_LIST_COMPONENT_SERVICE,
  SET_QUERY,
  SUB,
  TODO_SPARTACUS,
  VIEW_PAGE,
} from '../../../../shared/constants';
import { SPARTACUS_STOREFRONTLIB } from '../../../../shared/libs-constants';
import { MethodPropertyDeprecation } from '../../../../shared/utils/file-utils';

// projects/storefrontlib/cms-components/product/product-list/container/product-list-component.service.ts
export const PRODUCT_LIST_COMPONENT_SERVICE_MIGRATION: MethodPropertyDeprecation[] =
  [
    {
      class: PRODUCT_LIST_COMPONENT_SERVICE,
      importPath: SPARTACUS_STOREFRONTLIB,
      deprecatedNode: SUB,
      comment: `// ${TODO_SPARTACUS} Property '${SUB}' was removed from '${PRODUCT_LIST_COMPONENT_SERVICE}'. It is no longer used.`,
    },
    {
      class: PRODUCT_LIST_COMPONENT_SERVICE,
      importPath: SPARTACUS_STOREFRONTLIB,
      deprecatedNode: SET_QUERY,
      comment: `// ${TODO_SPARTACUS} Method '${SET_QUERY}' was removed from '${PRODUCT_LIST_COMPONENT_SERVICE}'. It is no longer used.`,
    },
    {
      class: PRODUCT_LIST_COMPONENT_SERVICE,
      importPath: SPARTACUS_STOREFRONTLIB,
      deprecatedNode: VIEW_PAGE,
      comment: `// ${TODO_SPARTACUS} Method '${VIEW_PAGE}' was removed from '${PRODUCT_LIST_COMPONENT_SERVICE}'. It is no longer used.`,
    },
  ];
