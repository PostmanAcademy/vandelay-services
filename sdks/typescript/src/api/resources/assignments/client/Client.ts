import * as core from '../../../../core';
import type * as PostmanCusteduApi from '../../..';
import { BaseService } from '../../../../services/base-service';
import {
  BaseClientOptions,
  BaseRequestOptions,
  ContentType,
  HttpResponse,
} from '../../../../http/types';
import { RequestBuilder } from '../../../../http/transport/request-builder';
import { SerializationStyle } from '../../../../http/serialization/base-serializer';
import { PostmanCusteduApiError } from '../../../../http/errors/throwable-error';
import { requireCredential, resolveAuthHeaders } from '../../../../http/auth';
import { HttpResponsePromise, WithRawResponse } from '../../../../http/response-promise';
import { Supplier, resolveHeaders } from '../../../../http/utils/supplier';
import { PostmanCusteduApiEnvironment } from '../../../../http/environment';
import {
  ListClaimAssignmentsResponse,
  listClaimAssignmentsResponseResponse,
} from '../types/ListClaimAssignmentsResponse';
import { Problem } from '../../../types/Problem';
import { AssignmentCreate, ListClaimAssignmentsRequest } from './requests';
import { assignmentCreateRequest } from '../types/AssignmentCreate';
import { Assignment, assignmentResponse } from '../../../types/Assignment';

export declare namespace AssignmentsClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Assignments operations.
 * Provides methods to interact with Assignments-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class AssignmentsClient extends BaseService {
  protected listClaimAssignmentsConfig?: Partial<BaseClientOptions>;

  protected assignVendorToClaimConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listClaimAssignments.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListClaimAssignmentsConfig(config: Partial<BaseClientOptions>): this {
    this.listClaimAssignmentsConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for assignVendorToClaim.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setAssignVendorToClaimConfig(config: Partial<BaseClientOptions>): this {
    this.assignVendorToClaimConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListClaimAssignmentsRequest} request
   * @param {AssignmentsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListClaimAssignmentsResponse>} - Vendor assignments for the claim.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.assignments.listClaimAssignments({
   *         claimId: "claimId"
   *     })
   */
  listClaimAssignments(
    request: PostmanCusteduApi.ListClaimAssignmentsRequest,
    requestOptions?: AssignmentsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListClaimAssignmentsResponse> {
    return HttpResponsePromise.fromPromise(this.__listClaimAssignments(request, requestOptions));
  }
  private async __listClaimAssignments(
    request: PostmanCusteduApi.ListClaimAssignmentsRequest,
    requestOptions?: AssignmentsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListClaimAssignmentsResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listClaimAssignmentsConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/claims/v1/claims/{claimId}/assignments')
      .setRequestSchema(core.cast.identity<unknown>())
      .addAuthHeaders(
        await resolveAuthHeaders(
          resolvedConfig,
          async () =>
            requireCredential(
              await Supplier.get(resolvedConfig?.token),
              "Please provide 'token' when initializing the client",
            ),
          'Bearer',
        ),
      )
      .setRequestContentType(ContentType.Json)
      .addResponse({
        schema: listClaimAssignmentsResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListClaimAssignmentsResponse>(
      _request,
    );
  }

  /**
   * Requests a vendor (from the Vendors API) to perform work on the claim.
   * @param {PostmanCusteduApi.AssignmentCreate} request
   * @param {AssignmentsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Assignment>} - Assignment created.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.UnprocessableEntityError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.assignments.assignVendorToClaim({
   *         claimId: "claimId",
   *         vendorId: "vendorId",
   *         role: "tow"
   *     })
   */
  assignVendorToClaim(
    request: PostmanCusteduApi.AssignmentCreate,
    requestOptions?: AssignmentsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Assignment> {
    return HttpResponsePromise.fromPromise(this.__assignVendorToClaim(request, requestOptions));
  }
  private async __assignVendorToClaim(
    request: PostmanCusteduApi.AssignmentCreate,
    requestOptions?: AssignmentsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Assignment>> {
    const resolvedConfig = this.getResolvedConfig(this.assignVendorToClaimConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/claims/v1/claims/{claimId}/assignments')
      .setRequestSchema(assignmentCreateRequest)
      .addAuthHeaders(
        await resolveAuthHeaders(
          resolvedConfig,
          async () =>
            requireCredential(
              await Supplier.get(resolvedConfig?.token),
              "Please provide 'token' when initializing the client",
            ),
          'Bearer',
        ),
      )
      .setRequestContentType(ContentType.Json)
      .addResponse({
        schema: assignmentResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        vendorId: request.vendorId,
        role: request.role,
        scheduledFor: request.scheduledFor,
        instructions: request.instructions,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Assignment>(_request);
  }
}
