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
  GetClaimTimelineResponse,
  getClaimTimelineResponseResponse,
} from '../types/GetClaimTimelineResponse';
import { Problem } from '../../../types/Problem';
import { GetClaimTimelineRequest } from './requests';

export declare namespace TimelineClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Timeline operations.
 * Provides methods to interact with Timeline-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class TimelineClient extends BaseService {
  protected getClaimTimelineConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for getClaimTimeline.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetClaimTimelineConfig(config: Partial<BaseClientOptions>): this {
    this.getClaimTimelineConfig = config;
    return this;
  }

  /**
   * Chronological audit trail of events for the claim.
   * @param {PostmanCusteduApi.GetClaimTimelineRequest} request
   * @param {TimelineClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.GetClaimTimelineResponse>} - Timeline events.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.timeline.getClaimTimeline({
   *         claimId: "claimId"
   *     })
   */
  getClaimTimeline(
    request: PostmanCusteduApi.GetClaimTimelineRequest,
    requestOptions?: TimelineClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.GetClaimTimelineResponse> {
    return HttpResponsePromise.fromPromise(this.__getClaimTimeline(request, requestOptions));
  }
  private async __getClaimTimeline(
    request: PostmanCusteduApi.GetClaimTimelineRequest,
    requestOptions?: TimelineClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.GetClaimTimelineResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.getClaimTimelineConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/claims/v1/claims/{claimId}/timeline')
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
        schema: getClaimTimelineResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.GetClaimTimelineResponse>(_request);
  }
}
