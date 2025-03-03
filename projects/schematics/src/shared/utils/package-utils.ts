/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import {
  addPackageJsonDependency,
  NodeDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import semver from 'semver';
import { version } from '../../../package.json';
import collectedDependencies from '../../dependencies.json';
import { UTF_8 } from '../constants';
import {
  CORE_SPARTACUS_SCOPES,
  FEATURES_LIBS_SKIP_SCOPES,
  SPARTACUS_ASSETS,
  SPARTACUS_CORE,
  SPARTACUS_STOREFRONTLIB,
  SPARTACUS_STYLES,
} from '../libs-constants';
import { getServerTsPath } from './file-utils';
import { addPackageJsonDependencies, dependencyExists } from './lib-utils';
import { getDefaultProjectNameFromWorkspace } from './workspace-utils';

export function createSpartacusDependencies(
  dependencyObject: Record<string, string>
): NodeDependency[] {
  const spartacusVersion = getPrefixedSpartacusSchematicsVersion();
  return createDependencies(dependencyObject, {
    skipScopes: CORE_SPARTACUS_SCOPES,
    onlyIncludeScopes: FEATURES_LIBS_SKIP_SCOPES,
    version: spartacusVersion,
  });
}

export function createDependencies(
  dependencyObject: Record<string, string>,
  options: {
    /**
     * skip the scopes that start with any of the given scopes
     */
    skipScopes: string[];
    /**
     * create and return dependencies only listed in the given array
     */
    onlyIncludeScopes?: string[];
    /** dependency version which to set. If not provided, the one from the given `dependencyObject` will be used. */
    version?: string;
    /** Overwrite the dependencies */
    overwrite?: boolean;
  } = {
    skipScopes: FEATURES_LIBS_SKIP_SCOPES,
  }
): NodeDependency[] {
  const dependencies: NodeDependency[] = [];
  for (const dependencyName in dependencyObject) {
    if (!dependencyObject.hasOwnProperty(dependencyName)) {
      continue;
    }

    if (options.skipScopes.some((scope) => dependencyName.startsWith(scope))) {
      continue;
    }

    if (
      // if `onlyIncludeScopes` is not defined, always include the dependency
      !options.onlyIncludeScopes ||
      // if defined, check if the current dependency is in the given array
      options.onlyIncludeScopes.some((scope) =>
        dependencyName.startsWith(scope)
      )
    ) {
      dependencies.push(
        mapPackageToNodeDependencies(
          dependencyName,
          options.version ?? dependencyObject[dependencyName],
          options.overwrite
        )
      );
    }
  }

  return dependencies;
}

export function mapPackageToNodeDependencies(
  packageName: string,
  pkgVersion: string,
  overwrite = false
): NodeDependency {
  return {
    type: packageName.includes('schematics')
      ? NodeDependencyType.Dev
      : NodeDependencyType.Default,
    name: packageName,
    version: pkgVersion,
    overwrite,
  };
}

export function readPackageJson(tree: Tree): any {
  const pkgPath = '/package.json';
  const buffer = tree.read(pkgPath);
  if (!buffer) {
    throw new SchematicsException('Could not find package.json');
  }

  return JSON.parse(buffer.toString(UTF_8));
}

export function cleanSemverVersion(versionString: string): string {
  if (isNaN(Number(versionString.charAt(0)))) {
    return versionString.substring(1, versionString.length);
  }
  return versionString;
}

export function getMajorVersionNumber(versionString: string): number {
  const cleanVersion = cleanSemverVersion(versionString);
  return Number(cleanVersion.charAt(0));
}

export function getSpartacusSchematicsVersion(): string {
  return version;
}

export function getPrefixedSpartacusSchematicsVersion(): string {
  return `~${getSpartacusSchematicsVersion()}`;
}

export function getSpartacusCurrentFeatureLevel(): string {
  return version.split('.').slice(0, 2).join('.');
}

export function checkIfSSRIsUsed(tree: Tree): boolean {
  const projectName = getDefaultProjectNameFromWorkspace(tree);
  const buffer = tree.read('angular.json');
  if (!buffer) {
    throw new SchematicsException('Could not find angular.json');
  }
  const angularFileBuffer = buffer.toString(UTF_8);
  const angularJson = JSON.parse(angularFileBuffer);
  const isServerConfiguration =
    !!angularJson.projects[projectName].architect['server'];

  const serverFileLocation = getServerTsPath(tree);
  if (!serverFileLocation) {
    return false;
  }

  const serverBuffer = tree.read(serverFileLocation);
  const serverFileBuffer = serverBuffer?.toString(UTF_8);
  const isServerSideAvailable = serverFileBuffer && !!serverFileBuffer.length;

  return !!(isServerConfiguration && isServerSideAvailable);
}

export function prepareSpartacusDependencies(): NodeDependency[] {
  const spartacusVersion = getPrefixedSpartacusSchematicsVersion();

  const spartacusDependencies: NodeDependency[] = [
    {
      type: NodeDependencyType.Default,
      version: spartacusVersion,
      name: SPARTACUS_CORE,
    },
    {
      type: NodeDependencyType.Default,
      version: spartacusVersion,
      name: SPARTACUS_STOREFRONTLIB,
    },
    {
      type: NodeDependencyType.Default,
      version: spartacusVersion,
      name: SPARTACUS_ASSETS,
    },
    {
      type: NodeDependencyType.Default,
      version: spartacusVersion,
      name: SPARTACUS_STYLES,
    },
  ];

  return spartacusDependencies;
}

export function prepare3rdPartyDependencies(): NodeDependency[] {
  const thirdPartyDependencies = createDependencies({
    ...collectedDependencies[SPARTACUS_CORE],
    ...collectedDependencies[SPARTACUS_STOREFRONTLIB],
    ...collectedDependencies[SPARTACUS_STYLES],
    ...collectedDependencies[SPARTACUS_ASSETS],
  });
  return thirdPartyDependencies;
}

export function updatePackageJsonDependencies(
  dependencies: NodeDependency[],
  packageJson: any
): Rule {
  return (tree: Tree, context: SchematicContext): Rule => {
    const dependenciesToAdd: NodeDependency[] = [];

    for (const dependency of dependencies) {
      const currentVersion = getCurrentDependencyVersion(
        dependency,
        packageJson
      );
      if (!currentVersion) {
        dependenciesToAdd.push(dependency);
        continue;
      }

      if (semver.satisfies(currentVersion, dependency.version)) {
        continue;
      }

      const versionToUpdate = semver.parse(
        cleanSemverVersion(dependency.version)
      );
      if (!versionToUpdate || semver.eq(versionToUpdate, currentVersion)) {
        continue;
      }

      addPackageJsonDependency(tree, { ...dependency, overwrite: true });
      const change = semver.gt(versionToUpdate, currentVersion)
        ? 'Upgrading'
        : 'Downgrading';
      context.logger.info(
        `🩹 ${change} '${dependency.name}' to ${dependency.version} (was ${currentVersion.raw})`
      );
    }

    return addPackageJsonDependencies(dependenciesToAdd, packageJson);
  };
}

function getCurrentDependencyVersion(
  dependency: NodeDependency,
  packageJson: any
): semver.SemVer | null {
  if (!dependencyExists(dependency, packageJson)) {
    return null;
  }
  const dependencies = packageJson[dependency.type];
  const currentVersion = dependencies[dependency.name];
  return semver.parse(cleanSemverVersion(currentVersion));
}
