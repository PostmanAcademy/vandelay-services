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
  ListPolicyDriversResponse,
  listPolicyDriversResponseResponse,
} from '../types/ListPolicyDriversResponse';
import { Problem } from '../../../types/Problem';
import { DriverCreate, ListPolicyDriversRequest } from './requests';
import { driverCreateRequest } from '../types/DriverCreate';
import { Driver, driverResponse } from '../../../types/Driver';

export declare namespace DriversClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Drivers operations.
 * Provides methods to interact with Drivers-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class DriversClient extends BaseService {
  protected listPolicyDriversConfig?: Partial<BaseClientOptions>;

  protected addPolicyDriverConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listPolicyDrivers.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListPolicyDriversConfig(config: Partial<BaseClientOptions>): this {
    this.listPolicyDriversConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for addPolicyDriver.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setAddPolicyDriverConfig(config: Partial<BaseClientOptions>): this {
    this.addPolicyDriverConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListPolicyDriversRequest} request
   * @param {DriversClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListPolicyDriversResponse>} - Drivers.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.drivers.listPolicyDrivers({
   *         policyId: "policyId"
   *     })
   */
  listPolicyDrivers(
    request: PostmanCusteduApi.ListPolicyDriversRequest,
    requestOptions?: DriversClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListPolicyDriversResponse> {
    return HttpResponsePromise.fromPromise(this.__listPolicyDrivers(request, requestOptions));
  }
  private async __listPolicyDrivers(
    request: PostmanCusteduApi.ListPolicyDriversRequest,
    requestOptions?: DriversClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListPolicyDriversResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listPolicyDriversConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/policies/v1/policies/{policyId}/drivers')
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
        schema: listPolicyDriversResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'policyId',
        value: request.policyId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListPolicyDriversResponse>(_request);
  }

  /**
   * Adds a driver; may trigger a premium recalculation.
   * @param {PostmanCusteduApi.DriverCreate} request
   * @param {DriversClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Driver>} - Driver added.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.drivers.addPolicyDriver({
   *         policyId: "policyId",
   *         firstName: "firstName",
   *         lastName: "lastName",
   *         dateOfBirth: "dateOfBirth",
   *         licenseNumber: "licenseNumber",
   *         licenseState: "licenseState",
   *         relationship: "self"
   *     })
   */
  addPolicyDriver(
    request: PostmanCusteduApi.DriverCreate,
    requestOptions?: DriversClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Driver> {
    return HttpResponsePromise.fromPromise(this.__addPolicyDriver(request, requestOptions));
  }
  private async __addPolicyDriver(
    request: PostmanCusteduApi.DriverCreate,
    requestOptions?: DriversClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Driver>> {
    const resolvedConfig = this.getResolvedConfig(this.addPolicyDriverConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/policies/v1/policies/{policyId}/drivers')
      .setRequestSchema(driverCreateRequest)
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
        schema: driverResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addPathParam({
        key: 'policyId',
        value: request.policyId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth,
        licenseNumber: request.licenseNumber,
        licenseState: request.licenseState,
        relationship: request.relationship,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Driver>(_request);
  }
}
