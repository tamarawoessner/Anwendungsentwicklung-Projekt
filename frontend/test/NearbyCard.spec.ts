import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import NearbyCard from '../src/components/NearbyCard.vue';

describe('NearbyCard.vue', () => {
  it('sollte den Lade-Zustand (Skeleton) anzeigen, wenn keine Station übergeben wurde', async () => {
    const wrapper = mount(NearbyCard);
    
    expect(wrapper.text()).toContain('#---');
    expect(wrapper.text()).toContain('Warten auf Suche...');
    
    expect(wrapper.classes()).toContain('is-skeleton');
  });

  it('sollte beim Klick im Lade-Zustand kein Event auslösen', async () => {
    const wrapper = mount(NearbyCard);
    
    await wrapper.trigger('click');
    
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('sollte die Stationsdaten korrekt anzeigen und formatieren', () => {
    const mockStation = {
      station_id: 'STAT-123',
      name: 'Schwarzwald-Station',
      distance_km: 12.345
    };

    const wrapper = mount(NearbyCard, {
      props: { station: mockStation }
    });

    expect(wrapper.text()).toContain('#STAT-123');
    expect(wrapper.text()).toContain('Schwarzwald-Station');
    
    expect(wrapper.text()).toContain('12,3 km');
  });

  it('sollte als Titel die station_id anzeigen, falls der Name fehlt', () => {
    const mockStation = {
      station_id: 'STAT-NONAME',
      name: '',
      distance_km: 5
    };

    const wrapper = mount(NearbyCard, {
      props: { station: mockStation }
    });

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

    await wrapper.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('select');
    
    const emittedEvent = (wrapper.emitted('select') as any[])[0][0];
    expect(emittedEvent).toEqual(mockStation);
  });
});
