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
  ListPaymentMethodsResponse,
  listPaymentMethodsResponseResponse,
} from '../types/ListPaymentMethodsResponse';
import { Problem } from '../../../types/Problem';
import { ListPaymentMethodsRequest } from './requests';
import { PaymentMethodCreate, paymentMethodCreateRequest } from '../types/PaymentMethodCreate';
import { PaymentMethod, paymentMethodResponse } from '../../../types/PaymentMethod';

export declare namespace PaymentMethodsClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for PaymentMethods operations.
 * Provides methods to interact with PaymentMethods-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class PaymentMethodsClient extends BaseService {
  protected listPaymentMethodsConfig?: Partial<BaseClientOptions>;

  protected createPaymentMethodConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listPaymentMethods.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListPaymentMethodsConfig(config: Partial<BaseClientOptions>): this {
    this.listPaymentMethodsConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for createPaymentMethod.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCreatePaymentMethodConfig(config: Partial<BaseClientOptions>): this {
    this.createPaymentMethodConfig = config;
    return this;
  }

  /**
   * Returns tokenized payout destinations for a payee. Account numbers are never returned; only the last four digits.
   * @param {PostmanCusteduApi.ListPaymentMethodsRequest} request
   * @param {PaymentMethodsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListPaymentMethodsResponse>} - Payment methods.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.paymentMethods.listPaymentMethods({
   *         payeeId: "payeeId"
   *     })
   */
  listPaymentMethods(
    request: PostmanCusteduApi.ListPaymentMethodsRequest,
    requestOptions?: PaymentMethodsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListPaymentMethodsResponse> {
    return HttpResponsePromise.fromPromise(this.__listPaymentMethods(request, requestOptions));
  }
  private async __listPaymentMethods(
    request: PostmanCusteduApi.ListPaymentMethodsRequest,
    requestOptions?: PaymentMethodsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListPaymentMethodsResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listPaymentMethodsConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/payments/v1/payment-methods')
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
        schema: listPaymentMethodsResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addQueryParam({
        key: 'payeeId',
        value: request.payeeId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListPaymentMethodsResponse>(_request);
  }

  /**
   * Registers a payout destination using a single-use `token` created by the Vandelay hosted payment form. Raw account numbers are never accepted.
   * @param {PostmanCusteduApi.PaymentMethodCreate} request
   * @param {PaymentMethodsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.PaymentMethod>} - Payment method added.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.paymentMethods.createPaymentMethod({
   *         payeeId: "payeeId",
   *         type: "bank_account",
   *         token: "token"
   *     })
   */
  createPaymentMethod(
    request: PostmanCusteduApi.PaymentMethodCreate,
    requestOptions?: PaymentMethodsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.PaymentMethod> {
    return HttpResponsePromise.fromPromise(this.__createPaymentMethod(request, requestOptions));
  }
  private async __createPaymentMethod(
    request: PostmanCusteduApi.PaymentMethodCreate,
    requestOptions?: PaymentMethodsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.PaymentMethod>> {
    const resolvedConfig = this.getResolvedConfig(this.createPaymentMethodConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/payments/v1/payment-methods')
      .setRequestSchema(paymentMethodCreateRequest)
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
        schema: paymentMethodResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody(request)
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.PaymentMethod>(_request);
  }
}
