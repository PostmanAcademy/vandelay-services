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
import { ClaimList, claimListResponse } from '../../../types/ClaimList';
import { Problem } from '../../../types/Problem';
import {
  CancelRequest,
  ClaimCreate,
  ClaimUpdate,
  GetClaimRequest,
  ListClaimsRequest,
} from './requests';
import { claimCreateRequest } from '../types/ClaimCreate';
import { Claim, claimResponse } from '../../../types/Claim';
import { claimUpdateRequest } from '../types/ClaimUpdate';
import { cancelRequestRequest } from '../types/CancelRequest';

export declare namespace ClaimsClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Claims operations.
 * Provides methods to interact with Claims-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class ClaimsClient extends BaseService {
  protected listClaimsConfig?: Partial<BaseClientOptions>;

  protected createClaimConfig?: Partial<BaseClientOptions>;

  protected getClaimConfig?: Partial<BaseClientOptions>;

  protected updateClaimConfig?: Partial<BaseClientOptions>;

  protected cancelClaimConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listClaims.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListClaimsConfig(config: Partial<BaseClientOptions>): this {
    this.listClaimsConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for createClaim.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCreateClaimConfig(config: Partial<BaseClientOptions>): this {
    this.createClaimConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for getClaim.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetClaimConfig(config: Partial<BaseClientOptions>): this {
    this.getClaimConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for updateClaim.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setUpdateClaimConfig(config: Partial<BaseClientOptions>): this {
    this.updateClaimConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for cancelClaim.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCancelClaimConfig(config: Partial<BaseClientOptions>): this {
    this.cancelClaimConfig = config;
    return this;
  }

  /**
   * Returns a paginated list of claims, newest first. Filter by status, customer, or policy.
   * @param {PostmanCusteduApi.ListClaimsRequest} request
   * @param {ClaimsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ClaimList>} - A page of claims.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.TooManyRequestsError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.claims.listClaims()
   */
  listClaims(
    request: PostmanCusteduApi.ListClaimsRequest = {},
    requestOptions?: ClaimsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ClaimList> {
    return HttpResponsePromise.fromPromise(this.__listClaims(request, requestOptions));
  }
  private async __listClaims(
    request: PostmanCusteduApi.ListClaimsRequest = {},
    requestOptions?: ClaimsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ClaimList>> {
    const resolvedConfig = this.getResolvedConfig(this.listClaimsConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/claims/v1/claims')
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
        schema: claimListResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addQueryParam({
        key: 'status',
        value: request.status,
      })
      .addQueryParam({
        key: 'customerId',
        value: request.customerId,
      })
      .addQueryParam({
        key: 'policyId',
        value: request.policyId,
      })
      .addQueryParam({
        key: 'limit',
        value: request.limit,
      })
      .addQueryParam({
        key: 'cursor',
        value: request.cursor,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ClaimList>(_request);
  }

  /**
 * Creates a new claim. The policy must be active on the loss date; coverage is validatedagainst the Policy API. Set `submit` to `true` to move straight to `submitted`; otherwise the
claim is created as a `draft`.

The customer must be `active` and own the policy, and a `vehicleId` must be insured on it. The `deductible` comes from
the coverage that pays for the loss type. A second claim for the same policy, vehicle, type, and loss date returns `409`.

 * @param {PostmanCusteduApi.ClaimCreate} request
 * @param {ClaimsClient.RequestOptions} [requestOptions] - Request-specific configuration.
 * @returns {HttpResponsePromise<PostmanCusteduApi.Claim>} - Claim created.
 *
 * @throws {@link PostmanCusteduApi.BadRequestError}
 * @throws {@link PostmanCusteduApi.UnauthorizedError}
 * @throws {@link PostmanCusteduApi.ConflictError}
 * @throws {@link PostmanCusteduApi.UnprocessableEntityError}
 * @throws {@link errors.PostmanCusteduApiError}
 * @throws {@link errors.PostmanCusteduApiTimeoutError}
 *
 * @example
 *     await client.claims.createClaim({
 *         customerId: "customerId",
 *         policyId: "policyId",
 *         type: "collision",
 *         lossDate: "lossDate",
 *         description: "description"
 *     })
 */
  createClaim(
    request: PostmanCusteduApi.ClaimCreate,
    requestOptions?: ClaimsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Claim> {
    return HttpResponsePromise.fromPromise(this.__createClaim(request, requestOptions));
  }
  private async __createClaim(
    request: PostmanCusteduApi.ClaimCreate,
    requestOptions?: ClaimsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Claim>> {
    const resolvedConfig = this.getResolvedConfig(this.createClaimConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/claims/v1/claims')
      .setRequestSchema(claimCreateRequest)
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
        schema: claimResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addHeaderParam({
        key: 'Idempotency-Key',
        value: request['Idempotency-Key'],
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        customerId: request.customerId,
        policyId: request.policyId,
        vehicleId: request.vehicleId,
        type: request.type,
        lossDate: request.lossDate,
        lossLocation: request.lossLocation,
        description: request.description,
        drivable: request.drivable,
        injuries: request.injuries,
        policeReportNumber: request.policeReportNumber,
        submit: request.submit,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Claim>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.GetClaimRequest} request
   * @param {ClaimsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Claim>} - The claim.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.claims.getClaim({
   *         claimId: "claimId"
   *     })
   */
  getClaim(
    request: PostmanCusteduApi.GetClaimRequest,
    requestOptions?: ClaimsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Claim> {
    return HttpResponsePromise.fromPromise(this.__getClaim(request, requestOptions));
  }
  private async __getClaim(
    request: PostmanCusteduApi.GetClaimRequest,
    requestOptions?: ClaimsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Claim>> {
    const resolvedConfig = this.getResolvedConfig(this.getClaimConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/claims/v1/claims/{claimId}')
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
        schema: claimResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Claim>(_request);
  }

  /**
   * Partially updates a claim. Only `draft`, `submitted`, and `under_review` claims can be modified. Status only moves forward (`draft` to `submitted` to `under_review` to `approved` or `denied`); an adjuster must be assigned before `under_review` and an estimate set before `approved`. Use `POST /claims/v1/claims/{claimId}/cancel` to cancel. The approved amount is the estimate less the deductible.
   * @param {PostmanCusteduApi.ClaimUpdate} request
   * @param {ClaimsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Claim>} - Updated claim.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.claims.updateClaim({
   *         claimId: "claimId"
   *     })
   */
  updateClaim(
    request: PostmanCusteduApi.ClaimUpdate,
    requestOptions?: ClaimsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Claim> {
    return HttpResponsePromise.fromPromise(this.__updateClaim(request, requestOptions));
  }
  private async __updateClaim(
    request: PostmanCusteduApi.ClaimUpdate,
    requestOptions?: ClaimsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Claim>> {
    const resolvedConfig = this.getResolvedConfig(this.updateClaimConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('PATCH')
      .setPath('/claims/v1/claims/{claimId}')
      .setRequestSchema(claimUpdateRequest)
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
        schema: claimResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        status: request.status,
        description: request.description,
        assignedAdjusterId: request.assignedAdjusterId,
        estimatedAmount: request.estimatedAmount,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Claim>(_request);
  }

  /**
   * Cancels a claim that has not yet been settled. Open vendor assignments and any payments still `pending_approval` or `processing` are cancelled with it.
   * @param {PostmanCusteduApi.CancelRequest} request
   * @param {ClaimsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Claim>} - Claim cancelled.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.claims.cancelClaim({
   *         claimId: "claimId",
   *         reason: "customer_request"
   *     })
   */
  cancelClaim(
    request: PostmanCusteduApi.CancelRequest,
    requestOptions?: ClaimsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Claim> {
    return HttpResponsePromise.fromPromise(this.__cancelClaim(request, requestOptions));
  }
  private async __cancelClaim(
    request: PostmanCusteduApi.CancelRequest,
    requestOptions?: ClaimsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Claim>> {
    const resolvedConfig = this.getResolvedConfig(this.cancelClaimConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/claims/v1/claims/{claimId}/cancel')
      .setRequestSchema(cancelRequestRequest)
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
        schema: claimResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({ reason: request.reason, comment: request.comment })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Claim>(_request);
  }
}
