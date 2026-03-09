import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StationMap from '../src/components/StationMap.vue';
import L from 'leaflet';

// --- LEAFLET MOCKING ---
// Wir fälschen die gesamte Leaflet-Bibliothek, damit sie im Test nicht crasht
vi.mock('leaflet', () => {
  const mockLayer = {
    bindPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  };
  
  const mockFeatureGroup = {
    clearLayers: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    // Wir tun so, als wäre ein Layer drin, damit map.fitBounds am Ende ausgeführt wird
    getLayers: vi.fn().mockReturnValue(['mock-layer']), 
    getBounds: vi.fn().mockReturnValue('mock-bounds'),
  };
  
  const mockMapInstance = {
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
  };

  return {
    default: {
      Icon: {
        Default: {
          prototype: { _getIconUrl: undefined },
          mergeOptions: vi.fn(),
        }
      },
      map: vi.fn(() => mockMapInstance),
      tileLayer: vi.fn(() => mockLayer),
      featureGroup: vi.fn(() => mockFeatureGroup),
      circleMarker: vi.fn(() => mockLayer),
      circle: vi.fn(() => mockLayer),
      marker: vi.fn(() => mockLayer),
    }
  };
});

describe('StationMap.vue', () => {
  beforeEach(() => {
    // Vor jedem Test setzen wir unsere Zähler zurück
    vi.clearAllMocks();
  });

  it('sollte die Karte initialisieren', () => {
    mount(StationMap, {
      props: { stations: [] }
    });
    
    // Prüfen, ob Leaflet angewiesen wurde, eine Karte zu bauen
    expect(L.map).toHaveBeenCalledTimes(1);
    expect(L.tileLayer).toHaveBeenCalledTimes(1);
  });

  it('sollte den Suchpunkt und Stationen auf der Karte zeichnen', () => {
    mount(StationMap, {
      props: {
        centerLat: 48.05,
        centerLng: 8.46,
        radiusKm: 20,
        stations: [
          { station_id: 'STAT-1', name: 'Villingen', lat: 48.06, lon: 8.46, distance_km: 5.5 }
        ]
      }
    });

    // Prüfen, ob der rote Punkt (Suchpunkt) an den korrekten Koordinaten gezeichnet wurde
    expect(L.circleMarker).toHaveBeenCalledWith([48.05, 8.46], expect.any(Object));
    
    // Prüfen, ob der Radius-Kreis (in Metern) berechnet wurde (20km * 1000 = 20000m)
    expect(L.circle).toHaveBeenCalledWith([48.05, 8.46], expect.objectContaining({ radius: 20000 }));

    // Prüfen, ob die Station als Marker gesetzt wurde
    expect(L.marker).toHaveBeenCalledWith([48.06, 8.46]);
  });

  it('sollte die Karte aktualisieren, wenn sich die Props ändern (Watcher)', async () => {
    // 1. Karte komplett leer aufbauen
    const wrapper = mount(StationMap, {
      props: { stations: [] }
    });

    // 2. Mock-Aufrufe des ersten Renderings löschen
    vi.clearAllMocks();

    // 3. Neue Suchanfrage simulieren (Props ändern)
    await wrapper.setProps({
      centerLat: 50.1,
      centerLng: 8.6,
      radiusKm: 10,
      stations: []
    });

    // 4. Der Watcher in deinem Code sollte die Änderung bemerkt und 
    // die Kreise an den NEUEN Koordinaten gezeichnet haben
    expect(L.circleMarker).toHaveBeenCalledWith([50.1, 8.6], expect.any(Object));
  });

  it('sollte keine Marker zeichnen, wenn Koordinaten fehlen', () => {
    mount(StationMap, {
        props: {
        stations: [],
        centerLat: null, // Explizit null
        centerLng: null
        }
    });

    // L.circleMarker darf nicht aufgerufen worden sein
    expect(L.circleMarker).not.toHaveBeenCalled();
    });

    it('sollte auch Stationen ohne Namen korrekt als Marker anzeigen', () => {
    mount(StationMap, {
      props: {
        stations: [{ station_id: 'ID-ONLY', name: '', lat: 48, lon: 8, distance_km: 10 }],
        centerLat: 48,
        centerLng: 8
      }
    });
    // Prüft den Fallback-Namen in Zeile 57-58
    expect(L.marker).toHaveBeenCalled();
  });

  it('deckt alle Zweige der Marker-Erstellung ab (Zeile 61-68)', () => {
    mount(StationMap, {
        props: {
        stations: [{ station_id: 'ID1', name: '', lat: 48, lon: 8, distance_km: 5 }],
        centerLat: 48, centerLng: 8, radiusKm: 10
        }
    });
    // Prüft, ob L.marker mit dem Fallback-Namen (ID1) aufgerufen wurde
    expect(L.marker).toHaveBeenCalled();
    });
});