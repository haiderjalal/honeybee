import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HoneycombWall } from "@/features/honeycomb/HoneycombWall";

describe("HoneycombWall", () => {
  // Vitest globals are off, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  it("draws one cell per member, with the name written in it", () => {
    const { container } = render(
      <HoneycombWall
        entries={[
          { id: "1", displayName: "Saba B.", joinedOn: "1 Nov 2026" },
          { id: "2", displayName: "Faizan", joinedOn: "2 Nov 2026" },
          { id: "3", displayName: "Abdul R.", joinedOn: "3 Nov 2026" },
        ]}
      />,
    );

    // Three member cells plus the invitation cell.
    expect(container.querySelectorAll("polygon")).toHaveLength(4);
    expect(container.textContent).toContain("Saba");
    expect(container.textContent).toContain("Faizan");
    expect(container.textContent).toContain("Saba B. joined the honeycomb family on 1 Nov 2026");
    expect(screen.getByText("Your cell")).toBeTruthy();
  });

  it("invites the first member when the honeycomb is empty", () => {
    const { container } = render(<HoneycombWall entries={[]} />);

    expect(container.querySelectorAll("polygon")).toHaveLength(1);
    expect(screen.getByText(/waiting for its first member/)).toBeTruthy();
  });

  it("links to the order request so a visitor can ask to join", () => {
    render(<HoneycombWall entries={[]} />);
    expect(screen.getByRole("link", { name: "Send your order request" }).getAttribute("href")).toBe("/checkout");
  });
});
