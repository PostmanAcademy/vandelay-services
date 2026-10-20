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
import { coverageVerificationRequestRequest } from '../types/CoverageVerificationRequest';
import {
  CoverageVerification,
  coverageVerificationResponse,
} from '../../../types/CoverageVerification';
import { Problem } from '../../../types/Problem';
import { CoverageVerificationRequest } from './requests';

export declare namespace CoverageVerificationClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for CoverageVerification operations.
 * Provides methods to interact with CoverageVerification-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class CoverageVerificationClient extends BaseService {
  protected verifyCoverageConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for verifyCoverage.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setVerifyCoverageConfig(config: Partial<BaseClientOptions>): this {
    this.verifyCoverageConfig = config;
    return this;
  }

  /**
 * Checks whether the policy and vehicle were covered on the loss date for the given claim type, andreturns applicable coverage, limit, and deductible. A policy that is not covered returns
`200` with `covered: false` and a `reasons` list. Use `404` only when the policy does not exist.

 * @param {PostmanCusteduApi.CoverageVerificationRequest} request
 * @param {CoverageVerificationClient.RequestOptions} [requestOptions] - Request-specific configuration.
 * @returns {HttpResponsePromise<PostmanCusteduApi.CoverageVerification>} - Verification result.
 *
 * @throws {@link PostmanCusteduApi.BadRequestError}
 * @throws {@link PostmanCusteduApi.UnauthorizedError}
 * @throws {@link PostmanCusteduApi.NotFoundError}
 * @throws {@link errors.PostmanCusteduApiError}
 * @throws {@link errors.PostmanCusteduApiTimeoutError}
 *
 * @example
 *     await client.coverageVerification.verifyCoverage({
 *         policyId: "policyId",
 *         lossDate: "lossDate",
 *         claimType: "collision"
 *     })
 */
  verifyCoverage(
    request: PostmanCusteduApi.CoverageVerificationRequest,
    requestOptions?: CoverageVerificationClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.CoverageVerification> {
    return HttpResponsePromise.fromPromise(this.__verifyCoverage(request, requestOptions));
  }
  private async __verifyCoverage(
    request: PostmanCusteduApi.CoverageVerificationRequest,
    requestOptions?: CoverageVerificationClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.CoverageVerification>> {
    const resolvedConfig = this.getResolvedConfig(this.verifyCoverageConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/policies/v1/policies/{policyId}/coverage-verifications')
      .setRequestSchema(coverageVerificationRequestRequest)
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
        schema: coverageVerificationResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'policyId',
        value: request.policyId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({
        lossDate: request.lossDate,
        claimType: request.claimType,
        vehicleId: request.vehicleId,
        driverId: request.driverId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.CoverageVerification>(_request);
  }
}
