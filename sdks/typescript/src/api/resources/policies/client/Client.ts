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
import { PolicyList, policyListResponse } from '../../../types/PolicyList';
import { Problem } from '../../../types/Problem';
import { GetPolicyRequest, ListPoliciesRequest } from './requests';
import { PolicyDetail, policyDetailResponse } from '../../../types/PolicyDetail';

export declare namespace PoliciesClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Policies operations.
 * Provides methods to interact with Policies-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class PoliciesClient extends BaseService {
  protected listPoliciesConfig?: Partial<BaseClientOptions>;

  protected getPolicyConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listPolicies.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListPoliciesConfig(config: Partial<BaseClientOptions>): this {
    this.listPoliciesConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for getPolicy.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetPolicyConfig(config: Partial<BaseClientOptions>): this {
    this.getPolicyConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListPoliciesRequest} request
   * @param {PoliciesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.PolicyList>} - Policies.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.TooManyRequestsError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.policies.listPolicies()
   */
  listPolicies(
    request: PostmanCusteduApi.ListPoliciesRequest = {},
    requestOptions?: PoliciesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.PolicyList> {
    return HttpResponsePromise.fromPromise(this.__listPolicies(request, requestOptions));
  }
  private async __listPolicies(
    request: PostmanCusteduApi.ListPoliciesRequest = {},
    requestOptions?: PoliciesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.PolicyList>> {
    const resolvedConfig = this.getResolvedConfig(this.listPoliciesConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/policies/v1/policies')
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
        schema: policyListResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addQueryParam({
        key: 'customerId',
        value: request.customerId,
      })
      .addQueryParam({
        key: 'status',
        value: request.status,
      })
      .addQueryParam({
        key: 'vin',
        value: request.vin,
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
    return this.client.callWithRawResponse<PostmanCusteduApi.PolicyList>(_request);
  }

  /**
   * Returns the policy with its coverages, vehicles, and drivers.
   * @param {PostmanCusteduApi.GetPolicyRequest} request
   * @param {PoliciesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.PolicyDetail>} - The policy.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.policies.getPolicy({
   *         policyId: "policyId"
   *     })
   */
  getPolicy(
    request: PostmanCusteduApi.GetPolicyRequest,
    requestOptions?: PoliciesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.PolicyDetail> {
    return HttpResponsePromise.fromPromise(this.__getPolicy(request, requestOptions));
  }
  private async __getPolicy(
    request: PostmanCusteduApi.GetPolicyRequest,
    requestOptions?: PoliciesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.PolicyDetail>> {
    const resolvedConfig = this.getResolvedConfig(this.getPolicyConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/policies/v1/policies/{policyId}')
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
        schema: policyDetailResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'policyId',
        value: request.policyId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.PolicyDetail>(_request);
  }
}
