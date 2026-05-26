import { Marker } from "react-simple-maps";
import { MapNode } from "@/types/map";
import { formatTroops } from "@/utils/formatUtils";

interface CountryMarkerProps {
  country: MapNode;
  zoom: number;
  textColor: string;
  secondaryTextColor: string;
}

// Tier configs: [fill, stroke, label]
const TIER: Record<number, [string, string, string]> = {
  1: ["#38bdf8", "#0369a1", "I"],
  2: ["#fbbf24", "#b45309", "II"],
  3: ["#f87171", "#b91c1c", "III"],
};

export default function CountryMarker({
  country, zoom, textColor, secondaryTextColor,
}: CountryMarkerProps) {
  const hasCastles = country.castleCount > 0;

  // Count by tier for compact display: "I×2  II×1"
  const tierCounts: Record<number, number> = {};
  for (const lvl of country.castleLevels) {
    tierCounts[lvl] = (tierCounts[lvl] || 0) + 1;
  }
  const tierEntries = Object.entries(tierCounts)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  // Each pill: label text + width estimation
  const pillH = 5.5 / zoom;
  const pillPad = 1.8 / zoom;
  const gap = 1.5 / zoom;
  const fontSize = 3.8 / zoom;
  const rx = 1.2 / zoom;

  // Compute pill widths (approx: count chars × fontSize × 0.65)
  const pills = tierEntries.map(([lvl, cnt]) => {
    const [fill, stroke, label] = TIER[lvl] ?? TIER[1];
    const text = cnt > 1 ? `${label}×${cnt}` : label;
    const w = Math.max(text.length * fontSize * 0.62 + pillPad * 2, pillH * 1.8);
    return { lvl, fill, stroke, text, w };
  });

  const totalWidth = pills.reduce((s, p) => s + p.w, 0) + gap * (pills.length - 1);
  let curX = -totalWidth / 2;
  const baseY = 14 / zoom;

  return (
    <Marker key={country.name} coordinates={country.coordinates}>
      {/* Country name */}
      <text
        textAnchor="middle"
        y={-8 / zoom}
        style={{ fill: textColor, fontSize: 8 / zoom, fontWeight: 700 }}
        className="select-none pointer-events-none"
      >
        {country.name}
      </text>

      {/* Troop score */}
      <text
        textAnchor="middle"
        y={4 / zoom}
        style={{ fill: secondaryTextColor, fontSize: 6.5 / zoom, fontWeight: 700 }}
        className="select-none pointer-events-none"
      >
        {formatTroops(country.troopScore)}
      </text>

      {/* Castle tier pills */}
      {hasCastles &&
        pills.map(({ lvl, fill, stroke, text, w }) => {
          const x = curX;
          curX += w + gap;
          return (
            <g key={lvl} className="select-none pointer-events-none">
              {/* Pill background */}
              <rect
                x={x}
                y={baseY - pillH / 2}
                width={w}
                height={pillH}
                rx={rx}
                fill={fill}
                stroke={stroke}
                strokeWidth={0.5 / zoom}
                opacity={0.92}
              />
              {/* Pill label */}
              <text
                x={x + w / 2}
                y={baseY}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fill: "#0f172a",
                  fontSize,
                  fontWeight: 900,
                  letterSpacing: "-0.2px",
                }}
              >
                {text}
              </text>
            </g>
          );
        })}
    </Marker>
  );
}
