import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import NearbyCard from '../src/components/NearbyCard.vue';

describe('NearbyCard.vue', () => {
  it('sollte den Lade-Zustand (Skeleton) anzeigen, wenn keine Station übergeben wurde', async () => {
    // Ohne props mounten
    const wrapper = mount(NearbyCard);
    
    // Prüfen, ob die Platzhalter-Texte da sind
    expect(wrapper.text()).toContain('#---');
    expect(wrapper.text()).toContain('Warten auf Suche...');
    
    // Prüfen, ob CSS-Klasse für Skelett gesetzt ist
    expect(wrapper.classes()).toContain('is-skeleton');
  });

  it('sollte beim Klick im Lade-Zustand kein Event auslösen', async () => {
    const wrapper = mount(NearbyCard);
    
    // Klick simulieren
    await wrapper.trigger('click');
    
    // Es darf kein 'select'-Event geben
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('sollte die Stationsdaten korrekt anzeigen und formatieren', () => {
    const mockStation = {
      station_id: 'STAT-123',
      name: 'Schwarzwald-Station',
      distance_km: 12.345 // Wir testen auch gleich, ob auf eine Nachkommastelle gerundet wird!
    };

    const wrapper = mount(NearbyCard, {
      props: { station: mockStation }
    });

    // Prüfen, ob der Text gerendert wird
    expect(wrapper.text()).toContain('#STAT-123');
    expect(wrapper.text()).toContain('Schwarzwald-Station');
    
    // Prüfen, ob die Distanz auf Deutsch formatiert wird (Komma statt Punkt und 1 Nachkommastelle)
    expect(wrapper.text()).toContain('12,3 km');
  });

  it('sollte als Titel die station_id anzeigen, falls der Name fehlt', () => {
    const mockStation = {
      station_id: 'STAT-NONAME',
      name: '', // Leerer Name
      distance_km: 5
    };

    const wrapper = mount(NearbyCard, {
      props: { station: mockStation }
    });

    // Er sollte nun auf die station_id zurückfallen
    const titleText = wrapper.find('.station-title').text();
    expect(titleText).toBe('STAT-NONAME');
  });

  it('sollte bei Klick das "select"-Event mit der Station auslösen', async () => {
    const mockStation = {
      station_id: 'STAT-123',
      name: 'Schwarzwald-Station',
      distance_km: 12.3
    };

    const wrapper = mount(NearbyCard, {
      props: { station: mockStation }
    });

    // Auf die gesamte Karte klicken
    await wrapper.trigger('click');

    // Prüfen, ob Event gefeuert wurde
    expect(wrapper.emitted()).toHaveProperty('select');
    
    // Prüfen, ob die exakte Station im Event mitgeschickt wurde
    const emittedEvent = (wrapper.emitted('select') as any[])[0][0];
    expect(emittedEvent).toEqual(mockStation);
  });
});
