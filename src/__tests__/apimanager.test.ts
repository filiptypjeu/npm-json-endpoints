import { APIManager } from "../index";

interface MyAPI {
    listable: {
        list: { a: number };
        list_filters: {
            a: number;
            b: string;
        };
    };
    detailable: {
        detail: { a: number };
    };
    "": {
        list: {};
        detail: {};
    };
    "/": {
        list: {};
        detail: {};
    };
    "/path/": {
        list: {};
        detail: {};
    };
    custom_param_type: {
        detail: {};
        detail_parameter: "A" | "B" | 42;
    };
    "custom/$PARAM/path/": {
        detail: {};
    };
    paginated: {
        list: {};
        list_paginated: true;
    };
}

class MyManager extends APIManager<MyAPI> {
    // Mock the fetch method to just return the url
    protected override async fetch(url: string): Promise<string> {
        return url;
    }
}

const manager = new MyManager({ apiBaseUrl: "https://example.com/api" });

test("api base url", async () => {
    expect(manager.apiBaseUrl.toString()).toBe("https://example.com/api/");
});

test("getList check endpoint name", async () => {
    await manager.getList("listable");
    await manager.getList("");
    await manager.getList("/");
    await manager.getList("/path/");

    // @ts-expect-error
    await manager.getList("detailable");
    // @ts-expect-error
    await manager.getList("invalid");
});

test("getListUrl", async () => {
    expect(manager.getListUrl("listable")).toBe("https://example.com/api/listable");
    expect(manager.getListUrl("")).toBe("https://example.com/api/");
    expect(manager.getListUrl("/")).toBe("https://example.com/api/");
    expect(manager.getListUrl("/path/")).toBe("https://example.com/api/path/");
});

test("getListUrl with filters", async () => {
    // @ts-expect-error
    manager.getListUrl("listable", { a: "4" });
    // @ts-expect-error
    manager.getListUrl("listable", { b: 4 });
    // @ts-expect-error
    manager.getListUrl("listable", { c: 4 });

    expect(manager.getListUrl("listable", { a: 42 })).toBe("https://example.com/api/listable?a=42");
    expect(manager.getListUrl("listable", { b: "42" })).toBe("https://example.com/api/listable?b=42");
    expect(manager.getListUrl("listable", { b: "b", a: 69 })).toBe("https://example.com/api/listable?b=b&a=69");
});

test("getList with pagination", async () => {
    const result = await manager.getList("paginated");

    result.count;
    result.next;
    result.previous;
    result.results;

    expect(result).toBe("https://example.com/api/paginated");
});

test("getOne check endpoint name", async () => {
    await manager.getOne("detailable", 1);
    await manager.getOne("", 1);
    await manager.getOne("/", 1);
    await manager.getOne("/path/", 1);

    // @ts-expect-error
    await manager.getOne("listable", 1);
    // @ts-expect-error
    await manager.getOne("invalid", 1);
});

test("getOneUrl", async () => {
    expect(manager.getOneUrl("detailable", 1)).toBe("https://example.com/api/detailable/1");
    expect(manager.getOneUrl("", 1)).toBe("https://example.com/api/1");
    expect(manager.getOneUrl("/", 1)).toBe("https://example.com/api/1");
    expect(manager.getOneUrl("/path/", 1)).toBe("https://example.com/api/path/1");
});

test("getOneUrl with custom parameter type", async () => {
    expect(manager.getOneUrl("custom_param_type", 42)).toBe("https://example.com/api/custom_param_type/42");
    expect(manager.getOneUrl("custom_param_type", "A")).toBe("https://example.com/api/custom_param_type/A");
    expect(manager.getOneUrl("custom_param_type", "B")).toBe("https://example.com/api/custom_param_type/B");

    // @ts-expect-error
    await manager.getOne("custom_param_type", 1);
    // @ts-expect-error
    await manager.getOne("custom_param_type", "a");
});

test("getOneUrl with custom parameter path", async () => {
    expect(manager.getOneUrl("custom/$PARAM/path/", 42)).toBe("https://example.com/api/custom/42/path/");
});

test("ending backslash", async () => {
    const m = new MyManager({
        apiBaseUrl: "https://example.com/api",
        endingBackslash: true,
    });

    expect(m.getListUrl("listable")).toBe("https://example.com/api/listable/");
    expect(m.getListUrl("listable", { a: 42 })).toBe("https://example.com/api/listable/?a=42");
    expect(m.getOneUrl("detailable", 1)).toBe("https://example.com/api/detailable/1/");
    expect(m.getOneUrl("", 1)).toBe("https://example.com/api/1/");
    expect(m.getOneUrl("/", 1)).toBe("https://example.com/api/1/");
    expect(m.getOneUrl("/path/", 1)).toBe("https://example.com/api/path/1/");
});

test("extra query parameters", async () => {
    const m = new MyManager({
        apiBaseUrl: "https://example.com/api",
        extraQueryParams: [
            ["format", "json"],
            ["key", "value"],
        ],
    });

    expect(m.getListUrl("listable")).toBe("https://example.com/api/listable?format=json&key=value");
    expect(m.getListUrl("listable", { a: 42 })).toBe("https://example.com/api/listable?format=json&key=value&a=42");
    expect(m.getOneUrl("detailable", 1)).toBe("https://example.com/api/detailable/1?format=json&key=value");
});

test("path mapping", async () => {
    new MyManager({
        apiBaseUrl: "https://example.com/api",
        // @ts-expect-error
        pathMapping: { invalid: "my/path" },
    });

    const m = new MyManager({
        apiBaseUrl: "https://example.com/api/",
        pathMapping: {
            listable: "/",
            detailable: "/my/path/",
        },
    });

    expect(m.getListUrl("listable")).toBe("https://example.com/api/");
    expect(m.getOneUrl("detailable", 1)).toBe("https://example.com/api/my/path/1");
});

test("custom param tag", async () => {
    const m = new MyManager({
        apiBaseUrl: "https://example.com/api",
        pathMapping: {
            "/": "my/$TEST/test/$TEST/again",
        },
        customParamTag: "$TEST",
    });

    expect(m.getListUrl("/")).toBe("https://example.com/api/my/$TEST/test/$TEST/again");
    expect(m.getOneUrl("/", 1)).toBe("https://example.com/api/my/1/test/$TEST/again");
});
