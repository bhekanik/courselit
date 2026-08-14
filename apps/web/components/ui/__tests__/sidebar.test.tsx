import { fireEvent, render, screen } from "@testing-library/react";

import {
    Sidebar,
    SidebarContent,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

jest.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => true,
}));

describe("mobile sidebar", () => {
    it("gives the navigation dialog an accessible name", () => {
        render(
            <SidebarProvider>
                <SidebarTrigger />
                <Sidebar>
                    <SidebarContent>Course lessons</SidebarContent>
                </Sidebar>
            </SidebarProvider>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

        const dialog = screen.getByRole("dialog", {
            name: "Sidebar navigation",
        });
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAccessibleDescription(
            "Navigate between sections and pages.",
        );
    });
});
