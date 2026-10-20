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
import { CustomerList, customerListResponse } from '../../../types/CustomerList';
import { Problem } from '../../../types/Problem';
import {
  CustomerCreate,
  CustomerUpdate,
  DeleteCustomerRequest,
  GetCustomerRequest,
  ListCustomersRequest,
} from './requests';
import { customerCreateRequest } from '../types/CustomerCreate';
import { Customer, customerResponse } from '../../../types/Customer';
import { customerUpdateRequest } from '../types/CustomerUpdate';

export declare namespace CustomersClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Customers operations.
 * Provides methods to interact with Customers-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class CustomersClient extends BaseService {
  protected listCustomersConfig?: Partial<BaseClientOptions>;

  protected createCustomerConfig?: Partial<BaseClientOptions>;

  protected getCustomerConfig?: Partial<BaseClientOptions>;

  protected updateCustomerConfig?: Partial<BaseClientOptions>;

  protected deleteCustomerConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listCustomers.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListCustomersConfig(config: Partial<BaseClientOptions>): this {
    this.listCustomersConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for createCustomer.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setCreateCustomerConfig(config: Partial<BaseClientOptions>): this {
    this.createCustomerConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for getCustomer.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setGetCustomerConfig(config: Partial<BaseClientOptions>): this {
    this.getCustomerConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for updateCustomer.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setUpdateCustomerConfig(config: Partial<BaseClientOptions>): this {
    this.updateCustomerConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for deleteCustomer.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setDeleteCustomerConfig(config: Partial<BaseClientOptions>): this {
    this.deleteCustomerConfig = config;
    return this;
  }

  /**
   * Search customers by email, phone, or last name. At least one filter is required.
   * @param {PostmanCusteduApi.ListCustomersRequest} request
   * @param {CustomersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.CustomerList>} - Matching customers.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.TooManyRequestsError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.customers.listCustomers()
   */
  listCustomers(
    request: PostmanCusteduApi.ListCustomersRequest = {},
    requestOptions?: CustomersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.CustomerList> {
    return HttpResponsePromise.fromPromise(this.__listCustomers(request, requestOptions));
  }
  private async __listCustomers(
    request: PostmanCusteduApi.ListCustomersRequest = {},
    requestOptions?: CustomersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.CustomerList>> {
    const resolvedConfig = this.getResolvedConfig(this.listCustomersConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/customers/v1/customers')
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
        schema: customerListResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addQueryParam({
        key: 'email',
        value: request.email,
      })
      .addQueryParam({
        key: 'phone',
        value: request.phone,
      })
      .addQueryParam({
        key: 'lastName',
        value: request.lastName,
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
    return this.client.callWithRawResponse<PostmanCusteduApi.CustomerList>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.CustomerCreate} request
   * @param {CustomersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Customer>} - Customer created.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.customers.createCustomer({
   *         firstName: "firstName",
   *         lastName: "lastName",
   *         email: "email"
   *     })
   */
  createCustomer(
    request: PostmanCusteduApi.CustomerCreate,
    requestOptions?: CustomersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Customer> {
    return HttpResponsePromise.fromPromise(this.__createCustomer(request, requestOptions));
  }
  private async __createCustomer(
    request: PostmanCusteduApi.CustomerCreate,
    requestOptions?: CustomersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Customer>> {
    const resolvedConfig = this.getResolvedConfig(this.createCustomerConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/customers/v1/customers')
      .setRequestSchema(customerCreateRequest)
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
        schema: customerResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addHeaderParam({
        key: 'Idempotency-Key',
        value: request['Idempotency-Key'],
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
        dateOfBirth: request.dateOfBirth,
        address: request.address,
        preferences: request.preferences,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Customer>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.GetCustomerRequest} request
   * @param {CustomersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Customer>} - The customer. Date of birth is masked without the `customers:pii:read` scope.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.customers.getCustomer({
   *         customerId: "customerId"
   *     })
   */
  getCustomer(
    request: PostmanCusteduApi.GetCustomerRequest,
    requestOptions?: CustomersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Customer> {
    return HttpResponsePromise.fromPromise(this.__getCustomer(request, requestOptions));
  }
  private async __getCustomer(
    request: PostmanCusteduApi.GetCustomerRequest,
    requestOptions?: CustomersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Customer>> {
    const resolvedConfig = this.getResolvedConfig(this.getCustomerConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/customers/v1/customers/{customerId}')
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
        schema: customerResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'customerId',
        value: request.customerId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Customer>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.CustomerUpdate} request
   * @param {CustomersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Customer>} - Updated customer.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.customers.updateCustomer({
   *         customerId: "customerId"
   *     })
   */
  updateCustomer(
    request: PostmanCusteduApi.CustomerUpdate,
    requestOptions?: CustomersClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Customer> {
    return HttpResponsePromise.fromPromise(this.__updateCustomer(request, requestOptions));
  }
  private async __updateCustomer(
    request: PostmanCusteduApi.CustomerUpdate,
    requestOptions?: CustomersClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Customer>> {
    const resolvedConfig = this.getResolvedConfig(this.updateCustomerConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('PATCH')
      .setPath('/customers/v1/customers/{customerId}')
      .setRequestSchema(customerUpdateRequest)
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
        schema: customerResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'customerId',
        value: request.customerId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
        address: request.address,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Customer>(_request);
  }

  /**
   * Soft-deletes the customer by setting status to `inactive`. Requires the `customers:delete` scope (otherwise `403`). Customers with open claims (`draft`, `submitted`, `under_review`, `approved`, or `settled`) cannot be deleted.
   * @param {PostmanCusteduApi.DeleteCustomerRequest} request
   * @param {CustomersClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<void>} - Customer deactivated.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.ForbiddenError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link PostmanCusteduApi.ConflictError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.customers.deleteCustomer({
   *         customerId: "customerId"
   *     })
   */
  deleteCustomer(
    request: PostmanCusteduApi.DeleteCustomerRequest,
    requestOptions?: CustomersClient.RequestOptions,
  ): HttpResponsePromise<void> {
    return HttpResponsePromise.fromPromise(this.__deleteCustomer(request, requestOptions));
  }
  private async __deleteCustomer(
    request: PostmanCusteduApi.DeleteCustomerRequest,
    requestOptions?: CustomersClient.RequestOptions,
  ): Promise<WithRawResponse<void>> {
    const resolvedConfig = this.getResolvedConfig(this.deleteCustomerConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('DELETE')
      .setPath('/customers/v1/customers/{customerId}')
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
        schema: core.cast.NEVER as unknown as core.cast.CastSchema<any, any>,
        contentType: ContentType.NoContent,
        status: 204,
      })
      .addPathParam({
        key: 'customerId',
        value: request.customerId,
      })
      .build();
    return this.client.callWithRawResponse<void>(_request);
  }
}
