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
  ListCustomerVehiclesResponse,
  listCustomerVehiclesResponseResponse,
} from '../types/ListCustomerVehiclesResponse';
import { Problem } from '../../../types/Problem';
import { ListCustomerVehiclesRequest, ListPolicyVehiclesRequest, VehicleCreate } from './requests';
import { vehicleCreateRequest } from '../types/VehicleCreate';
import { Vehicle, vehicleResponse } from '../../../types/Vehicle';
import {
  ListPolicyVehiclesResponse,
  listPolicyVehiclesResponseResponse,
} from '../types/ListPolicyVehiclesResponse';

export declare namespace VehiclesClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Vehicles operations.
 * Provides methods to interact with Vehicles-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class VehiclesClient extends BaseService {
  protected listCustomerVehiclesConfig?: Partial<BaseClientOptions>;

  protected addCustomerVehicleConfig?: Partial<BaseClientOptions>;

  protected listPolicyVehiclesConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listCustomerVehicles.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListCustomerVehiclesConfig(config: Partial<BaseClientOptions>): this {
    this.listCustomerVehiclesConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for addCustomerVehicle.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setAddCustomerVehicleConfig(config: Partial<BaseClientOptions>): this {
    this.addCustomerVehicleConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for listPolicyVehicles.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListPolicyVehiclesConfig(config: Partial<BaseClientOptions>): this {
    this.listPolicyVehiclesConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListCustomerVehiclesRequest} request
   * @param {VehiclesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListCustomerVehiclesResponse>} - Vehicles.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.vehicles.listCustomerVehicles({
   *         customerId: "customerId"
   *     })
   */
  listCustomerVehicles(
    request: PostmanCusteduApi.ListCustomerVehiclesRequest,
    requestOptions?: VehiclesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListCustomerVehiclesResponse> {
    return HttpResponsePromise.fromPromise(this.__listCustomerVehicles(request, requestOptions));
  }
  private async __listCustomerVehicles(
    request: PostmanCusteduApi.ListCustomerVehiclesRequest,
    requestOptions?: VehiclesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListCustomerVehiclesResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listCustomerVehiclesConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/customers/v1/customers/{customerId}/vehicles')
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
        schema: listCustomerVehiclesResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'customerId',
        value: request.customerId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListCustomerVehiclesResponse>(
      _request,
    );
  }

  /**
   *
   * @param {PostmanCusteduApi.VehicleCreate} request
   * @param {VehiclesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Vehicle>} - Vehicle added.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.vehicles.addCustomerVehicle({
   *         customerId: "customerId",
   *         vin: "vin",
   *         year: 1,
   *         make: "make",
   *         model: "model"
   *     })
   */
  addCustomerVehicle(
    request: PostmanCusteduApi.VehicleCreate,
    requestOptions?: VehiclesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Vehicle> {
    return HttpResponsePromise.fromPromise(this.__addCustomerVehicle(request, requestOptions));
  }
  private async __addCustomerVehicle(
    request: PostmanCusteduApi.VehicleCreate,
    requestOptions?: VehiclesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Vehicle>> {
    const resolvedConfig = this.getResolvedConfig(this.addCustomerVehicleConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/customers/v1/customers/{customerId}/vehicles')
      .setRequestSchema(vehicleCreateRequest)
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
        schema: vehicleResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addPathParam({
        key: 'customerId',
        value: request.customerId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        vin: request.vin,
        year: request.year,
        make: request.make,
        model: request.model,
        trim: request.trim,
        color: request.color,
        licensePlate: request.licensePlate,
        licensePlateState: request.licensePlateState,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Vehicle>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.ListPolicyVehiclesRequest} request
   * @param {VehiclesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListPolicyVehiclesResponse>} - Insured vehicles.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.vehicles.listPolicyVehicles({
   *         policyId: "policyId"
   *     })
   */
  listPolicyVehicles(
    request: PostmanCusteduApi.ListPolicyVehiclesRequest,
    requestOptions?: VehiclesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListPolicyVehiclesResponse> {
    return HttpResponsePromise.fromPromise(this.__listPolicyVehicles(request, requestOptions));
  }
  private async __listPolicyVehicles(
    request: PostmanCusteduApi.ListPolicyVehiclesRequest,
    requestOptions?: VehiclesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListPolicyVehiclesResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listPolicyVehiclesConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/policies/v1/policies/{policyId}/vehicles')
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
        schema: listPolicyVehiclesResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'policyId',
        value: request.policyId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListPolicyVehiclesResponse>(_request);
  }
}
