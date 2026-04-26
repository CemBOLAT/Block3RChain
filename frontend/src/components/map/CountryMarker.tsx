import { Marker } from "react-simple-maps";
import { MapNode } from "@/types/map";
import { formatTroops } from "@/utils/formatUtils";

interface CountryMarkerProps {
  country: MapNode;
  zoom: number;
  textColor: string;
  secondaryTextColor: string;
}

export default function CountryMarker({ country, zoom, textColor, secondaryTextColor }: CountryMarkerProps) {
  return (
    <Marker key={country.name} coordinates={country.coordinates}>
      <text
        textAnchor="middle"
        y={-8 / zoom}
        className="font-bold select-none pointer-events-none"
        style={{ fill: textColor, fontSize: 8 / zoom }}
      >
        {country.name}
      </text>
      <text
        textAnchor="middle"
        y={4 / zoom}
        className="font-bold select-none pointer-events-none"
        style={{
          fill: secondaryTextColor,
          fontSize: 6.5 / zoom,
        }}
      >
        {formatTroops(country.troopScore)}
      </text>
    </Marker>
  );
}
