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
  ListPolicyCoveragesResponse,
  listPolicyCoveragesResponseResponse,
} from '../types/ListPolicyCoveragesResponse';
import { Problem } from '../../../types/Problem';
import { ListPolicyCoveragesRequest } from './requests';

export declare namespace CoveragesClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Coverages operations.
 * Provides methods to interact with Coverages-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class CoveragesClient extends BaseService {
  protected listPolicyCoveragesConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listPolicyCoverages.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListPolicyCoveragesConfig(config: Partial<BaseClientOptions>): this {
    this.listPolicyCoveragesConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListPolicyCoveragesRequest} request
   * @param {CoveragesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListPolicyCoveragesResponse>} - Coverages on the policy.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.coverages.listPolicyCoverages({
   *         policyId: "policyId"
   *     })
   */
  listPolicyCoverages(
    request: PostmanCusteduApi.ListPolicyCoveragesRequest,
    requestOptions?: CoveragesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListPolicyCoveragesResponse> {
    return HttpResponsePromise.fromPromise(this.__listPolicyCoverages(request, requestOptions));
  }
  private async __listPolicyCoverages(
    request: PostmanCusteduApi.ListPolicyCoveragesRequest,
    requestOptions?: CoveragesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListPolicyCoveragesResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listPolicyCoveragesConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/policies/v1/policies/{policyId}/coverages')
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
        schema: listPolicyCoveragesResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'policyId',
        value: request.policyId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListPolicyCoveragesResponse>(_request);
  }
}
