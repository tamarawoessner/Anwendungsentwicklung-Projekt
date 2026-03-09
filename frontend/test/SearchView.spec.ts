import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoute } from 'vue-router';
import SearchView from '../src/views/SearchView.vue';
import Sidebar from '../src/components/Sidebar.vue';

// 1. Router Mocking - WICHTIG: Die Variablen müssen ganz oben stehen
const mockPush = vi.fn();
let mockQueryParams = {};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: mockQueryParams })
}));

// 2. ResizeObserver Mocking
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('SearchView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Setzt alle Mocks (fetch, push etc.) zurück
    global.fetch = vi.fn();
    sessionStorage.clear();
    mockQueryParams = {}; // Reset der Query Params
  });

  it('sollte bei einer Suche die Parameter an das Backend senden und die Stationen speichern', async () => {
    const mockBackendResponse = {
      count: 1,
      stations: [{ station_id: 'STAT123', name: 'Test-Station', distance_km: 5 }]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockBackendResponse
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    const searchPayload = {
      lat: 48.05, lng: 8.46, radius: 20, limit: 10, startYear: 2000, endYear: 2020
    };
    
    await wrapper.findComponent(Sidebar).vm.$emit('search', searchPayload);
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const mapComponent = wrapper.findComponent({ name: 'StationMap' });
    expect(mapComponent.props('stations')).toEqual(mockBackendResponse.stations);
  });

  it('sollte bei einem Backend-Fehler die Stationen leeren', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Server down'));

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: 48.05, lng: 8.46, radius: 20, limit: 10, startYear: 2000, endYear: 2020
    });
    
    await flushPromises();

    const mapComponent = wrapper.findComponent({ name: 'StationMap' });
    expect(mapComponent.props('stations')).toEqual([]);
  });

  it('sollte bei station-select den Router mit den richtigen Parametern aufrufen', async () => {
    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    const mockStation = {
      station_id: 'STAT-99',
      name: 'Feldberg',
      distance_km: 15,
      start_year: 1950,
      end_year: 2023,
      lat: 47.8,
      lon: 8.0
    };

    await wrapper.findComponent(Sidebar).vm.$emit('station-select', mockStation);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushArgs = mockPush.mock.calls[0][0];
    expect(pushArgs.name).toBe('analyse');
    expect(pushArgs.params.stationId).toBe('STAT-99');
  });

  it('sollte bei fehlenden URL-Parametern den gespeicherten Such-Zustand aus der Session laden', async () => {
    const savedState = {
      lat: 52.52, 
      lng: 13.40, 
      radius: 15, 
      limit: 20, 
      startYear: 2010, 
      endYear: 2020
    };
    sessionStorage.setItem('weather-search-state', JSON.stringify(savedState));

    // WICHTIG: Wir sagen dem Fetch-Mock hier, was er zurückgeben soll, 
    // um den "Cannot read properties of undefined (reading 'ok')" Fehler zu vermeiden
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [], count: 0 })
    });

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();

    expect(global.fetch).toHaveBeenCalled();
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const bodyGesendet = JSON.parse(fetchArgs[1].body);
    expect(bodyGesendet.lat).toBe(52.52);
  });

  it('sollte mit ungültigen URL-Parametern umgehen können', async () => {
    mockQueryParams = { lat: 'KEINE_ZAHL', lng: '8.46' };

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sollte mit korruptem SessionStorage umgehen können', async () => {
    // Wir schreiben "Müll" in den Speicher, der kein gültiges JSON ist
    sessionStorage.setItem('weather-search-state', 'KEIN_JSON');

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();
    // Die Komponente sollte nicht crashen, sondern den Fehler abfangen (Zeile 63/78)
    expect(wrapper.exists()).toBe(true);
  });

  it('sollte den Status "Keine Treffer" anzeigen, wenn das Backend leer zurückgibt', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [], count: 0 })
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    // Suche auslösen
    await wrapper.findComponent(Sidebar).vm.$emit('search', { lat: 48, lng: 8, radius: 10 });
    await flushPromises();

    // In der Sidebar sollte nun der Text für "Keine Treffer" erscheinen (falls die Stub das zulässt)
    // Da wir Sidebar stubben, prüfen wir stattdessen die interne Variable, falls möglich, 
    // oder wir entfernen den Stub kurz für diesen Test.
    expect(wrapper.vm.stations).toHaveLength(0);
  });

  it('sollte handleSearch nicht aufrufen, wenn URL-Parameter unvollständig sind', async () => {
    // Nur lat, aber kein lng in der URL
    mockQueryParams = { lat: '48.05' }; 

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();
    // fetch darf nicht gerufen werden, da ein Teil fehlt (Zeile 114-118)
    expect(global.fetch).not.toHaveBeenCalled();
    mockQueryParams = {};
  });

  it('sollte bei fehlerhaftem JSON im SessionStorage diesen ignorieren', async () => {
    // Wir setzen einen Wert, der beim JSON.parse() einen Error wirft
    sessionStorage.setItem('weather-search-state', 'definitiv-kein-json');
    
    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });
    
    await flushPromises();
    // Die Komponente sollte einfach normal weiterlaufen (Zeile 63/78)
    expect(wrapper.exists()).toBe(true);
  });
});