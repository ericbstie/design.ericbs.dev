import { test, expect } from "bun:test";
import { signedDistance, surfacePoint, perimeter, outlinePath } from "./cursor";


const box = { cx: 100, cy: 100, hw: 60, hh: 25, r: 20 };


test("signedDistance is negative inside, positive outside, ~0 on the edge", () => {
  expect(signedDistance(box, 100, 100)).toBe(-25);
  expect(signedDistance(box, 180, 100)).toBe(20);
  expect(signedDistance(box, 160, 100)).toBeCloseTo(0, 5);
});

test("surfacePoint outside returns nearest edge point with outward normal", () => {
  const sp = surfacePoint(box, 180, 100);

  expect(sp.x).toBeCloseTo(160, 5);
  expect(sp.y).toBeCloseTo(100, 5);
  expect(sp.nx).toBeCloseTo(1, 5);
  expect(sp.ny).toBeCloseTo(0, 5);
});

test("surfacePoint deep inside picks the nearest wall", () => {
  const sp = surfacePoint(box, 100, 90);

  expect(sp.y).toBeCloseTo(75, 5);
  expect(sp.ny).toBeCloseTo(-1, 5);
});

test("perimeter covers the outline with finite points", () => {
  const pts = perimeter(box);

  expect(pts.length).toBeGreaterThan(30);
  expect(pts.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
});

test("outlinePath emits a closed path", () => {
  const d = outlinePath(box);

  expect(d.startsWith("M")).toBe(true);
  expect(d.endsWith("Z")).toBe(true);
  expect(d.includes("NaN")).toBe(false);
});

test("pill-shaped box (r = hh) produces a valid path", () => {
  const pill = { cx: 100, cy: 100, hw: 60, hh: 22, r: 22 };
  expect(outlinePath(pill).includes("NaN")).toBe(false);
});
