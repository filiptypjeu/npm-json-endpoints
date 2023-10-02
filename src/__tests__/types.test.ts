import { ListableEndpoints, DetailableEndpoints, FilterType, DetailedType, ParameterType, ListType } from "../index";

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
    extra: {
        list: { a: number };
        detail_append: { b: number };
    };
    param: {
        detail: { b: number };
        detail_parameter: string;
    };
    paginated: {
        list: { c: number };
        list_paginated: true;
    };
}

test("listable endpoints", () => {
    let listable: ListableEndpoints<MyAPI> = "listable";
    listable = "extra";
    // @ts-expect-error
    listable = "detailable";
    // @ts-expect-error
    listable = "invalid";
});

test("detailable endpoints", () => {
    let detailable: DetailableEndpoints<MyAPI> = "detailable";
    detailable = "extra";
    // @ts-expect-error
    detailable = "listable";
    // @ts-expect-error
    detailable = "invalid";
});

test("list type", () => {
    const listable: ListType<MyAPI["listable"]> = [{ a: 1 }];

    // @ts-expect-error
    const detailable: ListType<MyAPI["detailable"]> = [];

    // @ts-expect-error
    let paginated: ListType<MyAPI["paginated"]> = [];
    paginated = { count: 1, next: "string", previous: null, results: [{ c: 1 }] };
});

test("detailed type", () => {
    // @ts-expect-error
    const listable: DetailedType<MyAPI["listable"]> = { a: 1 };

    const detailable: DetailedType<MyAPI["detailable"]> = { a: 1 };

    let extra: DetailedType<MyAPI["extra"]> = { a: 1, b: 1 };
    // @ts-expect-error
    extra = { a: 1 };
    // @ts-expect-error
    extra = { b: 1 };
});

test("parameter type", () => {
    // @ts-expect-error
    const listable: ParameterType<MyAPI["listable"]> = 1;

    const detailable: ParameterType<MyAPI["detailable"]> = 1;

    const extra: ParameterType<MyAPI["extra"]> = 1;

    let param: ParameterType<MyAPI["param"]> = "1";
    // @ts-expect-error
    param = 1;
});

test("filter type", () => {
    let listable: FilterType<MyAPI["listable"]> = {};
    listable.a = 1;
    listable.b = "b";
    // @ts-expect-error
    listable.b = 1;
    // @ts-expect-error
    listable.invalid = 1;

    // @ts-expect-error
    let detailable: FilterType<MyAPI["detailable"]> = {};

    let extra: FilterType<MyAPI["extra"]> = {};
    // @ts-expect-error
    extra.a = 1;
});
