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
  ListWorkOrdersResponse,
  listWorkOrdersResponseResponse,
} from '../types/ListWorkOrdersResponse';
import { Problem } from '../../../types/Problem';
import {
  GetWorkOrderRequest,
  ListWorkOrdersRequest,
  WorkOrderCreate,
  WorkOrderUpdate,
} from './requests';
import { workOrderCreateRequest } from '../types/WorkOrderCreate';
import { WorkOrder, workOrderResponse } from '../../../types/WorkOrder';
import { workOrderUpdateRequest } from '../types/WorkOrderUpdate';

export declare namespace WorkOrdersClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for WorkOrders operations.
 * Provides methods to interact with WorkOrders-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class WorkOrdersClient extends BaseService {
  protected listWorkOrdersConfig?: Partial<BaseClientOptions>;

  protected createWorkOrderConfig?: Partial<BaseClientOptions>;

  protected getWorkOrderConfig?: Partial<BaseClientOptions>;

  protected updateWorkOrderConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listWorkOrders.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListWorkOrdersConfig(config: Partial<BaseClientOptions>): this {
    this.listWorkOrdersConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for createWorkOrder.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCreateWorkOrderConfig(config: Partial<BaseClientOptions>): this {
    this.createWorkOrderConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for getWorkOrder.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetWorkOrderConfig(config: Partial<BaseClientOptions>): this {
    this.getWorkOrderConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for updateWorkOrder.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setUpdateWorkOrderConfig(config: Partial<BaseClientOptions>): this {
    this.updateWorkOrderConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListWorkOrdersRequest} request
   * @param {WorkOrdersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListWorkOrdersResponse>} - Work orders.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.workOrders.listWorkOrders()
   */
  listWorkOrders(
    request: PostmanCusteduApi.ListWorkOrdersRequest = {},
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListWorkOrdersResponse> {
    return HttpResponsePromise.fromPromise(this.__listWorkOrders(request, requestOptions));
  }
  private async __listWorkOrders(
    request: PostmanCusteduApi.ListWorkOrdersRequest = {},
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListWorkOrdersResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listWorkOrdersConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/vendors/v1/work-orders')
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
        schema: listWorkOrdersResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addQueryParam({
        key: 'vendorId',
        value: request.vendorId,
      })
      .addQueryParam({
        key: 'claimId',
        value: request.claimId,
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
    return this.client.callWithRawResponse<PostmanCusteduApi.ListWorkOrdersResponse>(_request);
  }

  /**
   * Issues a work order to a vendor for a claim. The vendor must be `active` and serve the loss location. The same engagement appears in the Claims API as an assignment.
   * @param {PostmanCusteduApi.WorkOrderCreate} request
   * @param {WorkOrdersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.WorkOrder>} - Work order created.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.UnprocessableEntityError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.workOrders.createWorkOrder({
   *         claimId: "claimId",
   *         vendorId: "vendorId",
   *         type: "repair"
   *     })
   */
  createWorkOrder(
    request: PostmanCusteduApi.WorkOrderCreate,
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.WorkOrder> {
    return HttpResponsePromise.fromPromise(this.__createWorkOrder(request, requestOptions));
  }
  private async __createWorkOrder(
    request: PostmanCusteduApi.WorkOrderCreate,
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.WorkOrder>> {
    const resolvedConfig = this.getResolvedConfig(this.createWorkOrderConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/vendors/v1/work-orders')
      .setRequestSchema(workOrderCreateRequest)
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
        schema: workOrderResponse,
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
        vendorId: request.vendorId,
        type: request.type,
        scheduledFor: request.scheduledFor,
        instructions: request.instructions,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.WorkOrder>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.GetWorkOrderRequest} request
   * @param {WorkOrdersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.WorkOrder>} - The work order.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.workOrders.getWorkOrder({
   *         workOrderId: "workOrderId"
   *     })
   */
  getWorkOrder(
    request: PostmanCusteduApi.GetWorkOrderRequest,
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.WorkOrder> {
    return HttpResponsePromise.fromPromise(this.__getWorkOrder(request, requestOptions));
  }
  private async __getWorkOrder(
    request: PostmanCusteduApi.GetWorkOrderRequest,
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.WorkOrder>> {
    const resolvedConfig = this.getResolvedConfig(this.getWorkOrderConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/vendors/v1/work-orders/{workOrderId}')
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
        schema: workOrderResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'workOrderId',
        value: request.workOrderId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.WorkOrder>(_request);
  }

  /**
   * Vendors use this endpoint to accept, schedule, submit estimates, and complete work. Status moves `issued` to `accepted` to `in_progress` to `completed` (or `declined` or `cancelled`), and an estimate can be submitted once the work order is accepted.
   * @param {PostmanCusteduApi.WorkOrderUpdate} request
   * @param {WorkOrdersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.WorkOrder>} - Updated work order.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.workOrders.updateWorkOrder({
   *         workOrderId: "workOrderId"
   *     })
   */
  updateWorkOrder(
    request: PostmanCusteduApi.WorkOrderUpdate,
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.WorkOrder> {
    return HttpResponsePromise.fromPromise(this.__updateWorkOrder(request, requestOptions));
  }
  private async __updateWorkOrder(
    request: PostmanCusteduApi.WorkOrderUpdate,
    requestOptions?: WorkOrdersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.WorkOrder>> {
    const resolvedConfig = this.getResolvedConfig(this.updateWorkOrderConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('PATCH')
      .setPath('/vendors/v1/work-orders/{workOrderId}')
      .setRequestSchema(workOrderUpdateRequest)
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
        schema: workOrderResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'workOrderId',
        value: request.workOrderId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        status: request.status,
        estimate: request.estimate,
        scheduledFor: request.scheduledFor,
        notes: request.notes,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.WorkOrder>(_request);
  }
}
