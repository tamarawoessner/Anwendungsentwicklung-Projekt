import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoute, useRouter } from 'vue-router';
import StationAnalysisView from '../src/views/StationAnalysisView.vue'; 

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: () => ({ push: mockPush })
}));

describe('StationAnalysisView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stabiler Fetch-Mock für den Standardfall
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ availability: { start_year: 1950, end_year: 2023 } })
    });
    
    (useRoute as any).mockReturnValue({
      query: { 
        name: 'Test Station', 
        start_year: '2000', 
        end_year: '2020', 
        distance_km: '10.5',
        lat: '48',
        lng: '8',
        search_start_year: '1990',
        search_end_year: '2010'
      }
    });
  });

  it('sollte initialisieren und Daten laden', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Test Station');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('deckt toggleSelection komplett ab (Bereiche UND Einzelwerte)', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // 1. Bereich hinzufügen (Winter -> Tmin & Tmax)
    // @ts-ignore
    wrapper.vm.toggleSelection('Winter');
    // @ts-ignore
    expect(wrapper.vm.activeSelections).toContain('Winter Tmin');

    // 2. Bereich entfernen
    // @ts-ignore
    wrapper.vm.toggleSelection('Winter');
    // @ts-ignore
    expect(wrapper.vm.activeSelections).not.toContain('Winter Tmin');

    // 3. Einzelwert toggeln (deckt den else-Zweig ab)
    // @ts-ignore
    wrapper.vm.toggleSelection('Ganzes Jahr Tmin'); 
    // @ts-ignore
    expect(wrapper.vm.activeSelections).not.toContain('Ganzes Jahr Tmin');
  });

  it('testet ALLE Zweige der Jahres-Validierung (dateError)', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // Verfügbarkeit setzen
    // @ts-ignore
    wrapper.vm.currentStation.period = "1950-2023";

    // Pfad 1: Start >= Ende
    // @ts-ignore
    wrapper.vm.startYearInput = 2020; wrapper.vm.endYearInput = 2010;
    // @ts-ignore
    expect(wrapper.vm.dateError).toBe("Das Startjahr muss vor dem Endjahr liegen.");

    // Pfad 2: Vor Verfügbarkeit (1950)
    // @ts-ignore
    wrapper.vm.startYearInput = 1940; wrapper.vm.endYearInput = 2000;
    // @ts-ignore
    expect(wrapper.vm.dateError).toContain("Daten erst ab 1950 verfügbar.");

    // Pfad 3: Nach Verfügbarkeit (2023)
    // @ts-ignore
    wrapper.vm.startYearInput = 2000; wrapper.vm.endYearInput = 2025;
    // @ts-ignore
    expect(wrapper.vm.dateError).toContain("Daten nur bis 2023 verfügbar.");

    // Pfad 4: Ungültiges Perioden-Format (Zeile 110)
    // @ts-ignore
    wrapper.vm.startYearInput = 2000; wrapper.vm.endYearInput = 2010;
    // @ts-ignore
    wrapper.vm.currentStation.period = "unbekannt";
    // @ts-ignore
    expect(wrapper.vm.dateError).toBeNull();
  });

  it('behandelt API-Fehler korrekt', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });

    // @ts-ignore
    await wrapper.vm.fetchStationData();
    expect(wrapper.vm.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('testet goBackToSearch mit vollständigem Query-Mapping', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();
    // @ts-ignore
    wrapper.vm.goBackToSearch();

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({
      name: 'search',
      query: expect.objectContaining({
        start_year: '1990', // Mapped von search_start_year
        end_year: '2010'
      })
    }));
  });

  it('sollte beim Mount auf stationId und Zeitraum-Fallbacks zurückfallen', async () => {
    (useRoute as any).mockReturnValue({
      query: {}
    });

    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'FALLBACK-STAT' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });

    await flushPromises();
    expect(wrapper.text()).toContain('FALLBACK-STAT');
    expect(wrapper.text()).toContain('Zeitraum: —');
  });

  it('sollte in fetchStationData früh zurückkehren, wenn Jahre fehlen oder ungültig sind', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    const fetchSpy = vi.spyOn(global, 'fetch');
    fetchSpy.mockClear();

    // @ts-ignore
    wrapper.vm.startYearInput = null;
    // @ts-ignore
    wrapper.vm.endYearInput = 2010;
    // @ts-ignore
    await wrapper.vm.fetchStationData();
    // @ts-ignore
    expect(wrapper.vm.fetchedStationData).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    // @ts-ignore
    wrapper.vm.startYearInput = 2020;
    // @ts-ignore
    wrapper.vm.endYearInput = 2020;
    // @ts-ignore
    await wrapper.vm.fetchStationData();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sollte den !res.ok Pfad behandeln und loading zurücksetzen', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, status: 500 });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // @ts-ignore
    await wrapper.vm.fetchStationData();
    // @ts-ignore
    expect(wrapper.vm.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('sollte currentStation.period unverändert lassen, wenn availability fehlt', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });

    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // @ts-ignore
    wrapper.vm.currentStation.period = '2000-2020';
    // @ts-ignore
    await wrapper.vm.fetchStationData();
    // @ts-ignore
    expect(wrapper.vm.currentStation.period).toBe('2000-2020');
  });

  it('sollte goBackToSearch leere oder ungültige Query-Werte herausfiltern', async () => {
    (useRoute as any).mockReturnValue({
      query: {
        lat: '',
        lng: 8,
        lat_input: '',
        lng_input: null,
        radius_km: '',
        limit: undefined,
        search_start_year: '',
        search_end_year: null
      }
    });

    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // @ts-ignore
    wrapper.vm.goBackToSearch();

    expect(mockPush).toHaveBeenCalledWith({ name: 'search', query: {} });
  });

  it('sollte im Einzelwert-Zweig von toggleSelection auch neue Werte hinzufügen', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // Winter Tmin ist initial nicht aktiv und muss daher per push hinzugefügt werden.
    // @ts-ignore
    wrapper.vm.toggleSelection('Winter Tmin');
    // @ts-ignore
    expect(wrapper.vm.activeSelections).toContain('Winter Tmin');
  });

  it('sollte beide Jahresfelder per v-model aktualisieren', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    const startInput = wrapper.find('#analysis-start-year');
    const endInput = wrapper.find('#analysis-end-year');

    await startInput.setValue('2005');
    await endInput.setValue('2015');

    // @ts-ignore
    expect(wrapper.vm.startYearInput).toBe(2005);
    // @ts-ignore
    expect(wrapper.vm.endYearInput).toBe(2015);
  });

  it('sollte beim Bereichs-Toggle nur fehlende Subselection hinzufügen', async () => {
    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // Ausgangslage: Winter Tmin bereits gesetzt, Winter Tmax fehlt.
    // @ts-ignore
    wrapper.vm.activeSelections = ['Winter Tmin'];
    // @ts-ignore
    wrapper.vm.toggleSelection('Winter');

    // @ts-ignore
    expect(wrapper.vm.activeSelections).toContain('Winter Tmin');
    // @ts-ignore
    expect(wrapper.vm.activeSelections).toContain('Winter Tmax');
  });

  it('sollte goBackToSearch optionale Felder selektiv mappen', async () => {
    (useRoute as any).mockReturnValue({
      query: {
        lat_input: '48,05',
        lng_input: '8,46',
        radius_km: '30',
        limit: '12'
      }
    });

    const wrapper = mount(StationAnalysisView, {
      props: { stationId: 'STAT1' },
      global: { stubs: ['TemperatureChart', 'RadialSeasonMenu', 'StationDetailsTable'] }
    });
    await flushPromises();

    // @ts-ignore
    wrapper.vm.goBackToSearch();

    expect(mockPush).toHaveBeenCalledWith({
      name: 'search',
      query: {
        lat_input: '48,05',
        lng_input: '8,46',
        radius_km: '30',
        limit: '12'
      }
    });
  });
});