import RootLayout from "../../app/layout";

jest.mock("next/headers", () => ({
    headers: Promise.resolve(new Headers()),
}));

jest.mock("@/app/actions", () => ({
    getAddressFromHeaders: jest.fn().mockResolvedValue({
        frontend: "https://school.example",
        backend: "https://school.example",
    }),
}));

jest.mock("@ui-lib/utils", () => ({
    getSiteInfo: jest.fn().mockResolvedValue({
        title: "AI Work School",
        subtitle: "Learn through real work",
    }),
    getFullSiteSetup: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/theme-styles", () => ({
    generateThemeStyles: jest.fn().mockReturnValue(""),
}));

jest.mock(
    "@/lib/fonts",
    () =>
        new Proxy(
            {},
            {
                get: () => ({ variable: "", className: "" }),
            },
        ),
);

describe("root document accessibility", () => {
    it("declares the document language", async () => {
        const document = await RootLayout({ children: <main /> });

        expect(document.props.lang).toBe("en");
    });
});
