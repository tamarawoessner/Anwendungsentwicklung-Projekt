import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemperatureChart from '../src/components/TemperatureChart.vue';
import Chart from 'chart.js/auto';

// Mock as constructor-compatible implementation because the component calls `new Chart(...)`.
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
  // Covers year + all seasonal branches.
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

    expect(Chart).toHaveBeenCalled();
    
    await wrapper.setProps({ 
      selections: ['Frühling Tmin', 'Herbst Tmax', 'Unbekannt'] 
    });
    
    expect(Chart).toHaveBeenCalledTimes(2);
  });

  it('sollte buildYearRange Randfälle abdecken', async () => {
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

    const chartOptions = (Chart as any).mock.calls[0][1].options;
    const tooltipLabel = chartOptions.plugins.tooltip.callbacks.label;

    const mockContext = { parsed: { y: 12.345 }, dataset: { label: 'Test' } };
    expect(tooltipLabel(mockContext)).toBe('Test: 12.3 °C');

    expect(tooltipLabel({ parsed: { y: null }, dataset: { label: 'Leer' } })).toBe('Leer: -');
  });

  it('sollte das Legend-Click Event triggern', () => {
    const wrapper = mount(TemperatureChart, {
      props: { selections: ['Ganzes Jahr Tmin'], data: fullMockData }
    });

    const chartOptions = (Chart as any).mock.calls[0][1].options;
    const legendOnClick = chartOptions.plugins.legend.onClick;

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
    expect(color).toBe('#93c5fd');
  });

  it('sollte bei fehlenden request- und fallback-Jahren leere Labels verwenden', () => {
    const dataWithoutYears = {
      year: { data: [] },
      seasons: {}
    };

    mount(TemperatureChart, {
      props: { selections: ['Ganzes Jahr Tmin'], data: dataWithoutYears }
    });

    const chartConfig = (Chart as any).mock.calls[0][1];
    expect(chartConfig.data.labels).toEqual([]);
    expect(chartConfig.data.datasets[0].data).toEqual([]);
  });

  it('sollte ohne data-Prop mit leerem Datensatz initialisieren', () => {
    mount(TemperatureChart, {
      props: { selections: ['Winter Tmin'] }
    });

    const chartConfig = (Chart as any).mock.calls[0][1];
    expect(chartConfig.data.labels).toEqual([]);
    expect(chartConfig.data.datasets).toEqual([]);
  });

  it('sollte mehrfaches Setzen derselben Saison-Maps verarbeiten', () => {
    const repeatedData = {
      request: { start_year: 2020, end_year: 2021 },
      year: {
        data: [
          { year: 2020, tmin_mean_c: 4, tmax_mean_c: 10 },
          { year: 2021, tmin_mean_c: 5, tmax_mean_c: 11 }
        ]
      }
    };

    mount(TemperatureChart, {
      props: {
        selections: ['Ganzes Jahr Tmin', 'Ganzes Jahr Tmax'],
        data: repeatedData
      }
    });

    const chartConfig = (Chart as any).mock.calls[0][1];
    expect(chartConfig.data.datasets[0].data).toEqual([4, 5]);
    expect(chartConfig.data.datasets[1].data).toEqual([10, 11]);
  });

  it('sollte updateChart abbrechen, wenn kein Canvas gesetzt ist', () => {
    const wrapper = mount(TemperatureChart, {
      props: { selections: ['Ganzes Jahr Tmin'], data: fullMockData }
    });

    vi.clearAllMocks();
    // @ts-ignore Test helper intentionally controls internal canvas ref.
    wrapper.vm.__test__.setChartCanvas(null);
    // @ts-ignore
    wrapper.vm.__test__.updateChart();

    expect(Chart).not.toHaveBeenCalled();
  });

  it('sollte fallback-Jahre ohne gueltigen Request aufsteigend sortieren', () => {
    const dataWithoutValidRequest = {
      request: { start_year: 2022, end_year: 2020 },
      year: {
        data: [
          { year: 2021, tmin_mean_c: 6, tmax_mean_c: 12 },
          { year: 2019, tmin_mean_c: 3, tmax_mean_c: 8 }
        ]
      }
    };

    mount(TemperatureChart, {
      props: {
        selections: ['Ganzes Jahr Tmin'],
        data: dataWithoutValidRequest
      }
    });

    const chartConfig = (Chart as any).mock.calls[0][1];
    expect(chartConfig.data.labels).toEqual([2019, 2021]);
  });
});