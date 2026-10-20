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
import { Preferences, preferencesRequest, preferencesResponse } from '../../../types/Preferences';
import { Problem } from '../../../types/Problem';
import { GetCustomerPreferencesRequest, ReplaceCustomerPreferencesRequest } from './requests';

export declare namespace PreferencesClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Preferences operations.
 * Provides methods to interact with Preferences-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class PreferencesClient extends BaseService {
  protected getCustomerPreferencesConfig?: Partial<BaseClientOptions>;

  protected replaceCustomerPreferencesConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for getCustomerPreferences.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetCustomerPreferencesConfig(config: Partial<BaseClientOptions>): this {
    this.getCustomerPreferencesConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for replaceCustomerPreferences.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setReplaceCustomerPreferencesConfig(config: Partial<BaseClientOptions>): this {
    this.replaceCustomerPreferencesConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.GetCustomerPreferencesRequest} request
   * @param {PreferencesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Preferences>} - Preferences.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.preferences.getCustomerPreferences({
   *         customerId: "customerId"
   *     })
   */
  getCustomerPreferences(
    request: PostmanCusteduApi.GetCustomerPreferencesRequest,
    requestOptions?: PreferencesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Preferences> {
    return HttpResponsePromise.fromPromise(this.__getCustomerPreferences(request, requestOptions));
  }
  private async __getCustomerPreferences(
    request: PostmanCusteduApi.GetCustomerPreferencesRequest,
    requestOptions?: PreferencesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Preferences>> {
    const resolvedConfig = this.getResolvedConfig(
      this.getCustomerPreferencesConfig,
      requestOptions,
    );
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/customers/v1/customers/{customerId}/preferences')
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
        schema: preferencesResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'customerId',
        value: request.customerId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Preferences>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.ReplaceCustomerPreferencesRequest} request
   * @param {PreferencesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Preferences>} - Preferences saved.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.preferences.replaceCustomerPreferences({
   *         customerId: "customerId",
   *         body: {}
   *     })
   */
  replaceCustomerPreferences(
    request: PostmanCusteduApi.ReplaceCustomerPreferencesRequest,
    requestOptions?: PreferencesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Preferences> {
    return HttpResponsePromise.fromPromise(
      this.__replaceCustomerPreferences(request, requestOptions),
    );
  }
  private async __replaceCustomerPreferences(
    request: PostmanCusteduApi.ReplaceCustomerPreferencesRequest,
    requestOptions?: PreferencesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Preferences>> {
    const resolvedConfig = this.getResolvedConfig(
      this.replaceCustomerPreferencesConfig,
      requestOptions,
    );
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('PUT')
      .setPath('/customers/v1/customers/{customerId}/preferences')
      .setRequestSchema(preferencesRequest)
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
        schema: preferencesResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'customerId',
        value: request.customerId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody(request.body)
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Preferences>(_request);
  }
}
