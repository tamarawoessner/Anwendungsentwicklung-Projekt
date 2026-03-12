import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoute } from 'vue-router';
import SearchView from '../src/views/SearchView.vue';
import Sidebar from '../src/components/Sidebar.vue';

// Keep mock state at module scope so the vue-router mock can read the latest query values.
const mockPush = vi.fn();
let mockQueryParams = {};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: mockQueryParams })
}));

// Minimal ResizeObserver test double to drive responsive card-count behavior deterministically.
class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  callback: ResizeObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }

  trigger(width: number) {
    this.callback([{ contentRect: { width } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe('SearchView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    sessionStorage.clear();
    mockQueryParams = {};
    ResizeObserverMock.instances = [];
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

    // The component performs an automatic load on mount, so fetch needs a valid default response.
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
    sessionStorage.setItem('weather-search-state', 'KEIN_JSON');

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();
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

    await wrapper.findComponent(Sidebar).vm.$emit('search', { lat: 48, lng: 8, radius: 10 });
    await flushPromises();

    // Sidebar is stubbed, so we assert via component state instead of rendered text.
    expect(wrapper.vm.stations).toHaveLength(0);
  });

  it('sollte handleSearch nicht aufrufen, wenn URL-Parameter unvollständig sind', async () => {
    mockQueryParams = { lat: '48.05' }; 

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();
    expect(global.fetch).not.toHaveBeenCalled();
    mockQueryParams = {};
  });

  it('sollte bei fehlerhaftem JSON im SessionStorage diesen ignorieren', async () => {
    sessionStorage.setItem('weather-search-state', 'definitiv-kein-json');
    
    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });
    
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });

  it('sollte gespeicherte Suche ignorieren, wenn lat oder lng im SessionStorage ungültig ist', async () => {
    sessionStorage.setItem('weather-search-state', JSON.stringify({
      lat: '',
      lng: 8.46,
      radius: 20,
      limit: 10
    }));

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sollte bei gespeicherter Suche ohne radius/limit die Standardwerte verwenden', async () => {
    sessionStorage.setItem('weather-search-state', JSON.stringify({
      lat: 48.06,
      lng: 8.53
    }));

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [], count: 0 })
    });

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.radius_km).toBe(20);
    expect(body.limit).toBe(10);
  });

  it('sollte vollständige URL-Query-Werte parsen und Fallbacks für lat/lng Input nutzen', async () => {
    mockQueryParams = {
      lat: '48.06125',
      lng: '8.53461',
      radius_km: '0',
      limit: '0',
      start_year: '2000',
      end_year: '2010'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [], count: 0 })
    });

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.radius_km).toBe(1);
    expect(body.limit).toBe(1);

    const savedState = JSON.parse(sessionStorage.getItem('weather-search-state') || '{}');
    expect(savedState.latInput).toBe('48.06125');
    expect(savedState.lngInput).toBe('8.53461');
  });

  it('sollte explizite lat_input/lng_input aus der URL übernehmen', async () => {
    mockQueryParams = {
      lat: '48.06125',
      lng: '8.53461',
      lat_input: '48,06125',
      lng_input: '8,53461'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [], count: 0 })
    });

    mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await flushPromises();

    const savedState = JSON.parse(sessionStorage.getItem('weather-search-state') || '{}');
    expect(savedState.latInput).toBe('48,06125');
    expect(savedState.lngInput).toBe('8,53461');
  });

  it('sollte die ResizeObserver-Callback verarbeiten und beim Unmount disconnect aufrufen', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 4, stations: [
        { station_id: 'A', name: 'A', distance_km: 1 },
        { station_id: 'B', name: 'B', distance_km: 2 },
        { station_id: 'C', name: 'C', distance_km: 3 },
        { station_id: 'D', name: 'D', distance_km: 4 }
      ] })
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: 48.05,
      lng: 8.46,
      radius: 20,
      limit: 10,
      startYear: null,
      endYear: null
    });
    await flushPromises();

    expect(ResizeObserverMock.instances.length).toBeGreaterThan(0);
    const observer = ResizeObserverMock.instances[0];
    observer.trigger(620);
    await flushPromises();

    expect(wrapper.findAllComponents({ name: 'NearbyCard' }).length).toBe(1);

    wrapper.unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it('sollte resultsCount auf stations.length setzen, wenn count nicht numerisch ist', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 'kein-wert',
        stations: [
          { station_id: 'X1', name: 'X1', distance_km: 1 },
          { station_id: 'X2', name: 'X2', distance_km: 2 }
        ]
      })
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: 48.05,
      lng: 8.46,
      radius: 20,
      limit: 10,
      startYear: null,
      endYear: null
    });
    await flushPromises();

    expect(wrapper.findComponent(Sidebar).props('resultsCount')).toBe(2);
  });

  it('sollte bei station-select ohne vorherige Suche die Stations-Fallbackwerte verwenden', async () => {
    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    const station = {
      station_id: 'STAT-FALLBACK',
      name: 'Fallback-Station',
      distance_km: 11,
      start_year: 1980,
      end_year: 2020,
      lat: 48,
      lon: 8
    };

    await wrapper.findComponent(Sidebar).vm.$emit('station-select', station);

    const pushArgs = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
    expect(pushArgs.query.start_year).toBe('1980');
    expect(pushArgs.query.end_year).toBe('2020');
    expect(pushArgs.query.radius_km).toBe('20');
    expect(pushArgs.query.lat).toBeUndefined();
    expect(pushArgs.query.lng).toBeUndefined();
    expect(pushArgs.query.lat_input).toBeUndefined();
    expect(pushArgs.query.lng_input).toBeUndefined();
  });

  it('sollte bei Suche mit lat/lng null leere Input-Fallbacks verwenden', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [], count: 0 })
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: null,
      lng: null,
      radius: 20,
      limit: 10,
      startYear: null,
      endYear: null
    });
    await flushPromises();

    const sidebarProps = wrapper.findComponent(Sidebar).props('initialSearch') as any;
    expect(sidebarProps.latInput).toBe('');
    expect(sidebarProps.lngInput).toBe('');
  });

  it('sollte bei station-select nach Suche alle optionalen Query-Felder setzen', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [], count: 0 })
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: 48.05,
      lng: 8.46,
      latInput: '48,05',
      lngInput: '8,46',
      radius: 30,
      startYear: 2001,
      endYear: 2015,
      limit: 12
    });
    await flushPromises();

    const station = {
      station_id: 'STAT-OPT',
      name: 'Optionale Station',
      distance_km: 9,
      start_year: 1980,
      end_year: 2020,
      lat: 48,
      lon: 8
    };

    await wrapper.findComponent(Sidebar).vm.$emit('station-select', station);
    const pushArgs = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];

    expect(pushArgs.query.lat).toBe('48.05');
    expect(pushArgs.query.lng).toBe('8.46');
    expect(pushArgs.query.lat_input).toBe('48,05');
    expect(pushArgs.query.lng_input).toBe('8,46');
    expect(pushArgs.query.search_start_year).toBe('2001');
    expect(pushArgs.query.search_end_year).toBe('2015');
    expect(pushArgs.query.radius_km).toBe('30');
    expect(pushArgs.query.limit).toBe('12');
  });

  it('sollte für NearbyCard-Keys den Placeholder-Fallback nutzen, wenn Stationseintrag fehlt', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        stations: [undefined]
      })
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: 48.05,
      lng: 8.46,
      radius: 10,
      limit: 1,
      startYear: null,
      endYear: null
    });
    await flushPromises();

    expect(wrapper.findAllComponents({ name: 'NearbyCard' }).length).toBe(1);
  });

  it('sollte bei nicht-ok Backend-Response in den Fehlerpfad gehen', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({})
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: 48.05,
      lng: 8.46,
      radius: 20,
      limit: 10,
      startYear: null,
      endYear: null
    });
    await flushPromises();

    expect(wrapper.findComponent(Sidebar).props('resultsCount')).toBeNull();
    expect(wrapper.findComponent({ name: 'StationMap' }).props('stations')).toEqual([]);
  });

  it('sollte bei kleiner Containerbreite nur eine NearbyCard anzeigen', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 3,
        stations: [
          { station_id: 'S1', name: 'S1', distance_km: 1 },
          { station_id: 'S2', name: 'S2', distance_km: 2 },
          { station_id: 'S3', name: 'S3', distance_km: 3 }
        ]
      })
    });

    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    await wrapper.findComponent(Sidebar).vm.$emit('search', {
      lat: 48.05,
      lng: 8.46,
      radius: 20,
      limit: 10,
      startYear: null,
      endYear: null
    });
    await flushPromises();

    expect(ResizeObserverMock.instances.length).toBeGreaterThan(0);
    ResizeObserverMock.instances[0].trigger(250);
    await flushPromises();

    expect(wrapper.findAllComponents({ name: 'NearbyCard' }).length).toBe(1);
  });

  it('sollte setupResizeObserver bei null-Target ohne Observer-Setup beenden', () => {
    const wrapper = mount(SearchView, {
      global: { stubs: { Sidebar: true, StationMap: true, NearbyCard: true } }
    });

    const beforeCount = ResizeObserverMock.instances.length;
    // Expose-only helper used to directly cover the null-guard branch.
    // @ts-ignore
    wrapper.vm.__test__.setupResizeObserver(null);
    expect(ResizeObserverMock.instances.length).toBe(beforeCount);
  });
});