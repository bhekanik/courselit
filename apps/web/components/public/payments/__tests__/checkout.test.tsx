import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    Constants,
    UIConstants,
    type PaymentPlan,
} from "@courselit/common-models";

const mockLoadStripe = jest.fn();
const mockFetchExec = jest.fn();
const mockRouterReplace = jest.fn();
const mockToast = jest.fn();

jest.mock("@stripe/stripe-js", () => ({
    loadStripe: (key: string) => mockLoadStripe(key),
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mockRouterReplace }),
}));

jest.mock("next/script", () => () => null);

jest.mock("@components/contexts", () => {
    const React = require("react");

    return {
        AddressContext: React.createContext({
            backend: "https://example.com",
            frontend: "https://example.com",
        }),
        ProfileContext: React.createContext({
            profile: { email: "learner@example.com", name: "Learner" },
        }),
        SiteInfoContext: React.createContext({
            currencyISOCode: "USD",
            paymentMethod: "stripe",
            stripeKey: "",
        }),
        ThemeContext: React.createContext({ theme: { theme: {} } }),
    };
});

jest.mock("@courselit/components-library", () => ({
    getSymbolFromCurrency: () => "$",
    useToast: () => ({ toast: mockToast }),
}));

jest.mock("@courselit/utils", () => ({
    FetchBuilder: class {
        setUrl() {
            return this;
        }

        setHeaders() {
            return this;
        }

        setIsGraphQLEndpoint() {
            return this;
        }

        setPayload() {
            return this;
        }

        build() {
            return { exec: mockFetchExec };
        }
    },
}));

jest.mock("@courselit/page-primitives", () => ({
    Button: ({
        children,
        ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button {...props}>{children}</button>
    ),
    Header3: ({ children }: { children: ReactNode }) => <h3>{children}</h3>,
    Text1: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

jest.mock("@/components/ui/radio-group", () => ({
    RadioGroup: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
}));

jest.mock("../login-form", () => ({
    LoginForm: () => null,
}));

jest.mock("../payment-plan-card", () => ({
    PaymentPlanCard: ({ plan }: { plan: { name: string } }) => (
        <div>{plan.name}</div>
    ),
}));

jest.mock("../order-summary", () => ({
    MobileOrderSummary: () => null,
    DesktopOrderSummary: () => null,
}));

import Checkout from "../checkout";
import { SiteInfoContext } from "@components/contexts";

const freePlan: PaymentPlan = {
    planId: "free-plan",
    name: "AI for actual work — Free",
    type: Constants.PaymentPlanType.FREE,
    entityId: "course-1",
    entityType: Constants.MembershipEntityType.COURSE,
};

const paidPlan: PaymentPlan = {
    planId: "paid-plan",
    name: "AI for actual work",
    type: Constants.PaymentPlanType.ONE_TIME,
    entityId: "course-1",
    entityType: Constants.MembershipEntityType.COURSE,
    oneTimeAmount: 20,
};

function renderCheckout(plan: PaymentPlan, stripeKey = "") {
    return render(
        <SiteInfoContext.Provider
            value={{
                currencyISOCode: "USD",
                paymentMethod: UIConstants.PAYMENT_METHOD_STRIPE,
                stripeKey,
            }}
        >
            <Checkout
                product={{
                    id: "course-1",
                    name: "AI for actual work",
                    type: Constants.MembershipEntityType.COURSE,
                    slug: "ai-for-actual-work",
                    defaultPaymentPlanId: plan.planId,
                }}
                paymentPlans={[plan]}
                includedProducts={[]}
            />
        </SiteInfoContext.Provider>,
    );
}

async function submitCheckout() {
    const submit = screen.getByRole("button", { name: "Complete Purchase" });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);
}

describe("Checkout", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLoadStripe.mockImplementation(() => {
            throw new Error("Stripe should not be initialized for a free plan");
        });
    });

    it("renders a free checkout when Stripe is not configured", () => {
        renderCheckout(freePlan);

        expect(
            screen.getByText("AI for actual work — Free"),
        ).toBeInTheDocument();
    });

    it("completes a free checkout without loading Stripe", async () => {
        mockFetchExec.mockResolvedValue({ status: "success" });
        renderCheckout(freePlan);

        await submitCheckout();

        await waitFor(() =>
            expect(mockRouterReplace).toHaveBeenCalledWith(
                "/course/ai-for-actual-work/course-1?success=true",
            ),
        );
        expect(mockLoadStripe).not.toHaveBeenCalled();
    });

    it("loads Stripe for an initiated paid checkout", async () => {
        const redirectToCheckout = jest.fn().mockResolvedValue({});
        mockLoadStripe.mockResolvedValue({ redirectToCheckout });
        mockFetchExec.mockResolvedValue({
            status: "initiated",
            paymentTracker: "stripe-session-1",
        });
        renderCheckout(paidPlan, "pk_test_example");

        await submitCheckout();

        await waitFor(() =>
            expect(redirectToCheckout).toHaveBeenCalledWith({
                sessionId: "stripe-session-1",
            }),
        );
        expect(mockLoadStripe).toHaveBeenCalledWith("pk_test_example");
    });

    it("reports a missing Stripe key and re-enables submission", async () => {
        mockFetchExec.mockResolvedValue({
            status: "initiated",
            paymentTracker: "stripe-session-1",
        });
        renderCheckout(paidPlan);

        await submitCheckout();

        await waitFor(() =>
            expect(mockToast).toHaveBeenCalledWith({
                title: "Error",
                description: "Stripe is not configured",
                variant: "destructive",
            }),
        );
        expect(mockLoadStripe).not.toHaveBeenCalled();
        expect(mockRouterReplace).not.toHaveBeenCalled();
        expect(
            screen.getByRole("button", { name: "Complete Purchase" }),
        ).toBeEnabled();
    });
});
