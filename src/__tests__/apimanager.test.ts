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

test("getList check url", async () => {
    expect(await manager.getList("listable")).toBe("https://example.com/api/listable");
    expect(await manager.getList("")).toBe("https://example.com/api/");
    expect(await manager.getList("/")).toBe("https://example.com/api/");
    expect(await manager.getList("/path/")).toBe("https://example.com/api/path/");
});

test("getList with filters", async () => {
    // @ts-expect-error
    await manager.getList("listable", { a: "4" });
    // @ts-expect-error
    await manager.getList("listable", { b: 4 });
    // @ts-expect-error
    await manager.getList("listable", { c: 4 });

    expect(await manager.getList("listable", { a: 42 })).toBe("https://example.com/api/listable?a=42");
    expect(await manager.getList("listable", { b: "42" })).toBe("https://example.com/api/listable?b=42");
    expect(await manager.getList("listable", { b: "b", a: 69 })).toBe("https://example.com/api/listable?b=b&a=69");
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

test("getOne check url", async () => {
    expect(await manager.getOne("detailable", 1)).toBe("https://example.com/api/detailable/1");
    expect(await manager.getOne("", 1)).toBe("https://example.com/api/1");
    expect(await manager.getOne("/", 1)).toBe("https://example.com/api/1");
    expect(await manager.getOne("/path/", 1)).toBe("https://example.com/api/path/1");
});

test("getOne with custom parameter type", async () => {
    expect(await manager.getOne("custom_param_type", 42)).toBe("https://example.com/api/custom_param_type/42");
    expect(await manager.getOne("custom_param_type", "A")).toBe("https://example.com/api/custom_param_type/A");
    expect(await manager.getOne("custom_param_type", "B")).toBe("https://example.com/api/custom_param_type/B");

    // @ts-expect-error
    await manager.getOne("custom_param_type", 1);
    // @ts-expect-error
    await manager.getOne("custom_param_type", "a");
});

test("getOne with custom parameter path", async () => {
    expect(await manager.getOne("custom/$PARAM/path/", 42)).toBe("https://example.com/api/custom/42/path/");
});

test("ending backslash", async () => {
    const m = new MyManager({
        apiBaseUrl: "https://example.com/api",
        endingBackslash: true,
    });

    expect(await m.getList("listable")).toBe("https://example.com/api/listable/");
    expect(await m.getList("listable", { a: 42 })).toBe("https://example.com/api/listable/?a=42");
    expect(await m.getOne("detailable", 1)).toBe("https://example.com/api/detailable/1/");
    expect(await m.getOne("", 1)).toBe("https://example.com/api/1/");
    expect(await m.getOne("/", 1)).toBe("https://example.com/api/1/");
    expect(await m.getOne("/path/", 1)).toBe("https://example.com/api/path/1/");
});

test("extra query parameters", async () => {
    const m = new MyManager({
        apiBaseUrl: "https://example.com/api",
        extraQueryParams: [
            ["format", "json"],
            ["key", "value"],
        ],
    });

    expect(await m.getList("listable")).toBe("https://example.com/api/listable?format=json&key=value");
    expect(await m.getList("listable", { a: 42 })).toBe("https://example.com/api/listable?format=json&key=value&a=42");
    expect(await m.getOne("detailable", 1)).toBe("https://example.com/api/detailable/1?format=json&key=value");
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

    expect(await m.getList("listable")).toBe("https://example.com/api/");
    expect(await m.getOne("detailable", 1)).toBe("https://example.com/api/my/path/1");
});

test("custom param tag", async () => {
    const m = new MyManager({
        apiBaseUrl: "https://example.com/api",
        pathMapping: {
            "/": "my/$TEST/test/$TEST/again",
        },
        customParamTag: "$TEST",
    });

    expect(await m.getList("/")).toBe("https://example.com/api/my/$TEST/test/$TEST/again");
    expect(await m.getOne("/", 1)).toBe("https://example.com/api/my/1/test/$TEST/again");
});
