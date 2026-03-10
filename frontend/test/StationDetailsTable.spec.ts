import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import StationDetailsTable from '../src/components/StationDetailsTable.vue';

describe('StationDetailsTable.vue', () => {
  const mockData = {
    request: { start_year: 2020, end_year: 2021 },
    year: {
      data: [{ year: 2020, tmin_mean_c: 5.2, tmax_mean_c: 12.8 }]
    }
  };

  it('sollte die Tabelle mit Daten rendern', () => {
    const wrapper = mount(StationDetailsTable, {
      props: { selections: ['Ganzes Jahr Tmin'], data: mockData }
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('2020');
    // Check Formatierung: 5.2 -> 5,2
    expect(wrapper.text()).toContain('5,2 °C');
  });

  it('sollte einen Platzhalter anzeigen, wenn keine Daten vorhanden sind', () => {
    const wrapper = mount(StationDetailsTable, {
      props: { selections: ['Tmin'], data: null }
    });
    expect(wrapper.text()).toContain('Keine Daten verfügbar');
    // computed explizit lesen, damit der fruehe Return in tableData sicher ausgefuehrt wird
    // @ts-ignore
    expect(wrapper.vm.tableData).toEqual([]);
  });

  it('sollte Fallback-Jahre nutzen, wenn Request-Daten fehlen (Zeilen 22-26)', () => {
    const mockDataNoRequest = {
      year: { data: [{ year: 2015 }, { year: 2010 }] }
    };
    const wrapper = mount(StationDetailsTable, {
      props: { selections: ['Ganzes Jahr Tmin'], data: mockDataNoRequest }
    });
    // Prüfen, ob Jahre sortiert werden
    // @ts-ignore
    expect(wrapper.vm.tableData[0].year).toBe(2015);
  });

  it('sollte Saisons korrekt mappen (Zeilen 52-56)', () => {
    const mockDataWithSeasons = {
      seasons: {
        WINTER: { data: [{ year: 2020, tmin_mean_c: -5 }] },
        SUMMER: { data: [{ year: 2020, tmin_mean_c: 15 }] }
      }
    };
    const wrapper = mount(StationDetailsTable, {
      props: { selections: ['Winter Tmin', 'Sommer Tmin'], data: mockDataWithSeasons }
    });
    expect(wrapper.text()).toContain('-5,0 °C');
    expect(wrapper.text()).toContain('15,0 °C');
  });

  it('sollte leeres Array zurückgeben wenn absolut keine Daten da sind (Zeile 26)', () => {
    const wrapper = mount(StationDetailsTable, {
      props: { selections: [], data: { request: {} } }
    });
    // @ts-ignore
    const range = wrapper.vm.buildYearRange({ request: {} }, []);
    expect(range).toEqual([]);
  });
});