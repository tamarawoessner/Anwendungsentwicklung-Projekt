import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../src/components/Sidebar.vue';

describe('Sidebar.vue', () => {
  const defaultProps = {
    stations: [],
    resultsCount: 0,
    hasSearched: false
  };

  it('sollte bei gültigen Eingaben das search-Event mit korrekten Daten auslösen', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    await wrapper.find('#latitude').setValue('48.05');
    await wrapper.find('#longitude').setValue('8.46');
    await wrapper.find('#radius').setValue(30);

    await wrapper.find('.search-button').trigger('click');

    expect(wrapper.emitted()).toHaveProperty('search');
    
    const emittedPayload = (wrapper.emitted('search') as any[])[0][0];
    expect(emittedPayload.lat).toBe(48.05);
    expect(emittedPayload.lng).toBe(8.46);
    expect(emittedPayload.radius).toBe(30);
    
    expect(wrapper.find('.form-error').exists()).toBe(false);
  });

  it('sollte einen Fehler anzeigen, wenn die Koordinaten fehlen', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    
    await wrapper.find('.search-button').trigger('click');

    expect(wrapper.emitted('search')).toBeUndefined();
    expect(wrapper.find('.form-error').exists()).toBe(true);
    expect(wrapper.find('.form-error').text()).toContain('Bitte Breiten- und Längengrad ausfüllen');
  });

  it('sollte einen Fehler werfen, wenn die Koordinaten ungültig sind (z.B. Breite > 90)', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    
    await wrapper.find('#latitude').setValue('100'); 
    await wrapper.find('#longitude').setValue('8.46');
    
    await wrapper.find('.search-button').trigger('click');

    expect(wrapper.emitted('search')).toBeUndefined();
    expect(wrapper.find('.form-error').text()).toContain('Ungültige Koordinaten');
  });

  it('sollte einen Fehler werfen, wenn das Startjahr nach dem Endjahr liegt', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    
    await wrapper.find('#latitude').setValue('48.05');
    await wrapper.find('#longitude').setValue('8.46');
    
    await wrapper.find('#start-year').setValue('2020');
    await wrapper.find('#end-year').setValue('2010'); 
    
    await wrapper.find('.search-button').trigger('click');

    expect(wrapper.emitted('search')).toBeUndefined();
    expect(wrapper.find('.form-error').text()).toContain('Das Startjahr darf nicht nach dem Endjahr liegen');
  });

  it('sollte die initialSearch-Werte (aus der URL/Session) korrekt anwenden', async () => {
    // 1. Wir bauen die Komponente erst mit leeren Standardwerten auf
    const wrapper = mount(Sidebar, {
      props: defaultProps
    });

    // 2. Wir simulieren, dass die Daten von außen reinkommen 
    // (das löst deinen "watch" aus und wartet automatisch auf das HTML-Update!)
    await wrapper.setProps({
      initialSearch: {
        lat: 48.05,
        lng: 8.46,
        radius: 50,
        startYear: 2000,
        endYear: 2010,
        limit: 10
      }
    });

    // 3. Jetzt prüfen wir die HTML-Felder
    const latInput = wrapper.find('#latitude').element as HTMLInputElement;
    const startYearInput = wrapper.find('#start-year').element as HTMLInputElement;

    expect(latInput.value).toBe('48.05');
    expect(startYearInput.value).toBe('2000');
  });

  it('sollte ungültige Tasteneingaben im Breitengrad-Feld verhindern', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    const input = wrapper.find('#latitude');

    const event = {
      key: 'a',
      preventDefault: vi.fn(),
      ctrlKey: false,
      metaKey: false
    };
    
    // Wir lösen das Event manuell aus, da jsdom echte Key-Events manchmal ignoriert
    await input.trigger('keydown', event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('sollte das Einfügen von Buchstaben verhindern', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    
    // Wir erstellen ein Fake-Event, das exakt die Struktur hat, die dein Code braucht
    const spy = vi.fn();
    const fakeEvent = {
      clipboardData: {
        getData: () => 'ABC'
      },
      preventDefault: spy
    } as unknown as ClipboardEvent;

    // Wir rufen die Methode direkt auf der Instanz auf
    // @ts-ignore - wir greifen hier absichtlich direkt auf die Methode zu
    wrapper.vm.blockInvalidCoordinatePaste(fakeEvent);
    
    expect(spy).toHaveBeenCalled();
  });

  it('sollte das Filter-Menü öffnen und das Limit ändern', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    
    // Filter-Icon klicken
    await wrapper.find('.filter-wrapper img').trigger('click');
    expect(wrapper.find('.filter-dropdown').exists()).toBe(true);
    
    // Auf den "Top 5" Button klicken
    const buttons = wrapper.findAll('.limit-chip');
    await buttons[4].trigger('click'); // Index 4 ist meistens "Top 5"
    
    // Prüfen, ob das Menü danach schließt
    expect(wrapper.find('.filter-dropdown').exists()).toBe(false);
  });

  it('sollte Fehler bei ungültigen Jahreszahlen anzeigen', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    await wrapper.find('#latitude').setValue('48');
    await wrapper.find('#longitude').setValue('8');

    // Fall 1: Jahr zu kurz (nicht vierstellig)
    await wrapper.find('#start-year').setValue('999');
    await wrapper.find('.search-button').trigger('click');
    expect(wrapper.find('.form-error').text()).toContain('vierstellig');

    // Fall 2: Endjahr in der Zukunft
    const futureYear = new Date().getFullYear() + 1;
    await wrapper.find('#start-year').setValue('2000');
    await wrapper.find('#end-year').setValue(futureYear.toString());
    await wrapper.find('.search-button').trigger('click');
    expect(wrapper.find('.form-error').text()).toContain('nicht größer als');
  });

  it('sollte das Menü schließen, wenn man außerhalb klickt', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    
    // 1. Menü öffnen
    await wrapper.find('.filter-wrapper img').trigger('click');
    expect(wrapper.vm.isFilterMenuOpen).toBe(true);

    // 2. Einen Klick auf das document (außerhalb) simulieren
    document.dispatchEvent(new MouseEvent('click'));
    
    // Da jsdom den Click-Event-Zyklus manchmal verzögert:
    expect(wrapper.vm.isFilterMenuOpen).toBe(false);
  });

  it('sollte den Event-Listener beim Unmount entfernen', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const wrapper = mount(Sidebar, { props: defaultProps });
    
    wrapper.unmount();
    
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('sollte ungültige Zeichen im Radius-Feld blockieren', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    // Wir suchen direkt nach der Klasse, die du im Template vergeben hast
    const radiusInput = wrapper.find('.slider-value'); 
    
    const preventSpy = vi.fn();
    await radiusInput.trigger('keydown', { key: 'e', preventDefault: preventSpy });
    expect(preventSpy).toHaveBeenCalled();
  });

  it('sollte ungültiges Einfügen im Radius-Feld blockieren', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    const preventSpy = vi.fn();

    const fakeEvent = {
      clipboardData: { getData: () => '1e3' },
      preventDefault: preventSpy
    } as unknown as ClipboardEvent;

    // @ts-ignore
    wrapper.vm.blockInvalidRadiusPaste(fakeEvent);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('sollte ungültige Zeichen im Jahr-Feld blockieren', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    const yearInput = wrapper.find('#start-year');
    
    const preventSpy = vi.fn();
    // Nur Zahlen sind erlaubt, also sollte 'a' blockiert werden
    await yearInput.trigger('keydown', { key: 'a', preventDefault: preventSpy });
    expect(preventSpy).toHaveBeenCalled();
  });

  it('sollte ungültiges Einfügen im Jahr-Feld blockieren', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    const yearInput = wrapper.find('#start-year');
    const preventSpy = vi.fn();

    // Wir rufen die Methode direkt auf, um sicherzugehen, dass die Logik greift
    const fakeEvent = {
      clipboardData: { getData: () => 'Nicht-Zahlen' },
      preventDefault: preventSpy
    } as unknown as ClipboardEvent;

    // @ts-ignore
    wrapper.vm.blockInvalidYearPaste(fakeEvent);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('sollte alle Fehlerpfade der Jahresvalidierung abdecken', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    await wrapper.find('#latitude').setValue('48');
    await wrapper.find('#longitude').setValue('8');

    // Pfad 1: Startjahr zu klein (< 1000) -> Zeile 209-211
    await wrapper.find('#start-year').setValue('999');
    await wrapper.find('.search-button').trigger('click');
    expect(wrapper.vm.formError).toContain('vierstellig');

    // Pfad 2: Endjahr zu klein (< 1000)
    await wrapper.find('#start-year').setValue('2000');
    await wrapper.find('#end-year').setValue('999');
    await wrapper.find('.search-button').trigger('click');
    expect(wrapper.vm.formError).toContain('vierstellig');

    // Pfad 3: Endjahr in der Zukunft -> Zeile 216-218
    const futureYear = new Date().getFullYear() + 1;
    await wrapper.find('#end-year').setValue(futureYear.toString());
    await wrapper.find('.search-button').trigger('click');
    expect(wrapper.vm.formError).toContain('nicht größer als');
  });

  it('sollte bei Klick auf Alle das Limit auf 500 setzen und eine Suche ausloesen', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    await wrapper.find('#latitude').setValue('48.05');
    await wrapper.find('#longitude').setValue('8.46');

    await wrapper.find('.filter-wrapper img').trigger('click');
    await wrapper.find('.limit-chip-all').trigger('click');

    const emissions = wrapper.emitted('search') ?? [];
    expect(emissions.length).toBeGreaterThan(0);
    expect(emissions[emissions.length - 1][0].limit).toBe(500);
  });

  it('sollte bei Klick auf eine Stationskarte station-select emittieren', async () => {
    const station = {
      name: 'Teststation',
      station_id: 'TEST001',
      lat: 48.1,
      lon: 8.5,
      distance_km: 2.3,
      start_year: 1990,
      end_year: 2020
    };

    const wrapper = mount(Sidebar, {
      props: {
        stations: [station],
        resultsCount: 1,
        hasSearched: true
      }
    });

    await wrapper.find('.stationcard-wrapper').trigger('click');

    expect(wrapper.emitted('station-select')).toBeTruthy();
    expect(wrapper.emitted('station-select')![0]).toEqual([station]);
  });

  it('sollte den Radius ueber das Zahlenfeld per v-model uebernehmen', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    await wrapper.find('#latitude').setValue('48.05');
    await wrapper.find('#longitude').setValue('8.46');

    const radiusNumberInput = wrapper.find('.slider-value');
    await radiusNumberInput.setValue('42');

    await wrapper.find('.search-button').trigger('click');

    const emissions = wrapper.emitted('search') ?? [];
    expect(emissions.length).toBeGreaterThan(0);
    expect(emissions[emissions.length - 1][0].radius).toBe(42);
  });

  it('sollte im Filter-Header die Singular-Variante anzeigen (Top 1 Station)', async () => {
    const wrapper = mount(Sidebar, {
      props: {
        ...defaultProps,
        initialSearch: {
          lat: 48.05,
          lng: 8.46,
          radius: 20,
          startYear: null,
          endYear: null,
          limit: 1
        }
      }
    });

    await wrapper.find('.filter-wrapper img').trigger('click');
    expect(wrapper.find('.dropdown-header').text()).toContain('Top 1 Station');
  });

  it('sollte im Filter-Header die Alle-Variante anzeigen', async () => {
    const wrapper = mount(Sidebar, {
      props: {
        ...defaultProps,
        initialSearch: {
          lat: 48.05,
          lng: 8.46,
          radius: 20,
          startYear: null,
          endYear: null,
          limit: 500
        }
      }
    });

    await wrapper.find('.filter-wrapper img').trigger('click');
    expect(wrapper.find('.dropdown-header').text()).toContain('Alle Stationen');
  });

  it('sollte bei leerer Suche nach einer Suche den Zustand Keine Treffer anzeigen', () => {
    const wrapper = mount(Sidebar, {
      props: {
        stations: [],
        resultsCount: 0,
        hasSearched: true
      }
    });

    expect(wrapper.text()).toContain('Keine Treffer');
  });

  it('sollte als Stationslabel auf station_id zurückfallen, wenn kein Name vorhanden ist', () => {
    const wrapper = mount(Sidebar, {
      props: {
        stations: [{
          name: '',
          station_id: 'FALLBACK001',
          lat: 48,
          lon: 8,
          distance_km: 1,
          start_year: 2000,
          end_year: 2020
        }],
        resultsCount: 1,
        hasSearched: true
      }
    });

    expect(wrapper.find('.station-name').text()).toBe('FALLBACK001');
  });

  it('sollte den Startjahr-Fehler beim erneuten Tippen zurücksetzen', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    await wrapper.find('#latitude').setValue('48');
    await wrapper.find('#longitude').setValue('8');
    await wrapper.find('#start-year').setValue('999');
    await wrapper.find('.search-button').trigger('click');
    expect(wrapper.vm.startYearError).toBe(true);

    await wrapper.find('#start-year').trigger('input');
    expect(wrapper.vm.startYearError).toBe(false);
    expect(wrapper.vm.formError).toBeNull();
  });

  it('sollte im Search-Payload nur Startjahr setzen, wenn Endjahr leer ist', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    await wrapper.find('#latitude').setValue('48.05');
    await wrapper.find('#longitude').setValue('8.46');
    await wrapper.find('#start-year').setValue('2005');
    await wrapper.find('#end-year').setValue('');
    await wrapper.find('.search-button').trigger('click');

    const emissions = wrapper.emitted('search') ?? [];
    expect(emissions.length).toBeGreaterThan(0);
    const payload = emissions[emissions.length - 1][0];
    expect(payload.startYear).toBe(2005);
    expect(payload.endYear).toBeNull();
  });

  it('sollte in der Ergebnisanzeige bei null einen Bindestrich zeigen', () => {
    const wrapper = mount(Sidebar, {
      props: {
        stations: [],
        resultsCount: null,
        hasSearched: false
      }
    });

    expect(wrapper.find('.results-count').text()).toContain('Anzahl der Ergebnisse: -');
  });

  it('sollte bei initialSearch mit radius null auf 20 zurückfallen', () => {
    const wrapper = mount(Sidebar, {
      props: {
        ...defaultProps,
        initialSearch: {
          lat: 48.05,
          lng: 8.46,
          radius: null,
          startYear: null,
          endYear: null,
          limit: 10
        }
      }
    });

    const radiusNumberInput = wrapper.find('.slider-value').element as HTMLInputElement;
    expect(radiusNumberInput.value).toBe('20');
  });

  it('sollte das Filter-Menü offen lassen, wenn innerhalb des Wrappers geklickt wird', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    await wrapper.find('.filter-wrapper img').trigger('click');
    expect(wrapper.vm.isFilterMenuOpen).toBe(true);

    const insideTarget = wrapper.find('.filter-wrapper').element;
    // @ts-ignore
    wrapper.vm.handleOutsideClick({ target: insideTarget } as MouseEvent);

    expect(wrapper.vm.isFilterMenuOpen).toBe(true);
  });

  it('sollte bei Klick-Events ohne Target nicht abstürzen und Menüzustand beibehalten', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    // @ts-ignore
    wrapper.vm.isFilterMenuOpen = true;
    // @ts-ignore
    wrapper.vm.handleOutsideClick({ target: null } as MouseEvent);

    expect(wrapper.vm.isFilterMenuOpen).toBe(true);
  });

  it('sollte im Search-Payload ein Endjahr setzen, wenn Endjahr gültig vorhanden ist', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    await wrapper.find('#latitude').setValue('48.05');
    await wrapper.find('#longitude').setValue('8.46');
    await wrapper.find('#start-year').setValue('2005');
    await wrapper.find('#end-year').setValue('2010');
    await wrapper.find('.search-button').trigger('click');

    const emissions = wrapper.emitted('search') ?? [];
    expect(emissions.length).toBeGreaterThan(0);
    const payload = emissions[emissions.length - 1][0];
    expect(payload.endYear).toBe(2010);
  });

  it('sollte normalizeRadius auf 20 zurücksetzen, wenn Radius kein endlicher Zahlenwert ist', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    // @ts-ignore
    wrapper.vm.radius = Number.NaN;
    // @ts-ignore
    wrapper.vm.normalizeRadius();

    // @ts-ignore
    expect(wrapper.vm.radius).toBe(20);
  });

  it('sollte erlaubte Coordinate-Keys nicht blockieren (ctrl/meta/nav/valide Zeichen)', async () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    const prevent1 = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidCoordinateChars({ key: 'a', ctrlKey: true, metaKey: false, preventDefault: prevent1 });
    expect(prevent1).not.toHaveBeenCalled();

    const prevent2 = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidCoordinateChars({ key: 'ArrowLeft', ctrlKey: false, metaKey: false, preventDefault: prevent2 });
    expect(prevent2).not.toHaveBeenCalled();

    const prevent3 = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidCoordinateChars({ key: '8', ctrlKey: false, metaKey: false, preventDefault: prevent3 });
    expect(prevent3).not.toHaveBeenCalled();
  });

  it('sollte gültiges Coordinate-Paste nicht blockieren', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    const prevent = vi.fn();

    const fakeEvent = {
      clipboardData: { getData: () => '48.06125, 8.53461' },
      preventDefault: prevent
    } as unknown as ClipboardEvent;

    // @ts-ignore
    wrapper.vm.blockInvalidCoordinatePaste(fakeEvent);
    expect(prevent).not.toHaveBeenCalled();
  });

  it('sollte erlaubte Year-Keys nicht blockieren (meta/nav/zahl)', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    const prevent1 = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidYearChars({ key: 'a', ctrlKey: false, metaKey: true, preventDefault: prevent1 });
    expect(prevent1).not.toHaveBeenCalled();

    const prevent2 = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidYearChars({ key: 'Home', ctrlKey: false, metaKey: false, preventDefault: prevent2 });
    expect(prevent2).not.toHaveBeenCalled();

    const prevent3 = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidYearChars({ key: '5', ctrlKey: false, metaKey: false, preventDefault: prevent3 });
    expect(prevent3).not.toHaveBeenCalled();
  });

  it('sollte gültiges Year-Paste und Radius-Paste nicht blockieren', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    const yearPrevent = vi.fn();
    const yearEvent = {
      clipboardData: { getData: () => '2020' },
      preventDefault: yearPrevent
    } as unknown as ClipboardEvent;
    // @ts-ignore
    wrapper.vm.blockInvalidYearPaste(yearEvent);
    expect(yearPrevent).not.toHaveBeenCalled();

    const radiusPrevent = vi.fn();
    const radiusEvent = {
      clipboardData: { getData: () => '42' },
      preventDefault: radiusPrevent
    } as unknown as ClipboardEvent;
    // @ts-ignore
    wrapper.vm.blockInvalidRadiusPaste(radiusEvent);
    expect(radiusPrevent).not.toHaveBeenCalled();
  });

  it('sollte weitere ungültige Radius-Keys (E,+,-) blockieren', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    const preventE = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidRadiusChars({ key: 'E', preventDefault: preventE });
    expect(preventE).toHaveBeenCalled();

    const preventPlus = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidRadiusChars({ key: '+', preventDefault: preventPlus });
    expect(preventPlus).toHaveBeenCalled();

    const preventMinus = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidRadiusChars({ key: '-', preventDefault: preventMinus });
    expect(preventMinus).toHaveBeenCalled();
  });

  it('sollte bei initialSearch ohne lat/lng auf leere Inputs zurückfallen', () => {
    const wrapper = mount(Sidebar, {
      props: {
        ...defaultProps,
        initialSearch: {
          lat: null,
          lng: null,
          radius: 20,
          startYear: null,
          endYear: null,
          limit: 10
        }
      }
    });

    const latInput = wrapper.find('#latitude').element as HTMLInputElement;
    const lngInput = wrapper.find('#longitude').element as HTMLInputElement;
    expect(latInput.value).toBe('');
    expect(lngInput.value).toBe('');
  });

  it('sollte bei initialSearch latInput/lngInput Strings direkt übernehmen', async () => {
    const wrapper = mount(Sidebar, {
      props: {
        ...defaultProps,
        initialSearch: {
          lat: 48.05,
          lng: 8.46,
          latInput: '48,05000',
          lngInput: '8,46000',
          radius: 20,
          startYear: null,
          endYear: null,
          limit: 10
        }
      }
    });

    await wrapper.vm.$nextTick();

    const latInput = wrapper.find('#latitude').element as HTMLInputElement;
    const lngInput = wrapper.find('#longitude').element as HTMLInputElement;
    expect(latInput.value).toBe('48,05000');
    expect(lngInput.value).toBe('8,46000');
  });

  it('sollte bei Paste ohne clipboardData nicht blockieren', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });

    const preventCoordinate = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidCoordinatePaste({ preventDefault: preventCoordinate } as ClipboardEvent);
    expect(preventCoordinate).not.toHaveBeenCalled();

    const preventYear = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidYearPaste({ preventDefault: preventYear } as ClipboardEvent);
    expect(preventYear).not.toHaveBeenCalled();

    const preventRadius = vi.fn();
    // @ts-ignore
    wrapper.vm.blockInvalidRadiusPaste({ preventDefault: preventRadius } as ClipboardEvent);
    expect(preventRadius).not.toHaveBeenCalled();
  });

  it('sollte gueltige Radius-Keys nicht blockieren', () => {
    const wrapper = mount(Sidebar, { props: defaultProps });
    const prevent = vi.fn();

    // @ts-ignore
    wrapper.vm.blockInvalidRadiusChars({ key: '5', preventDefault: prevent });
    expect(prevent).not.toHaveBeenCalled();
  });
});