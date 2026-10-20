import { PostmanCusteduApiEnvironment } from './http/environment';
import {
  BaseClientOptions,
  BaseRequestOptions,
  NormalizedClientOptions,
  core,
  normalizeClientOptions,
} from './http/types';
import { Supplier } from './http/utils/supplier';
import { makePassthroughRequest } from './http/utils/passthrough-request';
import { resolveAuthHeaders } from './http/auth';
import { CustomersClient } from './api/resources/customers';
import { VehiclesClient } from './api/resources/vehicles';
import { PreferencesClient } from './api/resources/preferences';
import { PoliciesClient } from './api/resources/policies';
import { CoveragesClient } from './api/resources/coverages';
import { DriversClient } from './api/resources/drivers';
import { CoverageVerificationClient } from './api/resources/coverageVerification';
import { ClaimsClient } from './api/resources/claims';
import { NotesClient } from './api/resources/notes';
import { AssignmentsClient } from './api/resources/assignments';
import { TimelineClient } from './api/resources/timeline';
import { PaymentsClient } from './api/resources/payments';
import { RefundsClient } from './api/resources/refunds';
import { PaymentMethodsClient } from './api/resources/paymentMethods';
import { VendorsClient } from './api/resources/vendors';
import { WorkOrdersClient } from './api/resources/workOrders';

export declare namespace PostmanCusteduApiClient {
  export type Options = BaseClientOptions;
  export interface RequestOptions extends BaseRequestOptions {}
}

export class PostmanCusteduApiClient {
  protected readonly _options: NormalizedClientOptions<BaseClientOptions>;

  protected _customers: CustomersClient | undefined;

  protected _vehicles: VehiclesClient | undefined;

  protected _preferences: PreferencesClient | undefined;

  protected _policies: PoliciesClient | undefined;

  protected _coverages: CoveragesClient | undefined;

  protected _drivers: DriversClient | undefined;

  protected _coverageVerification: CoverageVerificationClient | undefined;

  protected _claims: ClaimsClient | undefined;

  protected _notes: NotesClient | undefined;

  protected _assignments: AssignmentsClient | undefined;

  protected _timeline: TimelineClient | undefined;

  protected _payments: PaymentsClient | undefined;

  protected _refunds: RefundsClient | undefined;

  protected _paymentMethods: PaymentMethodsClient | undefined;

  protected _vendors: VendorsClient | undefined;

  protected _workOrders: WorkOrdersClient | undefined;

  constructor(options: BaseClientOptions) {
    this._options = normalizeClientOptions(options);
  }

  public get customers(): CustomersClient {
    return (this._customers ??= new CustomersClient(this._options));
  }

  public get vehicles(): VehiclesClient {
    return (this._vehicles ??= new VehiclesClient(this._options));
  }

  public get preferences(): PreferencesClient {
    return (this._preferences ??= new PreferencesClient(this._options));
  }

  public get policies(): PoliciesClient {
    return (this._policies ??= new PoliciesClient(this._options));
  }

  public get coverages(): CoveragesClient {
    return (this._coverages ??= new CoveragesClient(this._options));
  }

  public get drivers(): DriversClient {
    return (this._drivers ??= new DriversClient(this._options));
  }

  public get coverageVerification(): CoverageVerificationClient {
    return (this._coverageVerification ??= new CoverageVerificationClient(this._options));
  }

  public get claims(): ClaimsClient {
    return (this._claims ??= new ClaimsClient(this._options));
  }

  public get notes(): NotesClient {
    return (this._notes ??= new NotesClient(this._options));
  }

  public get assignments(): AssignmentsClient {
    return (this._assignments ??= new AssignmentsClient(this._options));
  }

  public get timeline(): TimelineClient {
    return (this._timeline ??= new TimelineClient(this._options));
  }

  public get payments(): PaymentsClient {
    return (this._payments ??= new PaymentsClient(this._options));
  }

  public get refunds(): RefundsClient {
    return (this._refunds ??= new RefundsClient(this._options));
  }

  public get paymentMethods(): PaymentMethodsClient {
    return (this._paymentMethods ??= new PaymentMethodsClient(this._options));
  }

  public get vendors(): VendorsClient {
    return (this._vendors ??= new VendorsClient(this._options));
  }

  public get workOrders(): WorkOrdersClient {
    return (this._workOrders ??= new WorkOrdersClient(this._options));
  }

  /**
   * Escape hatch for calling an endpoint this SDK doesn't wrap: resolves `input` against the
   * configured baseUrl/environment, applies the SDK's default headers, auth, timeout, and retry
   * policy, and returns the raw `Response` — no request/response schema validation.
   */
  public async fetch(
    input: Request | string | URL,
    init?: RequestInit,
    requestOptions?: core.PassthroughRequest.RequestOptions,
  ): Promise<Response> {
    const resolvedAuthHeaders = await resolveAuthHeaders(
      this._options,
      async () => await Supplier.get(this._options.token),
      'Bearer',
    );
    return makePassthroughRequest(
      input,
      init,
      {
        baseUrl: this._options.baseUrl ?? this._options.environment,
        headers: this._options.headers,
        authHeaders: {
          ...resolvedAuthHeaders,
        },
        timeoutInSeconds: this._options.timeoutInSeconds,
        maxRetries: this._options.maxRetries,
        fetch: this._options.fetch,
        logging: this._options.logging,
      },
      requestOptions,
    );
  }
}
