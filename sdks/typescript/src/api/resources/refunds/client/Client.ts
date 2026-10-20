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
  ListPaymentRefundsResponse,
  listPaymentRefundsResponseResponse,
} from '../types/ListPaymentRefundsResponse';
import { Problem } from '../../../types/Problem';
import { ListPaymentRefundsRequest, RefundCreate } from './requests';
import { refundCreateRequest } from '../types/RefundCreate';
import { Refund, refundResponse } from '../../../types/Refund';

export declare namespace RefundsClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Refunds operations.
 * Provides methods to interact with Refunds-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class RefundsClient extends BaseService {
  protected listPaymentRefundsConfig?: Partial<BaseClientOptions>;

  protected createPaymentRefundConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listPaymentRefunds.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListPaymentRefundsConfig(config: Partial<BaseClientOptions>): this {
    this.listPaymentRefundsConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for createPaymentRefund.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCreatePaymentRefundConfig(config: Partial<BaseClientOptions>): this {
    this.createPaymentRefundConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListPaymentRefundsRequest} request
   * @param {RefundsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListPaymentRefundsResponse>} - Refunds.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.refunds.listPaymentRefunds({
   *         paymentId: "paymentId"
   *     })
   */
  listPaymentRefunds(
    request: PostmanCusteduApi.ListPaymentRefundsRequest,
    requestOptions?: RefundsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListPaymentRefundsResponse> {
    return HttpResponsePromise.fromPromise(this.__listPaymentRefunds(request, requestOptions));
  }
  private async __listPaymentRefunds(
    request: PostmanCusteduApi.ListPaymentRefundsRequest,
    requestOptions?: RefundsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListPaymentRefundsResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listPaymentRefundsConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/payments/v1/payments/{paymentId}/refunds')
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
        schema: listPaymentRefundsResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'paymentId',
        value: request.paymentId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListPaymentRefundsResponse>(_request);
  }

  /**
   * Only `completed` payments can be refunded, up to the amount not already refunded. The refund completes automatically after the settlement delay.
   * @param {PostmanCusteduApi.RefundCreate} request
   * @param {RefundsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Refund>} - Refund created.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.UnprocessableEntityError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.refunds.createPaymentRefund({
   *         paymentId: "paymentId",
   *         "Idempotency-Key": "Idempotency-Key",
   *         amount: {
   *             amount: 4350,
   *             currency: "USD"
   *         },
   *         reason: "overpayment"
   *     })
   */
  createPaymentRefund(
    request: PostmanCusteduApi.RefundCreate,
    requestOptions?: RefundsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Refund> {
    return HttpResponsePromise.fromPromise(this.__createPaymentRefund(request, requestOptions));
  }
  private async __createPaymentRefund(
    request: PostmanCusteduApi.RefundCreate,
    requestOptions?: RefundsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Refund>> {
    const resolvedConfig = this.getResolvedConfig(this.createPaymentRefundConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/payments/v1/payments/{paymentId}/refunds')
      .setRequestSchema(refundCreateRequest)
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
        schema: refundResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addPathParam({
        key: 'paymentId',
        value: request.paymentId,
      })
      .addHeaderParam({
        key: 'Idempotency-Key',
        value: request['Idempotency-Key'],
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({ amount: request.amount, reason: request.reason })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Refund>(_request);
  }
}
