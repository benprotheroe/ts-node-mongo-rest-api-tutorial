import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "@/app/layout";

describe("RootLayout", () => {
  it("exports metadata", () => {
    expect(metadata.title).toBe("30different");
  });

  it("renders navigation and children", () => {
    render(
      <RootLayout>
        <div>Child content</div>
      </RootLayout>
    );

    expect(screen.getByText("30different")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });
});
