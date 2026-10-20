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
import { PaymentList, paymentListResponse } from '../../../types/PaymentList';
import { Problem } from '../../../types/Problem';
import {
  ApprovePaymentRequest,
  CancelPaymentRequest,
  GetPaymentRequest,
  ListPaymentsRequest,
  PaymentCreate,
} from './requests';
import { paymentCreateRequest } from '../types/PaymentCreate';
import { Payment, paymentResponse } from '../../../types/Payment';
import { approvePaymentRequestRequest } from '../types/ApprovePaymentRequest';
import { cancelPaymentRequestRequest } from '../types/CancelPaymentRequest';

export declare namespace PaymentsClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Payments operations.
 * Provides methods to interact with Payments-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class PaymentsClient extends BaseService {
  protected listPaymentsConfig?: Partial<BaseClientOptions>;

  protected createPaymentConfig?: Partial<BaseClientOptions>;

  protected getPaymentConfig?: Partial<BaseClientOptions>;

  protected approvePaymentConfig?: Partial<BaseClientOptions>;

  protected cancelPaymentConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listPayments.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListPaymentsConfig(config: Partial<BaseClientOptions>): this {
    this.listPaymentsConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for createPayment.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCreatePaymentConfig(config: Partial<BaseClientOptions>): this {
    this.createPaymentConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for getPayment.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetPaymentConfig(config: Partial<BaseClientOptions>): this {
    this.getPaymentConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for approvePayment.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setApprovePaymentConfig(config: Partial<BaseClientOptions>): this {
    this.approvePaymentConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for cancelPayment.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCancelPaymentConfig(config: Partial<BaseClientOptions>): this {
    this.cancelPaymentConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListPaymentsRequest} request
   * @param {PaymentsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.PaymentList>} - Payments.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.TooManyRequestsError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.payments.listPayments()
   */
  listPayments(
    request: PostmanCusteduApi.ListPaymentsRequest = {},
    requestOptions?: PaymentsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.PaymentList> {
    return HttpResponsePromise.fromPromise(this.__listPayments(request, requestOptions));
  }
  private async __listPayments(
    request: PostmanCusteduApi.ListPaymentsRequest = {},
    requestOptions?: PaymentsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.PaymentList>> {
    const resolvedConfig = this.getResolvedConfig(this.listPaymentsConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/payments/v1/payments')
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
        schema: paymentListResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addQueryParam({
        key: 'claimId',
        value: request.claimId,
      })
      .addQueryParam({
        key: 'payeeId',
        value: request.payeeId,
      })
      .addQueryParam({
        key: 'status',
        value: request.status,
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
    return this.client.callWithRawResponse<PostmanCusteduApi.PaymentList>(_request);
  }

  /**
   * Creates a payment for an approved claim. The amount cannot exceed the claim's remaining approved balance (the estimate less the deductible, minus payments already made and refunded). Requires the `payments:write` scope. Payments over the approval threshold start in `pending_approval`; all others start in `processing`.
   * @param {PostmanCusteduApi.PaymentCreate} request
   * @param {PaymentsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Payment>} - Payment created.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.ForbiddenError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link PostmanCusteduApi.UnprocessableEntityError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.payments.createPayment({
   *         "Idempotency-Key": "Idempotency-Key",
   *         claimId: "claimId",
   *         type: "settlement",
   *         payee: {
   *             type: "customer",
   *             id: "cus_01HX9K"
   *         },
   *         paymentMethodId: "paymentMethodId",
   *         amount: {
   *             amount: 4350,
   *             currency: "USD"
   *         }
   *     })
   */
  createPayment(
    request: PostmanCusteduApi.PaymentCreate,
    requestOptions?: PaymentsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Payment> {
    return HttpResponsePromise.fromPromise(this.__createPayment(request, requestOptions));
  }
  private async __createPayment(
    request: PostmanCusteduApi.PaymentCreate,
    requestOptions?: PaymentsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Payment>> {
    const resolvedConfig = this.getResolvedConfig(this.createPaymentConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/payments/v1/payments')
      .setRequestSchema(paymentCreateRequest)
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
        schema: paymentResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addHeaderParam({
        key: 'Idempotency-Key',
        value: request['Idempotency-Key'],
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        claimId: request.claimId,
        type: request.type,
        payee: request.payee,
        paymentMethodId: request.paymentMethodId,
        amount: request.amount,
        invoiceNumber: request.invoiceNumber,
        memo: request.memo,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Payment>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.GetPaymentRequest} request
   * @param {PaymentsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Payment>} - The payment.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.payments.getPayment({
   *         paymentId: "paymentId"
   *     })
   */
  getPayment(
    request: PostmanCusteduApi.GetPaymentRequest,
    requestOptions?: PaymentsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Payment> {
    return HttpResponsePromise.fromPromise(this.__getPayment(request, requestOptions));
  }
  private async __getPayment(
    request: PostmanCusteduApi.GetPaymentRequest,
    requestOptions?: PaymentsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Payment>> {
    const resolvedConfig = this.getResolvedConfig(this.getPaymentConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/payments/v1/payments/{paymentId}')
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
        schema: paymentResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'paymentId',
        value: request.paymentId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Payment>(_request);
  }

  /**
   * Requires the `payments:approve` scope. The approver must differ from the creator.
   * @param {PostmanCusteduApi.ApprovePaymentRequest} request
   * @param {PaymentsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Payment>} - Payment approved and queued for processing.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.ForbiddenError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.payments.approvePayment({
   *         paymentId: "paymentId"
   *     })
   */
  approvePayment(
    request: PostmanCusteduApi.ApprovePaymentRequest,
    requestOptions?: PaymentsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Payment> {
    return HttpResponsePromise.fromPromise(this.__approvePayment(request, requestOptions));
  }
  private async __approvePayment(
    request: PostmanCusteduApi.ApprovePaymentRequest,
    requestOptions?: PaymentsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Payment>> {
    const resolvedConfig = this.getResolvedConfig(this.approvePaymentConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/payments/v1/payments/{paymentId}/approve')
      .setRequestSchema(approvePaymentRequestRequest)
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
        schema: paymentResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'paymentId',
        value: request.paymentId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({ comment: request.comment })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Payment>(_request);
  }

  /**
   * Only payments in `pending_approval` or `processing` (before bank submission) can be cancelled.
   * @param {PostmanCusteduApi.CancelPaymentRequest} request
   * @param {PaymentsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Payment>} - Payment cancelled.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.payments.cancelPayment({
   *         paymentId: "paymentId",
   *         reason: "duplicate"
   *     })
   */
  cancelPayment(
    request: PostmanCusteduApi.CancelPaymentRequest,
    requestOptions?: PaymentsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Payment> {
    return HttpResponsePromise.fromPromise(this.__cancelPayment(request, requestOptions));
  }
  private async __cancelPayment(
    request: PostmanCusteduApi.CancelPaymentRequest,
    requestOptions?: PaymentsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Payment>> {
    const resolvedConfig = this.getResolvedConfig(this.cancelPaymentConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/payments/v1/payments/{paymentId}/cancel')
      .setRequestSchema(cancelPaymentRequestRequest)
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
        schema: paymentResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'paymentId',
        value: request.paymentId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({ reason: request.reason, comment: request.comment })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Payment>(_request);
  }
}
