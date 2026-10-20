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
  ListClaimNotesResponse,
  listClaimNotesResponseResponse,
} from '../types/ListClaimNotesResponse';
import { Problem } from '../../../types/Problem';
import { ListClaimNotesRequest, NoteCreate } from './requests';
import { noteCreateRequest } from '../types/NoteCreate';
import { Note, noteResponse } from '../../../types/Note';

export declare namespace NotesClient {
  export type Options = Partial<BaseClientOptions>;
  export interface RequestOptions extends BaseRequestOptions {}
}

/**
 * Client for Notes operations.
 * Provides methods to interact with Notes-related API endpoints.
 * All methods return promises and handle request/response serialization automatically.
 */
export class NotesClient extends BaseService {
  protected listClaimNotesConfig?: Partial<BaseClientOptions>;

  protected addClaimNoteConfig?: Partial<BaseClientOptions>;

  /**
   * Sets method-level configuration for listClaimNotes.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setListClaimNotesConfig(config: Partial<BaseClientOptions>): this {
    this.listClaimNotesConfig = config;
    return this;
  }

  /**
   * Sets method-level configuration for addClaimNote.
   * @param config - Partial configuration to override service-level defaults
   * @returns This service instance for method chaining
   */
  protected setAddClaimNoteConfig(config: Partial<BaseClientOptions>): this {
    this.addClaimNoteConfig = config;
    return this;
  }

  /**
   *
   * @param {PostmanCusteduApi.ListClaimNotesRequest} request
   * @param {NotesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.ListClaimNotesResponse>} - Notes on the claim, oldest first. Callers authenticated as a customer see only `customer`-visible notes.
   *
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.notes.listClaimNotes({
   *         claimId: "claimId"
   *     })
   */
  listClaimNotes(
    request: PostmanCusteduApi.ListClaimNotesRequest,
    requestOptions?: NotesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.ListClaimNotesResponse> {
    return HttpResponsePromise.fromPromise(this.__listClaimNotes(request, requestOptions));
  }
  private async __listClaimNotes(
    request: PostmanCusteduApi.ListClaimNotesRequest,
    requestOptions?: NotesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.ListClaimNotesResponse>> {
    const resolvedConfig = this.getResolvedConfig(this.listClaimNotesConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('GET')
      .setPath('/claims/v1/claims/{claimId}/notes')
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
        schema: listClaimNotesResponseResponse,
        contentType: ContentType.Json,
        status: 200,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.ListClaimNotesResponse>(_request);
  }

  /**
   *
   * @param {PostmanCusteduApi.NoteCreate} request
   * @param {NotesClient.RequestOptions} [requestOptions] - Request-specific configuration.
   * @returns {HttpResponsePromise<PostmanCusteduApi.Note>} - Note added.
   *
   * @throws {@link PostmanCusteduApi.BadRequestError}
   * @throws {@link PostmanCusteduApi.UnauthorizedError}
   * @throws {@link PostmanCusteduApi.NotFoundError}
   * @throws {@link errors.PostmanCusteduApiError}
   * @throws {@link errors.PostmanCusteduApiTimeoutError}
   *
   * @example
   *     await client.notes.addClaimNote({
   *         claimId: "claimId",
   *         body: "body"
   *     })
   */
  addClaimNote(
    request: PostmanCusteduApi.NoteCreate,
    requestOptions?: NotesClient.RequestOptions,
  ): HttpResponsePromise<PostmanCusteduApi.Note> {
    return HttpResponsePromise.fromPromise(this.__addClaimNote(request, requestOptions));
  }
  private async __addClaimNote(
    request: PostmanCusteduApi.NoteCreate,
    requestOptions?: NotesClient.RequestOptions,
  ): Promise<WithRawResponse<PostmanCusteduApi.Note>> {
    const resolvedConfig = this.getResolvedConfig(this.addClaimNoteConfig, requestOptions);
    const resolvedBaseUrl = await Supplier.get(
      resolvedConfig.baseUrl ?? resolvedConfig.environment,
    );
    const resolvedHeaders = await resolveHeaders(resolvedConfig.headers);
    const _request = new RequestBuilder()
      .setConfig({ ...resolvedConfig, headers: resolvedHeaders })
      .setBaseUrl(resolvedBaseUrl)
      .setMethod('POST')
      .setPath('/claims/v1/claims/{claimId}/notes')
      .setRequestSchema(noteCreateRequest)
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
        schema: noteResponse,
        contentType: ContentType.Json,
        status: 201,
      })
      .addPathParam({
        key: 'claimId',
        value: request.claimId,
      })
      .addHeaderParam({ key: 'Content-Type', value: 'application/json' })
      .addBody({ visibility: request.visibility, body: request.body })
      .build();
    return this.client.callWithRawResponse<PostmanCusteduApi.Note>(_request);
  }
}
