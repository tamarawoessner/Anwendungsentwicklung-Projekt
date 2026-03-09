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
});