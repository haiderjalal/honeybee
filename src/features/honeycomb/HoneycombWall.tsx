import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ROUTES } from "@/constants/routes";

import { fitHoneycombName, hexagonPoints, layoutHoneycomb, HEX_RADIUS } from "./honeycombLayout";

import type { JSX } from "react";

export interface HoneycombCellView {
  id: string;
  /** The name as shown publicly, for example "Saba B.". */
  displayName: string;
  /** The date the order joined, already formatted for display. */
  joinedOn: string;
}

interface HoneycombWallProps {
  entries: readonly HoneycombCellView[];
}

/** Splits "Saba B." into a first line and a second line, so each one fits inside a cell. */
function splitForCell(displayName: string): [string, string | null] {
  const [first, ...rest] = displayName.split(" ");
  return [fitHoneycombName(first, 9), rest.length > 0 ? fitHoneycombName(rest.join(" "), 9) : null];
}

/**
 * The public honeycomb of agreed orders. Each order is one cell, and the last cell invites the next customer to join.
 * Cells appear only for customers who have agreed to be shown, and the wall grows as more join.
 */
export function HoneycombWall({ entries }: HoneycombWallProps): JSX.Element {
  const layout = layoutHoneycomb(entries.length + 1);
  const memberCount = entries.length;
  const invitationCell = layout.cells[entries.length];

  return (
    <section id="honeycomb" aria-labelledby="honeycomb-title" className="py-24">
      <Container className="max-w-5xl">
        <SectionHeading
          id="honeycomb-title"
          eyebrow="The family"
          title="Our honeycomb family"
          description="Every customer who joins the family adds a cell to our honeycomb. Be part of it."
        />

        <div className="mt-12 overflow-x-auto rounded-3xl border border-cream-50/10 bg-forest-900/50 p-4 sm:p-8">
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="img"
            aria-label={`Our honeycomb family, ${memberCount} ${memberCount === 1 ? "member" : "members"}`}
            className="mx-auto h-auto w-full max-w-3xl min-w-[480px]"
          >
            {entries.map((entry, index) => {
              const cell = layout.cells[index];
              const [firstLine, secondLine] = splitForCell(entry.displayName);
              return (
                <g key={entry.id}>
                  <title>{`${entry.displayName} joined the honeycomb family on ${entry.joinedOn}`}</title>
                  <polygon
                    points={hexagonPoints(cell.cx, cell.cy)}
                    className="fill-gold-400/80 stroke-gold-200"
                    strokeWidth={2}
                  />
                  <text
                    x={cell.cx}
                    y={secondLine ? cell.cy - 2 : cell.cy + 4}
                    textAnchor="middle"
                    className="fill-forest-950 font-display"
                    fontSize={HEX_RADIUS * 0.3}
                  >
                    {firstLine}
                  </text>
                  {secondLine ? (
                    <text
                      x={cell.cx}
                      y={cell.cy + 14}
                      textAnchor="middle"
                      className="fill-forest-950"
                      fontSize={HEX_RADIUS * 0.27}
                    >
                      {secondLine}
                    </text>
                  ) : null}
                </g>
              );
            })}

            <g>
              <title>Your cell in the honeycomb family</title>
              <polygon
                points={hexagonPoints(invitationCell.cx, invitationCell.cy)}
                className="fill-transparent stroke-gold-300"
                strokeWidth={2}
                strokeDasharray="6 5"
              />
              <text
                x={invitationCell.cx}
                y={invitationCell.cy - 2}
                textAnchor="middle"
                className="fill-gold-300 font-display"
                fontSize={HEX_RADIUS * 0.3}
              >
                Your cell
              </text>
              <text
                x={invitationCell.cx}
                y={invitationCell.cy + 14}
                textAnchor="middle"
                className="fill-cream-300"
                fontSize={HEX_RADIUS * 0.25}
              >
                Join us
              </text>
            </g>
          </svg>
        </div>

        <p className="mt-8 text-center text-cream-300">
          {memberCount === 0
            ? "The honeycomb is waiting for its first member. Order with us and ask to join the family."
            : "Order with us and ask to join the family. We add your first name to the honeycomb once you agree."}{" "}
          <Link href={ROUTES.checkout} className="text-gold-300 underline underline-offset-4 hover:text-gold-200">
            Send your order request
          </Link>
        </p>
      </Container>
    </section>
  );
}
