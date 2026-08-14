import type { ChangeEvent, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
    Constants,
    type Profile,
    type WidgetProps,
} from "@courselit/common-models";

import AdminWidget from "../../../../packages/page-blocks/src/blocks/hero/admin-widget";
import type Settings from "../../../../packages/page-blocks/src/blocks/hero/settings";
import Widget from "../../../../packages/page-blocks/src/blocks/hero/widget";
import { classic } from "../../../../packages/page-primitives/src/themes/classic";

jest.mock("@courselit/components-library", () => ({
    Image: ({ src, alt }: { src: string; alt: string }) => (
        <img src={src} alt={alt} />
    ),
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    AdminWidgetPanel: ({ children }: { children: ReactNode }) => (
        <section>{children}</section>
    ),
    AdminWidgetPanelContainer: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    MediaSelector: () => null,
    Select: ({
        title,
        value,
        options,
        onChange,
    }: {
        title: string;
        value: string;
        options: { label: string; value: string }[];
        onChange: (value: string) => void;
    }) => (
        <label>
            {title}
            <select
                aria-label={title}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    ),
    Form: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    FormField: ({
        label,
        value,
        onChange,
    }: {
        label: string;
        value?: string;
        onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    }) => <input aria-label={label} value={value || ""} onChange={onChange} />,
    Accordion: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    AccordionItem: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    AccordionTrigger: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    AccordionContent: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    PageBuilderSlider: () => null,
    PageBuilderPropertyHeader: () => null,
    CssIdField: () => null,
    Checkbox: () => null,
    VerticalPaddingSelector: () => null,
    MaxWidthSelector: () => null,
    SectionBackgroundPanel: () => null,
}));

jest.mock("@courselit/page-primitives", () => ({
    Button: ({ children }: { children: ReactNode }) => (
        <button>{children}</button>
    ),
    Header1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
    Subheader1: ({ children }: { children: ReactNode }) => (
        <span>{children}</span>
    ),
    Section: ({ children }: { children: ReactNode }) => (
        <section>{children}</section>
    ),
    PageCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    PageCardContent: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
}));

jest.mock("@courselit/utils", () => ({
    isVideo: () => false,
}));

jest.mock("../../../../packages/page-blocks/src/components", () => ({
    TextRenderer: () => <span>Course description</span>,
    VideoWithPreview: () => null,
}));

jest.mock("@courselit/text-editor", () => ({
    Editor: () => null,
}));

const baseSettings = {
    type: Constants.PageType.SITE,
    verticalPadding: "py-16",
    title: "Do one real job with AI",
    description: { type: "doc", content: [] },
    buttonCaption: "Start the course — free",
    buttonAction: "/course/ai-for-actual-work",
    media: {
        mediaId: "media-hero",
        originalFileName: "hero.webp",
        mimeType: "image/webp",
        size: 1200,
        access: Constants.MediaAccessType.PUBLIC,
        thumbnail: "https://media.example/hero-thumb.webp",
        file: "https://media.example/hero.webp",
        caption: "Colleagues reviewing work at a table",
    },
    alignment: "right",
} satisfies Settings;

const profile = {
    userId: "user-1",
    fetched: true,
    purchases: [],
    email: "learner@example.com",
    permissions: [],
    subscribedToUpdates: false,
    avatar: {},
} satisfies Profile;

function renderHero(settings: Settings) {
    const props = {
        id: "hero",
        name: "hero",
        pageData: { pageType: Constants.PageType.SITE },
        state: {
            auth: { guest: true, checked: true },
            siteinfo: {},
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
        nextTheme: undefined,
    } satisfies WidgetProps<Settings>;

    return render(<Widget {...props} />);
}

describe("Hero media reading order", () => {
    it("keeps media before content when mobile media placement is omitted", () => {
        const { container } = renderHero(baseSettings);

        const heading = screen.getByRole("heading", {
            name: "Do one real job with AI",
        });
        const media = screen.getByRole("img", {
            name: "Colleagues reviewing work at a table",
        });
        const action = screen.getByRole("link", {
            name: "Start the course — free",
        });

        expect(media.compareDocumentPosition(heading)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(media.compareDocumentPosition(action)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(container.querySelector("section > div")).toHaveClass(
            "md:!flex-row-reverse",
        );
    });

    it("renders content before media when mobile media placement is after content", () => {
        const { container } = renderHero({
            ...baseSettings,
            mobileMediaPlacement: "after-content",
        });

        const heading = screen.getByRole("heading", {
            name: "Do one real job with AI",
        });
        const media = screen.getByRole("img", {
            name: "Colleagues reviewing work at a table",
        });
        const action = screen.getByRole("link", {
            name: "Start the course — free",
        });

        expect(heading.compareDocumentPosition(media)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(action.compareDocumentPosition(media)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(container.querySelector("section > div")).toHaveClass(
            "md:!flex-row",
        );
    });
});

describe("Hero media placement setting", () => {
    it("preserves and updates the mobile media placement in the editor", async () => {
        const onChange = jest.fn();

        render(
            <AdminWidget
                name="hero"
                settings={{
                    ...baseSettings,
                    mobileMediaPlacement: "after-content",
                }}
                onChange={onChange}
                address={{
                    backend: "https://school.example",
                    frontend: "https://school.example",
                }}
                networkAction={false}
                profile={profile}
                theme={classic}
            />,
        );

        const placement = screen.getByLabelText("Mobile media placement");
        expect(placement).toHaveValue("after-content");
        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    mobileMediaPlacement: "after-content",
                }),
            ),
        );

        fireEvent.change(placement, { target: { value: "before-content" } });

        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    mobileMediaPlacement: "before-content",
                }),
            ),
        );
    });
});
