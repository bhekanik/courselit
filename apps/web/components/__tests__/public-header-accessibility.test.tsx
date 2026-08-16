import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
    Constants,
    type Profile,
    type WidgetProps,
} from "@courselit/common-models";

import type Settings from "../../../../packages/page-blocks/src/blocks/header/settings";
import Widget from "../../../../packages/page-blocks/src/blocks/header/widget";
import { classic } from "../../../../packages/page-primitives/src/themes/classic";

jest.mock("next/navigation", () => ({
    usePathname: () => "/",
}));

jest.mock("@/lib/utils", () => ({
    cn: (...classes: Array<string | undefined>) =>
        classes.filter(Boolean).join(" "),
}));

jest.mock("@courselit/components-library", () => ({
    Image: ({ src, alt }: { src: string; alt: string }) => (
        <img src={src} alt={alt} />
    ),
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    Menu: ({
        trigger,
        children,
    }: {
        trigger: ReactNode;
        children: ReactNode;
    }) => (
        <div>
            {trigger}
            {children}
        </div>
    ),
    MenuItem2: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Button2: ({ children, ...props }: React.ComponentProps<"button">) => (
        <button {...props}>{children}</button>
    ),
}));

const profile = {
    userId: "user-1",
    fetched: true,
    purchases: [],
    email: "learner@example.com",
    permissions: [],
    subscribedToUpdates: false,
    avatar: {},
} satisfies Profile;

const settings = {
    type: Constants.PageType.SITE,
    verticalPadding: "py-4",
    links: [],
    linkAlignment: "right",
    showLoginControl: true,
    linkFontWeight: "font-bold",
    spacingBetweenLinks: 16,
    layout: "fixed",
} satisfies Settings;

function renderHeader() {
    const props = {
        id: "header",
        name: "header",
        pageData: { pageType: Constants.PageType.SITE },
        state: {
            auth: { guest: true, checked: true },
            siteinfo: {
                title: "AI Work School",
                logo: { file: "/logo.png", caption: "" },
            },
            networkAction: false,
            profile,
            address: {
                backend: "https://school.example",
                frontend: "https://school.example",
            },
            theme: classic,
            typefaces: [],
            message: { message: "", open: false, action: null },
            config: {
                turnstileSiteKey: "",
                queueServer: "",
                cacheEnabled: false,
            },
        },
        settings,
        editing: false,
        toggleTheme: jest.fn(),
        nextTheme: "light",
    } satisfies WidgetProps<Settings>;

    return render(<Widget {...props} />);
}

describe("public header accessibility", () => {
    it("names its icon controls and gives the mobile drawer dialog semantics", () => {
        renderHeader();

        expect(
            screen.getByRole("button", { name: "Switch to light theme" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Open account menu" }),
        ).toBeInTheDocument();

        const navigation = screen.getByRole("button", {
            name: "Toggle Menu",
        });
        expect(navigation).toHaveAttribute("aria-haspopup", "dialog");

        fireEvent.click(navigation);

        const dialog = screen.getByRole("dialog", {
            name: "AI Work School navigation",
        });
        expect(dialog).toHaveAccessibleDescription(
            "Navigate the site and account pages.",
        );
        expect(dialog.querySelector("img")).toHaveAttribute("alt", "");
        expect(
            Array.from(dialog.querySelector("ul")?.children || []).every(
                (child) => child.tagName === "LI",
            ),
        ).toBe(true);
    });
});
