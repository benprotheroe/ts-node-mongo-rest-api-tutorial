import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

jest.mock("@/components/home-client", () => ({
  __esModule: true,
  default: () => <div>Mock Home Client</div>,
}));

describe("HomePage", () => {
  it("renders home client", () => {
    render(<HomePage />);
    expect(screen.getByText("Mock Home Client")).toBeInTheDocument();
  });
});
