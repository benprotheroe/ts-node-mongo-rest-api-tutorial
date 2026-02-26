import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SignupPage from "@/app/signup/page";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe("SignupPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    (global.fetch as any) = jest.fn();
  });

  it("shows error when signup fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: "Unable to register user." }),
    });

    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "Ben" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Create account"));

    await waitFor(() => expect(screen.getByText("Unable to register user.")).toBeInTheDocument());
  });

  it("navigates to home on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "Ben" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Create account"));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("uses fallback error message when API omits message", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "Ben" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Create account"));

    await waitFor(() => expect(screen.getByText("Unable to register user.")).toBeInTheDocument());
  });
});
