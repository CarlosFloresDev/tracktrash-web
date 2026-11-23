import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

export interface MapPoint {
  id: number
  name: string
  latitude: number
  longitude: number
  subtitle?: string
}

const AREQUIPA: [number, number] = [-16.3989, -71.5369]

function pin(active: boolean) {
  const fill = active ? '#d7f58b' : '#217a51'
  const stroke = active ? '#143d2b' : '#ffffff'
  return L.divIcon({
    className: '',
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
    html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17 2C9 2 3 8 3 15.500 3 26 17 41 17 41s14-15 14-25.500C31 8 25 2 17 2z" fill="${fill}" stroke="${stroke}" stroke-width="2.500"/>
      <circle cx="17" cy="15.500" r="5" fill="${active ? '#143d2b' : '#ffffff'}"/>
    </svg>`,
  })
}

function FitBounds({ points, selectedId }: { points: MapPoint[]; selectedId?: number | null }) {
  const map = useMap()
  useEffect(() => {
    const selected = points.find((point) => point.id === selectedId)
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15), { duration: 0.6 })
      return
    }
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((point) => [point.latitude, point.longitude] as [number, number])), {
        padding: [40, 40],
        maxZoom: 15,
      })
    } else if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 15)
    }
  }, [map, points, selectedId])
  return null
}

export function PointsMap({
  points,
  selectedId,
  onSelect,
  className,
}: {
  points: MapPoint[]
  selectedId?: number | null
  onSelect?: (id: number) => void
  className?: string
}) {
  return (
    <MapContainer center={AREQUIPA} zoom={12} scrollWheelZoom={false} className={className ?? 'h-96 w-full'} aria-label="Mapa de puntos de acopio">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} selectedId={selectedId} />
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={pin(point.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(point.id) }}
          keyboard
          title={point.name}
        >
          <Popup>
            <strong>{point.name}</strong>
            {point.subtitle && <div>{point.subtitle}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
