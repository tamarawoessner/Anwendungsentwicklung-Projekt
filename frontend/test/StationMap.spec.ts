import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StationMap from '../src/components/StationMap.vue';
import L from 'leaflet';

let mockLayerEntries: unknown[] = ['mock-layer'];
const mockMapInstance = {
  setView: vi.fn().mockReturnThis(),
  fitBounds: vi.fn().mockReturnThis(),
};

// Full Leaflet mock to keep map rendering deterministic in jsdom.
vi.mock('leaflet', () => {
  const mockLayer = {
    bindPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  };
  
  const mockFeatureGroup = {
    clearLayers: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    getLayers: vi.fn(() => mockLayerEntries),
    getBounds: vi.fn().mockReturnValue('mock-bounds'),
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
    vi.clearAllMocks();
    mockLayerEntries = ['mock-layer'];
  });

  it('sollte die Karte initialisieren', () => {
    mount(StationMap, {
      props: { stations: [] }
    });
    
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

    expect(L.circleMarker).toHaveBeenCalledWith([48.05, 8.46], expect.any(Object));
    
    // Radius is expected in meters.
    expect(L.circle).toHaveBeenCalledWith([48.05, 8.46], expect.objectContaining({ radius: 20000 }));

    expect(L.marker).toHaveBeenCalledWith([48.06, 8.46]);
  });

  it('sollte die Karte aktualisieren, wenn sich die Props ändern (Watcher)', async () => {
    const wrapper = mount(StationMap, {
      props: { stations: [] }
    });

    // Clear initial mount calls so only watcher-triggered updates are asserted.
    vi.clearAllMocks();

    await wrapper.setProps({
      centerLat: 50.1,
      centerLng: 8.6,
      radiusKm: 10,
      stations: []
    });

    expect(L.circleMarker).toHaveBeenCalledWith([50.1, 8.6], expect.any(Object));
  });

  it('sollte keine Marker zeichnen, wenn Koordinaten fehlen', () => {
    mount(StationMap, {
        props: {
        stations: [],
        centerLat: null,
        centerLng: null
        }
    });

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
    expect(L.marker).toHaveBeenCalled();
  });

  it('deckt alle Zweige der Marker-Erstellung ab (Zeile 61-68)', () => {
    mount(StationMap, {
        props: {
        stations: [{ station_id: 'ID1', name: '', lat: 48, lon: 8, distance_km: 5 }],
        centerLat: 48, centerLng: 8, radiusKm: 10
        }
    });
    expect(L.marker).toHaveBeenCalled();
    });

  it('sollte fitBounds nicht aufrufen, wenn keine Layer vorhanden sind', () => {
    mockLayerEntries = [];

    mount(StationMap, {
      props: {
        stations: [],
        centerLat: 48,
        centerLng: 8,
        radiusKm: 0
      }
    });

    expect(mockMapInstance.fitBounds).not.toHaveBeenCalled();
  });

  it('sollte in updateMarkers früh zurückkehren, wenn keine map gesetzt ist', () => {
    const wrapper = mount(StationMap, {
      props: {
        stations: [],
        centerLat: 48,
        centerLng: 8
      }
    });

    // @ts-ignore test helper intentionally mutates internal map reference
    wrapper.vm.__test__.setMap(null);
    // @ts-ignore
    const result = wrapper.vm.__test__.updateMarkers();
    expect(result).toBe(false);
  });

  it('sollte initializeMap mit null-container abbrechen', () => {
    const wrapper = mount(StationMap, {
      props: { stations: [] }
    });

    // @ts-ignore
    const result = wrapper.vm.__test__.initializeMap(null);
    expect(result).toBe(false);
  });
});