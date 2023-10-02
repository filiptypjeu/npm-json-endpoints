import { APIManager } from "../index";

interface API {
    posts: {
        list: { id: number; title: string };
        detail_append: {};
    };
}

const manager = new APIManager<API>({ apiBaseUrl: "https://my-json-server.typicode.com/typicode/demo" });

test("getList", async () => {
    expect(await manager.getList("posts")).toStrictEqual([
        {
            id: 1,
            title: "Post 1",
        },
        {
            id: 2,
            title: "Post 2",
        },
        {
            id: 3,
            title: "Post 3",
        },
    ]);
});

test("getOne", async () => {
    expect(await manager.getOne("posts", 1)).toStrictEqual({
        id: 1,
        title: "Post 1",
    });
});
