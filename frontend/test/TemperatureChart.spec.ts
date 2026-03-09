import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemperatureChart from '../src/components/TemperatureChart.vue';
import Chart from 'chart.js/auto';

// Korrekter Mock: Wir verwenden eine Klasse, damit "new Chart()" funktioniert
vi.mock('chart.js/auto', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      };
    }),
  };
});

describe('TemperatureChart.vue', () => {
  // Wir bauen ein großes Mock-Datenobjekt, um alle Seasons abzudecken
  const fullMockData = {
    request: { start_year: 2020, end_year: 2020 },
    year: { data: [{ year: 2020, tmin_mean_c: 5, tmax_mean_c: 15 }] },
    seasons: {
      WINTER: { data: [{ year: 2020, tmin_mean_c: -2, tmax_mean_c: 4 }] },
      SPRING: { data: [{ year: 2020, tmin_mean_c: 8, tmax_mean_c: 18 }] },
      SUMMER: { data: [{ year: 2020, tmin_mean_c: 15, tmax_mean_c: 28 }] },
      AUTUMN: { data: [{ year: 2020, tmin_mean_c: 7, tmax_mean_c: 12 }] }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sollte das Chart mit allen Datensätzen initialisieren', async () => {
    const wrapper = mount(TemperatureChart, {
      props: { 
        selections: ['Winter Tmin', 'Sommer Tmax', 'Ganzes Jahr Tmin'], 
        data: fullMockData 
      }
    });

    // Prüft, ob der Konstruktor aufgerufen wurde
    expect(Chart).toHaveBeenCalled();
    
    // Wir triggern den Farbalgorithmus (getColor) über neue Selections
    await wrapper.setProps({ 
      selections: ['Frühling Tmin', 'Herbst Tmax', 'Unbekannt'] 
    });
    
    expect(Chart).toHaveBeenCalledTimes(2);
  });

  it('sollte buildYearRange Randfälle abdecken', async () => {
    // Fall: Keine request-Daten, nutze Fallback aus labels (Set)
    const dataWithoutRequest = { 
        year: { data: [{ year: 2010 }] } 
    };
    
    mount(TemperatureChart, {
      props: { selections: ['Ganzes Jahr Tmin'], data: dataWithoutRequest }
    });
    
    expect(Chart).toHaveBeenCalled();
  });

  it('sollte das Tooltip-Callback ausführen (für Coverage)', () => {
    const wrapper = mount(TemperatureChart, {
      props: { selections: ['Ganzes Jahr Tmin'], data: fullMockData }
    });

    // Wir holen uns die Optionen, die an Chart.js übergeben wurden
    const chartOptions = (Chart as any).mock.calls[0][1].options;
    const tooltipLabel = chartOptions.plugins.tooltip.callbacks.label;

    // Wir simulieren den Aufruf des Tooltips
    const mockContext = { parsed: { y: 12.345 }, dataset: { label: 'Test' } };
    expect(tooltipLabel(mockContext)).toBe('Test: 12.3 °C');

    // Randfall: Fehlender Wert im Tooltip
    expect(tooltipLabel({ parsed: { y: null }, dataset: { label: 'Leer' } })).toBe('Leer: -');
  });

  it('sollte das Legend-Click Event triggern', () => {
    const wrapper = mount(TemperatureChart, {
      props: { selections: ['Ganzes Jahr Tmin'], data: fullMockData }
    });

    const chartOptions = (Chart as any).mock.calls[0][1].options;
    const legendOnClick = chartOptions.plugins.legend.onClick;

    // Simuliere Klick auf die Legende
    legendOnClick({}, { text: 'Ganzes Jahr Tmin' });
    
    expect(wrapper.emitted()).toHaveProperty('toggle-selection');
    expect(wrapper.emitted('toggle-selection')![0]).toEqual(['Ganzes Jahr Tmin']);
  });

  it('sollte Fallback-Farbe für unbekannte Selections nutzen (Zeile 52)', () => {
    const wrapper = mount(TemperatureChart, {
      props: { selections: ['Mars-Wetter Tmin'], data: fullMockData }
    });
    // @ts-ignore
    const color = wrapper.vm.getColor('Mars-Wetter Tmin');
    expect(color).toBe('#93c5fd'); // Der palette.tmin Fallback
  });
});