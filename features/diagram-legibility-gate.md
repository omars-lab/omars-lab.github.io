# Diagram legibility gate

## Why

A diagram exists to make an idea easier to grasp than prose. A diagram that is a tangle of
crossing lines does the opposite: it is worse than no diagram, because the reader spends
effort decoding the picture instead of the idea. The usual failure mode is silent: a tool
renders whatever spec you give it, however unreadable, and the mess only gets noticed (if
ever) by a human eyeballing the published page.

Our diagram components refuse to ship an unreadable layout. `FlowDiagram` computes, at build
time, how many of its edges cross each other, and if fewer than 75% are crossing-free it
**throws** rather than renders. A thrown error fails `docusaurus build`, so the tangle is
caught before it can reach a reader. The author fixes it by reordering nodes so the flow
reads without backtracking, or by splitting the diagram, or (deliberately, as an escape
hatch) by passing `allowOverlap` to downgrade the gate to a warning.

This is the same fail-closed discipline the rest of the repo uses: the safe outcome (a
readable diagram, or a loud failure) is the default, and the unsafe one (shipping a tangle)
requires explicit intent. `UseCaseDiagram` carries the same overlap gate plus a second one
(the actor line-angle balance gate), for the same reason.

## Code

- https://github.com/omars-lab/omars-lab.github.io/blob/b4ca9f734f4c018b728776ef25c857ba109a96ee/packages/blog-ui/src/components/FlowDiagram/layout.ts#L341-L362 - the FlowDiagram overlap gate: count crossing-free edges, throw below 75% unless allowOverlap

## Notes

The gate lives in the pure-TypeScript layout engine (`layout.ts`), not the React component,
so it is framework-agnostic and unit-testable in isolation. The crossing test is a standard
segment-intersection check that excludes shared endpoints (lines meeting at the same node do
not count as a crossing). Loop-shaped diagrams skip the test (their edges are curved and laid
out on a ring, so the straight-segment test does not apply).
