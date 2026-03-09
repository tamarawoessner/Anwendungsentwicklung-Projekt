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
});