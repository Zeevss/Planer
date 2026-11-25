import { useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";

export function Art({ kind }: { kind: "land" | "book" | "sprig" }) {
  const ref = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const svg = ref.current!;
    svg.replaceChildren();
    const rc = rough.svg(svg);
    let seed = 3;
    const ink = "#52634f";
    function path(
      d: string,
      fill = "none",
      stroke = ink,
      width = 1.4,
      extra: Options = {},
    ) {
      svg.append(
        rc.path(d, {
          seed: ++seed,
          fill,
          stroke,
          strokeWidth: width,
          roughness: 0.65,
          bowing: 0.6,
          fillStyle: "solid",
          disableMultiStroke: true,
          ...extra,
        }),
      );
    }
    function line(
      x: number,
      y: number,
      x2: number,
      y2: number,
      stroke = ink,
      w = 1.1,
    ) {
      path("M" + x + " " + y + " L" + x2 + " " + y2, "none", stroke, w);
    }
    if (kind === "land") {
      const hill = (d: string, fill: string) => path(d, fill, ink, 1.35);
      svg.append(
        rc.circle(318, 45, 54, {
          seed: 18,
          stroke: "#b9804d",
          fill: "#e5b471",
          fillStyle: "hachure",
          hachureGap: 2.5,
          fillWeight: 1.35,
          strokeWidth: 1.4,
          roughness: 0.85,
        }),
      );
      for (let i = 0; i < 14; i++) {
        const a = (2 * Math.PI * i) / 14;
        line(
          318 + Math.cos(a) * 33,
          45 + Math.sin(a) * 33,
          318 + Math.cos(a) * (37 + (i % 3)),
          45 + Math.sin(a) * (37 + (i % 3)),
          "#c18d53",
        );
      }
      hill(
        "M-24 140 Q48 97 91 104 C145 101 162 78 217 68 Q245 58 274 72 C329 91 364 61 416 57 Q475 48 525 61 L535 190 L-20 190Z",
        "#d8debd",
      );
      hill(
        "M-22 155 C56 129 79 143 140 117 S223 75 274 88 C354 111 397 75 519 97 L537 190 L-20 190Z",
        "#becaa5",
      );
      for (let n = 0; n < 11; n++)
        path(
          "M" +
            (40 + n * 4) +
            " " +
            (133 + (n % 2)) +
            " Q" +
            (119 + n * 2) +
            " " +
            (131 - n * 0.65) +
            " " +
            (160 + n * 3) +
            " " +
            (102 + n * 0.7),
          "none",
          "#8e9b78",
          0.65,
        );
      const tree = (x: number, y: number, h: number) => {
        line(x, y, x + 1, y - h, "#4e644d", 1);
        for (let j = 1; j < 9; j++) {
          const cy = y - h + (h * j) / 10,
            w = h * (0.026 + j * 0.016);
          path(
            "M" +
              (x - w) +
              " " +
              (cy + h * 0.09) +
              " Q" +
              x +
              " " +
              cy +
              " " +
              x +
              " " +
              (cy - h * 0.085) +
              " Q" +
              (x + w * 0.3) +
              " " +
              cy +
              " " +
              (x + w) +
              " " +
              (cy + h * 0.055),
            "none",
            "#50664e",
            1.2,
          );
        }
      };
      for (let i = 0; i < 24; i++) {
        const x = 312 + i * 8;
        tree(x, 100 - Math.sin(i * 0.22) * 8, 12 + Math.sin(i * 13) * 6);
      }
      hill(
        "M-20 170 C66 165 129 124 212 122 S346 165 421 134 Q476 109 533 124 L533 190 L-20 190Z",
        "#acbc94",
      );
      for (let i = 0; i < 13; i++)
        path(
          "M" +
            (17 + i * 9) +
            " 181 Q" +
            (143 + i * 3) +
            " " +
            (125 + i * 1.2) +
            " " +
            (207 + i * 6) +
            " " +
            (126 + i * 1.4),
          "none",
          "#7c906c",
          0.8,
        );
      path("M278 91l15 -12 20 10 -1 15 -32 -1Z", "#eee8ce");
      path("M274 93l18 -17 22 11 4 6 -25 -8 -14 11Z", "#6a7561");
      line(293, 85, 293, 104);
      path("M300 103v-9l6 2v8", "#67715f");
      line(309, 85, 309, 76);
      line(312, 86, 312, 77);
      path(
        "M304 105 C295 113 261 112 266 120 Q279 127 251 136 Q234 142 209 144",
        "none",
        "#e7e3c8",
        4,
      );
      for (const [x, y, h] of [
        [368, 142, 55],
        [384, 137, 42],
        [349, 145, 32],
        [448, 129, 45],
        [466, 126, 65],
        [484, 127, 39],
        [494, 130, 22],
      ])
        tree(x, y, h);
      for (let i = 0; i < 70; i++) {
        const x = (i * 77) % 520,
          y = 151 + ((i * 31) % 28);
        line(x, y, x + 2, y - 2, "#7f9071", 0.7);
      }
      for (const [x, y] of [
        [200, 36],
        [214, 30],
        [122, 64],
      ])
        path(
          "M" + x + " " + y + "q4 -2 7 2q2 -5 6 -5",
          "none",
          "#74806f",
          1.25,
        );
    } else if (kind === "book") {
      path("M15 58q52 8 111 -2", "none", "#c9c6b5", 1.2);
      path("M24 44l44 6 34 -17 -42 -5Z", "#d5b68b");
      path("M24 44v11l44 7 34 -17V33L68 50Z", "#ece4cc");
      path("M25 48l43 7 33 -17M25 52l43 7 32 -17", "none", "#8a8a72", 0.9);
      path("M23 32l43 7 30 -15 -43 -5Z", "#adc5aa");
      path("M23 32l1 9 43 7 29 -15v-9L66 39Z", "#f5efda");
      line(66, 40, 67, 47);
      line(27, 35, 60, 40, "#9b9c85");
      path("M39 16l37 7 19 -10 -37 -7Z", "#d5dfc2");
      path("M39 16v5l37 7 19 -10v-5L76 23Z", "#f1e9ce");
      path("M103 57l12 -34 4 2 -12 33 -4 5Z", "#d5a264");
      line(104, 57, 107, 58);
      path("M19 23q-5 -4 -6 -3M22 17l-3 -6", "none", "#ae9567");
    } else {
      path("M7 62Q39 47 74 4", "none", ink, 1.6);
      for (let i = 0; i < 5; i++) {
        const x = 18 + i * 10,
          y = 55 - i * 9;
        path("M" + x + " " + y + "q-6 -11 1 -19q7 9 -1 19Z", "#afbf96");
        path(
          "M" + (x + 3) + " " + (y - 3) + "q8 -11 22 -9q-5 11 -22 9Z",
          "#b8c6a3",
        );
      }
    }
  }, [kind]);
  return (
    <svg
      className={"art " + kind}
      aria-hidden="true"
      ref={ref}
      viewBox={
        kind === "land"
          ? "0 0 515 164"
          : kind === "book"
            ? "0 0 135 70"
            : "0 0 86 68"
      }
      preserveAspectRatio={kind === "land" ? "xMaxYMax slice" : "xMidYMid meet"}
    />
  );
}
