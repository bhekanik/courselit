import React from "react";
import { render, screen } from "@testing-library/react";
import { LessonViewer } from "../index";

let courseCost = 0;
let courseIsPreview = false;
let lessonIsLocked = true;
let mockSearchParams = new URLSearchParams();
const originalFetch = global.fetch;

jest.mock("next/navigation", () => ({
    useSearchParams: () => mockSearchParams,
}));

jest.mock("next/link", () => {
    function MockLink({
        children,
        href,
        className,
    }: {
        children: React.ReactNode;
        href: string;
        className?: string;
    }) {
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    }

    return MockLink;
});

jest.mock("@components/contexts", () => {
    const React = require("react");

    return {
        ThemeContext: React.createContext({ theme: {} }),
    };
});

jest.mock("@courselit/components-library", () => ({
    Link: ({ children, href }: any) => <a href={href}>{children}</a>,
    Skeleton: () => null,
    useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@courselit/page-primitives", () => ({
    Button: ({ children, theme: _theme, ...props }: any) => (
        <button {...props}>{children}</button>
    ),
    Header1: ({ children }: any) => <h1>{children}</h1>,
    Text1: ({ children }: any) => <p>{children}</p>,
}));

jest.mock("@courselit/page-blocks", () => ({
    TextRenderer: () => null,
}));

jest.mock("@courselit/icons", () => ({
    ArrowLeft: () => null,
    ArrowRight: () => null,
    ArrowDownward: () => null,
}));

jest.mock("lucide-react", () => ({
    BookOpen: () => null,
    Check: () => null,
}));

jest.mock("../embed-viewer", () => () => null);
jest.mock("../quiz-viewer", () => () => null);
jest.mock("../scorm-viewer", () => () => null);
jest.mock(
    "../../base-layout/template/widget-error-boundary",
    () =>
        function MockErrorBoundary({
            children,
        }: {
            children: React.ReactNode;
        }) {
            return <>{children}</>;
        },
);

function graphResponse(query: string) {
    const course = {
        title: "Notes that do work",
        isPreview: courseIsPreview,
        ...(query.includes("cost") ? { cost: courseCost } : {}),
    };

    if (query.includes("getLessonDetails") && lessonIsLocked) {
        return {
            data: query.includes("getCourse") ? { course, lesson: null } : null,
            errors: [{ message: "You are not enrolled in the course" }],
        };
    }

    if (query.includes("getLessonDetails")) {
        return {
            data: {
                lesson: {
                    lessonId: "lesson-2",
                    title: "Give each note one job",
                    downloadable: false,
                    type: "TEXT",
                    content: { type: "doc", content: [] },
                    requiresEnrollment: true,
                    courseId: "course-1",
                    prevLesson: "lesson-1",
                    nextLesson: "lesson-3",
                },
            },
        };
    }

    return { data: { course } };
}

function renderLessonViewer(
    profile: React.ComponentProps<typeof LessonViewer>["profile"] = {
        userId: "learner-1",
        purchases: [],
    },
) {
    return render(
        <LessonViewer
            slug="notes-that-do-work"
            lessonId="lesson-2"
            productId="course-1"
            profile={profile}
            setProfile={jest.fn()}
            address={{
                backend: "https://courses.example.com",
                frontend: "https://courses.example.com",
            }}
        />,
    );
}

describe("LessonViewer locked course call to action", () => {
    beforeEach(() => {
        courseCost = 0;
        courseIsPreview = false;
        lessonIsLocked = true;
        mockSearchParams = new URLSearchParams();
        global.fetch = jest.fn(async (_, init) => {
            const body = JSON.parse(String(init?.body));
            const payload = body.query;
            const query = typeof payload === "string" ? payload : payload.query;

            return {
                status: 200,
                json: async () => graphResponse(query),
            } as Response;
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("offers enrollment instead of purchase when a free lesson is locked", async () => {
        renderLessonViewer();

        expect(
            await screen.findByRole("link", {
                name: "Start the free course",
            }),
        ).toHaveAttribute("href", "/checkout?type=course&id=course-1");
        expect(
            screen.queryByRole("link", { name: "Buy now" }),
        ).not.toBeInTheDocument();
    });

    it("keeps the purchase call to action when a paid lesson is locked", async () => {
        courseCost = 49;
        renderLessonViewer();

        expect(
            await screen.findByRole("link", { name: "Buy now" }),
        ).toHaveAttribute("href", "/checkout?type=course&id=course-1");
        expect(
            screen.queryByRole("link", { name: "Start the free course" }),
        ).not.toBeInTheDocument();
    });

    it("keeps enrolled lesson rendering and progress controls", async () => {
        lessonIsLocked = false;
        renderLessonViewer({
            userId: "learner-1",
            purchases: [
                {
                    courseId: "course-1",
                    completedLessons: [],
                    accessibleGroups: [],
                },
            ],
        });

        expect(
            await screen.findByRole("heading", {
                name: "Give each note one job",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Mark as completed" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Start the free course" }),
        ).not.toBeInTheDocument();
    });

    it("keeps preview lessons available without enrollment controls", async () => {
        lessonIsLocked = false;
        courseIsPreview = true;
        mockSearchParams = new URLSearchParams("preview=true");
        renderLessonViewer();

        expect(
            await screen.findByRole("heading", {
                name: "Give each note one job",
            }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Mark as completed" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Start the free course" }),
        ).not.toBeInTheDocument();
    });
});
