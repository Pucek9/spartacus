/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CMS_COMPONENTS_SERVICE,
  GET_CHILD_ROUTES,
  GET_INJECTORS,
  TODO_SPARTACUS,
} from '../../../../shared/constants';
import { SPARTACUS_STOREFRONTLIB } from '../../../../shared/libs-constants';
import { MethodPropertyDeprecation } from '../../../../shared/utils/file-utils';

// projects\storefrontlib\src\cms-structure\services\cms-components.service.ts
export const CMS_COMPONENTS_SERVICE_MIGRATION: MethodPropertyDeprecation[] = [
  {
    class: CMS_COMPONENTS_SERVICE,
    importPath: SPARTACUS_STOREFRONTLIB,
    deprecatedNode: GET_CHILD_ROUTES,
    newNode: GET_CHILD_ROUTES,
    comment: `// ${TODO_SPARTACUS} Method '${GET_CHILD_ROUTES}' changed the return type from 'Route[]' to 'CmsComponentChildRoutesConfig'`,
  },
  {
    class: CMS_COMPONENTS_SERVICE,
    importPath: SPARTACUS_STOREFRONTLIB,
    deprecatedNode: GET_INJECTORS,
    comment: `// ${TODO_SPARTACUS} Method '${GET_INJECTORS}' has been removed'`,
  },
];
