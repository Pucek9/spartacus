/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  AuthActions,
  B2BUser,
  B2BUserRole,
  EntitiesModel,
  LoggerService,
  RouterState,
  RoutingService,
  StateUtils,
  User,
  UserIdService,
  normalizeHttpError,
} from '@spartacus/core';
import { UserAccountFacade } from '@spartacus/user/account/root';
import { Observable, from, of } from 'rxjs';
import {
  catchError,
  groupBy,
  map,
  mergeMap,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { B2BUserConnector } from '../../connectors/b2b-user/b2b-user.connector';
import { Permission } from '../../model/permission.model';
import { UserGroup } from '../../model/user-group.model';
import {
  B2BUserActions,
  OrgUnitActions,
  OrganizationActions,
  PermissionActions,
  UserGroupActions,
} from '../actions/index';

@Injectable()
export class B2BUserEffects {
  protected logger = inject(LoggerService);

  loadB2BUser$: Observable<
    B2BUserActions.LoadB2BUserSuccess | B2BUserActions.LoadB2BUserFail
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.LOAD_B2B_USER),
      map((action: B2BUserActions.LoadB2BUser) => action.payload),
      switchMap(({ userId, orgCustomerId }) => {
        return this.b2bUserConnector.get(userId, orgCustomerId).pipe(
          map((b2bUser: B2BUser) => {
            return new B2BUserActions.LoadB2BUserSuccess([b2bUser]);
          }),
          catchError((error: HttpErrorResponse) =>
            of(
              new B2BUserActions.LoadB2BUserFail({
                orgCustomerId,
                error: normalizeHttpError(error, this.logger),
              })
            )
          )
        );
      })
    )
  );

  createB2BUser$: Observable<
    | B2BUserActions.CreateB2BUserSuccess
    | B2BUserActions.CreateB2BUserFail
    | OrgUnitActions.AssignApprover
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.CREATE_B2B_USER),
      map((action: B2BUserActions.CreateB2BUser) => action.payload),
      switchMap(({ userId, orgCustomer }) =>
        this.b2bUserConnector.create(userId, orgCustomer).pipe(
          switchMap((data) => {
            const isAssignedToApprovers = orgCustomer.isAssignedToApprovers;
            // TODO Workaround for not known customerId while user creation (redireciton)
            return this.routingService.getRouterState().pipe(
              take(1),
              tap((route) => this.redirectToDetails(route, data)),
              switchMap(() => {
                const successActions = [
                  new B2BUserActions.CreateB2BUserSuccess(data),
                  new B2BUserActions.CreateB2BUserSuccess({
                    customerId: undefined,
                  }),
                  new OrganizationActions.OrganizationClearData(),
                ] as any[];
                if (isAssignedToApprovers) {
                  successActions.splice(
                    1,
                    0,
                    new OrgUnitActions.AssignApprover({
                      userId,
                      orgUnitId: orgCustomer.orgUnit?.uid ?? '',
                      orgCustomerId: data.customerId ?? '',
                      roleId: B2BUserRole.APPROVER,
                    })
                  );
                }
                return successActions;
              })
            );
          }),
          catchError((error: HttpErrorResponse) =>
            from([
              new B2BUserActions.CreateB2BUserFail({
                orgCustomerId: orgCustomer.customerId ?? '',
                error: normalizeHttpError(error, this.logger),
              }),
              new OrganizationActions.OrganizationClearData(),
            ])
          )
        )
      )
    )
  );

  updateB2BUser$: Observable<
    | B2BUserActions.UpdateB2BUserSuccess
    | B2BUserActions.UpdateB2BUserFail
    | OrgUnitActions.AssignApprover
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.UPDATE_B2B_USER),
      map((action: B2BUserActions.UpdateB2BUser) => action.payload),
      switchMap(({ userId, orgCustomerId, orgCustomer }) => {
        const isAssignedToApprovers = orgCustomer.isAssignedToApprovers;
        return this.b2bUserConnector
          .update(userId, orgCustomerId, orgCustomer)
          .pipe(
            switchMap((_data) => {
              const successActions = [
                // TODO: change for 'payload: data' when backend API start to return user data on PATCH
                new B2BUserActions.UpdateB2BUserSuccess(orgCustomer),
              ] as any[];
              if (isAssignedToApprovers) {
                successActions.push(
                  new OrgUnitActions.AssignApprover({
                    userId,
                    orgUnitId: orgCustomer.orgUnit?.uid ?? '',
                    orgCustomerId,
                    roleId: B2BUserRole.APPROVER,
                  })
                );
              }
              return successActions;
            }),
            catchError((error: HttpErrorResponse) =>
              from([
                new B2BUserActions.UpdateB2BUserFail({
                  orgCustomerId: orgCustomer.customerId ?? '',
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          );
      })
    )
  );

  checkSelfEmailUpdate$: Observable<
    | AuthActions.Logout
    | B2BUserActions.LoadB2BUser
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.UPDATE_B2B_USER_SUCCESS),
      map((action: B2BUserActions.UpdateB2BUserSuccess) => action.payload),
      withLatestFrom(
        this.userAccountFacade.get(),
        this.userIdService.getUserId()
      ),
      switchMap(
        ([payload, currentUser]: [B2BUser, User | undefined, string]) => {
          const currentUserEmailMatch =
            payload.customerId === currentUser?.customerId &&
            payload.email !== currentUser?.displayUid;

          if (currentUserEmailMatch) {
            this.routingService.go({ cxRoute: 'login' });
          }
          return currentUserEmailMatch
            ? [new AuthActions.Logout()]
            : [new OrganizationActions.OrganizationClearData()];
        }
      )
    )
  );

  loadB2BUsers$: Observable<
    | B2BUserActions.LoadB2BUsersSuccess
    | B2BUserActions.LoadB2BUserSuccess
    | B2BUserActions.LoadB2BUsersFail
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.LOAD_B2B_USERS),
      map((action: B2BUserActions.LoadB2BUsers) => action.payload),
      switchMap((payload) =>
        this.b2bUserConnector.getList(payload.userId, payload.params).pipe(
          switchMap((b2bUsers: EntitiesModel<B2BUser>) => {
            const { values, page } = StateUtils.normalizeListPage(
              b2bUsers,
              'customerId'
            );
            return [
              new B2BUserActions.LoadB2BUserSuccess(values),
              new B2BUserActions.LoadB2BUsersSuccess({
                page,
                params: payload.params,
              }),
            ];
          }),
          catchError((error: HttpErrorResponse) =>
            of(
              new B2BUserActions.LoadB2BUsersFail({
                params: payload.params,
                error: normalizeHttpError(error, this.logger),
              })
            )
          )
        )
      )
    )
  );

  loadB2BUserApprovers$: Observable<
    | B2BUserActions.LoadB2BUserApproversSuccess
    | B2BUserActions.LoadB2BUserApproversFail
    | B2BUserActions.LoadB2BUserSuccess
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.LOAD_B2B_USER_APPROVERS),
      map((action: B2BUserActions.LoadB2BUserApprovers) => action.payload),
      groupBy(({ orgCustomerId, params }) =>
        StateUtils.serializeParams(orgCustomerId, params)
      ),
      mergeMap((group) =>
        group.pipe(
          switchMap((payload) =>
            this.b2bUserConnector
              .getApprovers(
                payload.userId,
                payload.orgCustomerId,
                payload.params
              )
              .pipe(
                switchMap((approvers: EntitiesModel<B2BUser>) => {
                  const { values, page } = StateUtils.normalizeListPage(
                    approvers,
                    'customerId'
                  );
                  return [
                    new B2BUserActions.LoadB2BUserSuccess(values),
                    new B2BUserActions.LoadB2BUserApproversSuccess({
                      orgCustomerId: payload.orgCustomerId,
                      page,
                      params: payload.params,
                    }),
                  ];
                }),
                catchError((error: HttpErrorResponse) =>
                  of(
                    new B2BUserActions.LoadB2BUserApproversFail({
                      orgCustomerId: payload.orgCustomerId,
                      params: payload.params,
                      error: normalizeHttpError(error, this.logger),
                    })
                  )
                )
              )
          )
        )
      )
    )
  );

  loadB2BUserPermissions$: Observable<
    | B2BUserActions.LoadB2BUserPermissionsSuccess
    | B2BUserActions.LoadB2BUserPermissionsFail
    | PermissionActions.LoadPermissionSuccess
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.LOAD_B2B_USER_PERMISSIONS),
      map((action: B2BUserActions.LoadB2BUserPermissions) => action.payload),
      groupBy(({ orgCustomerId, params }) =>
        StateUtils.serializeParams(orgCustomerId, params)
      ),
      mergeMap((group) =>
        group.pipe(
          switchMap((payload) =>
            this.b2bUserConnector
              .getPermissions(
                payload.userId,
                payload.orgCustomerId,
                payload.params
              )
              .pipe(
                switchMap((permissions: EntitiesModel<Permission>) => {
                  const { values, page } = StateUtils.normalizeListPage(
                    permissions,
                    'code'
                  );
                  return [
                    new PermissionActions.LoadPermissionSuccess(values),
                    new B2BUserActions.LoadB2BUserPermissionsSuccess({
                      orgCustomerId: payload.orgCustomerId,
                      page,
                      params: payload.params,
                    }),
                  ];
                }),
                catchError((error: HttpErrorResponse) =>
                  of(
                    new B2BUserActions.LoadB2BUserPermissionsFail({
                      orgCustomerId: payload.orgCustomerId,
                      params: payload.params,
                      error: normalizeHttpError(error, this.logger),
                    })
                  )
                )
              )
          )
        )
      )
    )
  );

  loadB2BUserUserGroups$: Observable<
    | B2BUserActions.LoadB2BUserUserGroupsSuccess
    | B2BUserActions.LoadB2BUserUserGroupsFail
    | UserGroupActions.LoadUserGroupSuccess
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.LOAD_B2B_USER_USER_GROUPS),
      map((action: B2BUserActions.LoadB2BUserUserGroups) => action.payload),
      groupBy(({ orgCustomerId, params }) =>
        StateUtils.serializeParams(orgCustomerId, params)
      ),
      mergeMap((group) =>
        group.pipe(
          switchMap((payload) =>
            this.b2bUserConnector
              .getUserGroups(
                payload.userId,
                payload.orgCustomerId,
                payload.params
              )
              .pipe(
                switchMap((userGroups: EntitiesModel<UserGroup>) => {
                  const { values, page } = StateUtils.normalizeListPage(
                    userGroups,
                    'uid'
                  );
                  return [
                    new UserGroupActions.LoadUserGroupSuccess(values),
                    new B2BUserActions.LoadB2BUserUserGroupsSuccess({
                      orgCustomerId: payload.orgCustomerId,
                      page,
                      params: payload.params,
                    }),
                  ];
                }),
                catchError((error: HttpErrorResponse) =>
                  of(
                    new B2BUserActions.LoadB2BUserUserGroupsFail({
                      orgCustomerId: payload.orgCustomerId,
                      params: payload.params,
                      error: normalizeHttpError(error, this.logger),
                    })
                  )
                )
              )
          )
        )
      )
    )
  );

  assignApproverToB2BUser$: Observable<
    | B2BUserActions.AssignB2BUserApproverSuccess
    | B2BUserActions.AssignB2BUserApproverFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.ASSIGN_B2B_USER_APPROVER),
      map((action: B2BUserActions.AssignB2BUserApprover) => action.payload),
      mergeMap((payload) =>
        this.b2bUserConnector
          .assignApprover(
            payload.userId,
            payload.orgCustomerId,
            payload.approverId
          )
          .pipe(
            switchMap((data) => [
              new B2BUserActions.AssignB2BUserApproverSuccess({
                // Occ returned email, but we use customerId in store
                approverId: payload.approverId,
                selected: data.selected,
              }),
              // Clearing data in this case causes unexpected behavior (#10468)
              // new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new B2BUserActions.AssignB2BUserApproverFail({
                  orgCustomerId: payload.orgCustomerId,
                  approverId: payload.approverId,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  unassignApproverFromB2BUser$: Observable<
    | B2BUserActions.UnassignB2BUserApproverSuccess
    | B2BUserActions.UnassignB2BUserApproverFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.UNASSIGN_B2B_USER_APPROVER),
      map((action: B2BUserActions.UnassignB2BUserApprover) => action.payload),
      mergeMap((payload) =>
        this.b2bUserConnector
          .unassignApprover(
            payload.userId,
            payload.orgCustomerId,
            payload.approverId
          )
          .pipe(
            switchMap((data) => [
              new B2BUserActions.UnassignB2BUserApproverSuccess({
                // Occ returned email, but we use customerId in store
                approverId: payload.approverId,
                selected: data.selected,
              }),
              // Clearing data in this case causes unexpected behavior (#10468)
              // new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new B2BUserActions.UnassignB2BUserApproverFail({
                  orgCustomerId: payload.orgCustomerId,
                  approverId: payload.approverId,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  assignPermissionToB2BUser$: Observable<
    | B2BUserActions.AssignB2BUserPermissionSuccess
    | B2BUserActions.AssignB2BUserPermissionFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.ASSIGN_B2B_USER_PERMISSION),
      map((action: B2BUserActions.AssignB2BUserPermission) => action.payload),
      mergeMap((payload) =>
        this.b2bUserConnector
          .assignPermission(
            payload.userId,
            payload.orgCustomerId,
            payload.permissionId
          )
          .pipe(
            switchMap((data) => [
              new B2BUserActions.AssignB2BUserPermissionSuccess({
                permissionId: data.id,
                selected: data.selected,
              }),
              new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new B2BUserActions.AssignB2BUserPermissionFail({
                  orgCustomerId: payload.orgCustomerId,
                  permissionId: payload.permissionId,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  unassignPermissionFromB2BUser$: Observable<
    | B2BUserActions.UnassignB2BUserPermissionSuccess
    | B2BUserActions.UnassignB2BUserPermissionFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.UNASSIGN_B2B_USER_PERMISSION),
      map((action: B2BUserActions.UnassignB2BUserPermission) => action.payload),
      mergeMap((payload) =>
        this.b2bUserConnector
          .unassignPermission(
            payload.userId,
            payload.orgCustomerId,
            payload.permissionId
          )
          .pipe(
            switchMap((data) => [
              new B2BUserActions.UnassignB2BUserPermissionSuccess({
                permissionId: data.id,
                selected: data.selected,
              }),
              new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new B2BUserActions.UnassignB2BUserPermissionFail({
                  orgCustomerId: payload.orgCustomerId,
                  permissionId: payload.permissionId,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  assignUserGroupToB2BUser$: Observable<
    | B2BUserActions.AssignB2BUserUserGroupSuccess
    | B2BUserActions.AssignB2BUserUserGroupFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.ASSIGN_B2B_USER_USER_GROUP),
      map((action: B2BUserActions.AssignB2BUserUserGroup) => action.payload),
      mergeMap((payload) =>
        this.b2bUserConnector
          .assignUserGroup(
            payload.userId,
            payload.orgCustomerId,
            payload.userGroupId
          )
          .pipe(
            switchMap((data) => [
              new B2BUserActions.AssignB2BUserUserGroupSuccess({
                uid: data.id,
                selected: data.selected,
              }),
              new OrganizationActions.OrganizationClearData(),
            ]),
            catchError((error: HttpErrorResponse) =>
              from([
                new B2BUserActions.AssignB2BUserUserGroupFail({
                  orgCustomerId: payload.orgCustomerId,
                  userGroupId: payload.userGroupId,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  unassignUserGroupFromB2BUser$: Observable<
    | B2BUserActions.UnassignB2BUserUserGroupSuccess
    | B2BUserActions.UnassignB2BUserUserGroupFail
    | OrganizationActions.OrganizationClearData
  > = createEffect(() =>
    this.actions$.pipe(
      ofType(B2BUserActions.UNASSIGN_B2B_USER_USER_GROUP),
      map((action: B2BUserActions.UnassignB2BUserUserGroup) => action.payload),
      mergeMap((payload) =>
        this.b2bUserConnector
          .unassignUserGroup(
            payload.userId,
            payload.orgCustomerId,
            payload.userGroupId
          )
          .pipe(
            switchMap(
              // TODO: Workaround because occ doesn't respond here
              // (data) =>
              //   new B2BUserActions.DeleteB2BUserUserGroupSuccess({
              //     uid: data.id,
              //     selected: data.selected,
              //   })
              () => [
                new B2BUserActions.UnassignB2BUserUserGroupSuccess({
                  uid: payload.userGroupId,
                  selected: false,
                }),
                new OrganizationActions.OrganizationClearData(),
              ]
            ),
            catchError((error: HttpErrorResponse) =>
              from([
                new B2BUserActions.UnassignB2BUserUserGroupFail({
                  orgCustomerId: payload.orgCustomerId,
                  userGroupId: payload.userGroupId,
                  error: normalizeHttpError(error, this.logger),
                }),
                new OrganizationActions.OrganizationClearData(),
              ])
            )
          )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private b2bUserConnector: B2BUserConnector,
    private routingService: RoutingService,
    private userAccountFacade: UserAccountFacade,
    private userIdService: UserIdService
  ) {}

  protected redirectToDetails(route: RouterState, data: B2BUser) {
    if ((route as any)?.state?.context?.id !== '/organization/units') {
      this.routingService.go({
        cxRoute: 'orgUserDetails',
        params: data,
      });
    }
  }
}
