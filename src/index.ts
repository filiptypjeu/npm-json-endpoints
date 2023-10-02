import fetch, { RequestInit } from "node-fetch";

interface IEndpoint {
    list?: any;
    list_filters?: any;
    list_paginated?: true;
    detail?: any;
    detail_append?: any;
    detail_parameter?: any;
}

export type ListableEndpoints<A> = {
    [K in keyof A]: A[K] extends { list: any } ? K : never;
}[keyof A];

export type DetailableEndpoints<A> = {
    [K in keyof A]: A[K] extends { detail: any } ? K : A[K] extends { list: any; detail_append: any } ? K : never;
}[keyof A];

export type ListType<E extends IEndpoint> = E extends { list: any; list_paginated: true }
    ? {
          // XXX: This schema should not be hardcoded
          count: number;
          next: string | null;
          previous: string | null;
          results: Array<E["list"]>;
      }
    : E extends { list: any }
    ? Array<E["list"]>
    : never;

export type DetailedType<E extends IEndpoint> = E extends { detail: any }
    ? E["detail"]
    : E extends { list: any; detail_append: any }
    ? E["list"] & E["detail_append"]
    : never;

export type ParameterType<E extends IEndpoint> = E extends { detail_parameter: any }
    ? E["detail_parameter"]
    : E extends { detail: any }
    ? number
    : E extends { list: any; detail_append: any }
    ? number
    : never;

export type FilterType<E extends IEndpoint> = E extends { list_filters: any }
    ? Partial<E["list_filters"]>
    : E extends { list: any }
    ? Record<string, never>
    : never;

export class APIManager<API extends { [key: string]: IEndpoint | any }> {
    public readonly apiBaseUrl: string;
    public readonly pathMapping: Partial<Record<keyof API, string>>;
    public readonly paginated: Array<keyof API>;
    public readonly paginationKey: string = "result";
    public readonly extraQueryParams: Array<[string, string]>;
    public readonly endingBackslash: boolean | undefined;
    public readonly customParamTag: string = "$PARAM";
    protected readonly options: RequestInit = { method: "GET" };

    constructor({
        apiBaseUrl,
        username,
        password,
        pathMapping,
        paginated,
        paginationKey,
        extraQueryParams,
        endingBackslash,
        customParamTag,
    }: {
        apiBaseUrl: string;
        username?: string;
        password?: string;
        pathMapping?: Partial<Record<keyof API, string>>;
        paginated?: Array<keyof API>;
        paginationKey?: string;
        extraQueryParams?: Array<[string, string]>;
        endingBackslash?: boolean;
        customParamTag?: string;
    }) {
        this.pathMapping = pathMapping || {};
        this.paginated = paginated || [];
        this.extraQueryParams = extraQueryParams || [];
        this.endingBackslash = endingBackslash;

        this.apiBaseUrl = apiBaseUrl;
        if (!this.apiBaseUrl.endsWith("/")) this.apiBaseUrl += "/";

        if (paginationKey) this.paginationKey = paginationKey;
        if (customParamTag) this.customParamTag = customParamTag;

        if (username && password) {
            this.options.headers = {
                Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
            };
        }
    }

    protected async fetch(url: string): Promise<unknown> {
        return fetch(url, this.options)
            .then(async res => {
                try {
                    return await res.clone().json();
                } catch {
                    return await res.text();
                }
            })
            .catch(e => Promise.reject(e));
    }

    protected getUrl<N extends keyof API>(name: N): string {
        let url = this.apiBaseUrl;

        const path = this.pathMapping[name] || String(name);
        url += path.startsWith("/") ? path.slice(1) : path;

        return url;
    }

    protected finalizeUrl(url: string, params?: Record<string, string>): string {
        if (this.endingBackslash && !url.endsWith("/")) url += "/";
        const a = [...this.extraQueryParams, ...Object.entries(params || {})];
        if (a.length) url += `?${a.map(pair => `${pair[0]}=${pair[1]}`).join("&")}`;
        return url;
    }

    public getList<N extends ListableEndpoints<API>, FILTERS extends FilterType<API[N]>>(
        name: N,
        filters?: FILTERS
    ): Promise<ListType<API[N]>> {
        let url = this.getUrl(name);
        url = this.finalizeUrl(url, filters);
        return this.fetch(url).then((json: any) =>
            // eslint-disable-next-line
            this.paginated && this.paginated.includes(name) && this.paginationKey in json ? json[this.paginationKey] : json
        ) as any;
    }

    public getOne<N extends DetailableEndpoints<API>>(name: N, id: ParameterType<API[N]>): Promise<DetailedType<API[N]>> {
        let url = this.getUrl(name);
        if (url.includes(this.customParamTag)) {
            // eslint-disable-next-line
            url = url.replace(this.customParamTag, id.toString());
        } else {
            if (!url.endsWith("/")) url += "/";
            url += id;
        }
        url = this.finalizeUrl(url);
        return this.fetch(url) as any;
    }
}
