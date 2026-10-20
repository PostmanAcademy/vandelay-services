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
import { VendorList, vendorListResponse } from '../../../types/VendorList';
import { Problem } from '../../../types/Problem';
import { GetVendorRequest, ListVendorsRequest, VendorCreate, VendorUpdate } from './requests';
import { vendorCreateRequest } from '../types/VendorCreate';
import { Vendor, vendorResponse } from '../../../types/Vendor';
import { vendorUpdateRequest } from '../types/VendorUpdate';

export declare namespace VendorsClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Vendors operations.
 * Provides methods to interact with Vendors-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class VendorsClient extends BaseService {
  protected listVendorsConfig?: Partial<BaseClientOptions>;

  protected createVendorConfig?: Partial<BaseClientOptions>;

  protected getVendorConfig?: Partial<BaseClientOptions>;

  protected updateVendorConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listVendors.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListVendorsConfig(config: Partial<BaseClientOptions>): this {
    this.listVendorsConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for createVendor.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCreateVendorConfig(config: Partial<BaseClientOptions>): this {
    this.createVendorConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for getVendor.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetVendorConfig(config: Partial<BaseClientOptions>): this {
    this.getVendorConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for updateVendor.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setUpdateVendorConfig(config: Partial<BaseClientOptions>): this {
    this.updateVendorConfig = config;
    return this;
  }

  /**
   * Find vendors by service type and proximity. Results are sorted by distance when `postalCode` is supplied.
   * @param {PostmanCusteduApi.ListVendorsRequest} request
   * @param {VendorsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.VendorList>} - Matching vendors.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.TooManyRequestsError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.vendors.listVendors()
   */
  listVendors(
    request: PostmanCusteduApi.ListVendorsRequest = {},
    requestOptions?: VendorsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.VendorList> {
    return HttpResponsePromise.fromPromise(this.__listVendors(request, requestOptions));
  }
  private async __listVendors(
    request: PostmanCusteduApi.ListVendorsRequest = {},
    requestOptions?: VendorsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.VendorList>> {
    const resolvedConfig = this.getResolvedConfig(this.listVendorsConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/vendors/v1/vendors')
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
        schema: vendorListResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addQueryParam({
        key: 'type',
        value: request.type,
      })
      .addQueryParam({
        key: 'postalCode',
        value: request.postalCode,
      })
      .addQueryParam({
        key: 'radiusMiles',
        value: request.radiusMiles,
      })
      .addQueryParam({
        key: 'inNetwork',
        value: request.inNetwork,
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
    return this.client.callWithRawResponse<PostmanCusteduApi.VendorList>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.VendorCreate} request
   * @param {VendorsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Vendor>} - Vendor created in `pending` status until verification completes.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.vendors.createVendor({
   *         name: "name",
   *         type: "repair",
   *         phone: "phone",
   *         email: "email",
   *         address: {
   *             addressLine1: "129 W Trade St",
   *             city: "Charlotte",
   *             state: "NC",
   *             postalCode: "28202",
   *             country: "US"
   *         }
   *     })
   */
  createVendor(
    request: PostmanCusteduApi.VendorCreate,
    requestOptions?: VendorsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Vendor> {
    return HttpResponsePromise.fromPromise(this.__createVendor(request, requestOptions));
  }
  private async __createVendor(
    request: PostmanCusteduApi.VendorCreate,
    requestOptions?: VendorsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Vendor>> {
    const resolvedConfig = this.getResolvedConfig(this.createVendorConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/vendors/v1/vendors')
      .setRequestSchema(vendorCreateRequest)
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
        schema: vendorResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addHeaderParam({
        key: 'Idempotency-Key',
        value: request['Idempotency-Key'],
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        name: request.name,
        type: request.type,
        taxId: request.taxId,
        phone: request.phone,
        email: request.email,
        address: request.address,
        serviceAreaPostalCodes: request.serviceAreaPostalCodes,
        inNetwork: request.inNetwork,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Vendor>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.GetVendorRequest} request
   * @param {VendorsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Vendor>} - The vendor.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.vendors.getVendor({
   *         vendorId: "vendorId"
   *     })
   */
  getVendor(
    request: PostmanCusteduApi.GetVendorRequest,
    requestOptions?: VendorsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Vendor> {
    return HttpResponsePromise.fromPromise(this.__getVendor(request, requestOptions));
  }
  private async __getVendor(
    request: PostmanCusteduApi.GetVendorRequest,
    requestOptions?: VendorsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Vendor>> {
    const resolvedConfig = this.getResolvedConfig(this.getVendorConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/vendors/v1/vendors/{vendorId}')
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
        schema: vendorResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'vendorId',
        value: request.vendorId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Vendor>(_request);
  }

  /**
   * Suspending or terminating a vendor also removes it from the preferred network (`inNetwork` becomes `false`).
   * @param {PostmanCusteduApi.VendorUpdate} request
   * @param {VendorsClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Vendor>} - Updated vendor.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.vendors.updateVendor({
   *         vendorId: "vendorId"
   *     })
   */
  updateVendor(
    request: PostmanCusteduApi.VendorUpdate,
    requestOptions?: VendorsClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Vendor> {
    return HttpResponsePromise.fromPromise(this.__updateVendor(request, requestOptions));
  }
  private async __updateVendor(
    request: PostmanCusteduApi.VendorUpdate,
    requestOptions?: VendorsClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Vendor>> {
    const resolvedConfig = this.getResolvedConfig(this.updateVendorConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('PATCH')
      .setPath('/vendors/v1/vendors/{vendorId}')
      .setRequestSchema(vendorUpdateRequest)
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
        schema: vendorResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'vendorId',
        value: request.vendorId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        name: request.name,
        phone: request.phone,
        email: request.email,
        inNetwork: request.inNetwork,
        status: request.status,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Vendor>(_request);
  }
}
