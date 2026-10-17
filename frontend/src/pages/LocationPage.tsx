import Icon from "../components/Icon"
import LocationMap from "../components/LocationMap"
import { junctions } from "../data/city"
import type { Incident } from "../types"
type Props = {
  location: number | null
  queue: Incident[]
  onSelect: (id: number) => void
}
export default function LocationPage({ location, queue, onSelect }: Props) {
  return (
    <section
      className="location-only"
      aria-label="Choose the emergency location"
      data-selected={location !== null}
    >
      <div className="map-selection-heading">
        <div>
          <span className="eyebrow">
            {location === null ? "CHOOSE A LOCATION" : "SELECTED LOCATION"}
          </span>
          <h2 aria-live="polite">
            {location === null
              ? "Select an area on the map"
              : junctions[location].name}
          </h2>
        </div>
        {location !== null && (
          <span className="location-selected-label">
            <Icon name="check" size={14} />
            <span className="mono">Junction #{location + 1}</span>
          </span>
        )}
      </div>
      <LocationMap selected={location} onSelect={onSelect} queue={queue} />
    </section>
  )
}
