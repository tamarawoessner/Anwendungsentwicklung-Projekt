import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import RadialSeasonMenu from '../src/components/RadialSeasonMenu.vue';

describe('RadialSeasonMenu.vue', () => {
  it('sollte bei Klick auf eine Jahreszeit das selection-changed Event feuern', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    // Wir suchen den Pfad für "Winter" (der erste outer-slice)
    const winterPath = wrapper.find('.outer-slice');
    await winterPath.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('selection-changed');
    expect(wrapper.emitted('selection-changed')![0]).toEqual(['Winter']);
  });

  it('sollte die "active" Klasse korrekt setzen', () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: ['Winter Tmin'] }
    });

    // Der innere Pfad für Winter Tmin sollte aktiv sein
    const activeSlice = wrapper.find('.inner-slice.active');
    expect(activeSlice.exists()).toBe(true);
  });

  it('sollte Hover-Zustände verwalten', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const winterPath = wrapper.find('.outer-slice');
    await winterPath.trigger('mouseenter');
    // @ts-ignore - Zugriff auf internes ref für Coverage
    expect(wrapper.vm.hoveredOuter).toBe('Winter');

    await winterPath.trigger('mouseleave');
    // @ts-ignore
    expect(wrapper.vm.hoveredOuter).toBe(null);
  });

  it('sollte Klicks auf das Ganzes-Jahr-Rad (zweites Rad) verarbeiten', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    // Wir suchen das Ganzes-Jahr-Segment im zweiten SVG (Zeilen 110-113)
    const yearWheel = wrapper.findAll('.outer-slice').at(4); // Das 5. Segment ist "Ganzes Jahr"
    await yearWheel?.trigger('click');
    expect(wrapper.emitted('selection-changed')![0]).toEqual(['Ganzes Jahr']);

    // Hover auf das Jahr-Rad (Zeilen 73-86 Logik)
    await yearWheel?.trigger('mouseenter');
    // @ts-ignore
    expect(wrapper.vm.hoveredOuter).toBe('Ganzes Jahr');
  });

  it('sollte innere Segmente des Jahres-Rads toggeln', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const innerYearMin = wrapper.findAll('.inner-slice').at(8); // Tmin Ganzes Jahr
    await innerYearMin?.trigger('click');
    expect(wrapper.emitted('selection-changed')![0]).toEqual(['Ganzes Jahr Tmin']);
  });

  it('sollte isHoverLinked Logik komplett abdecken', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    // 1. Hover auf Winter
    const winterPath = wrapper.find('.outer-slice');
    await winterPath.trigger('mouseenter');
    
    // @ts-ignore - Prüfen ob inneres Segment nun 'linked-hover' Klasse hat
    expect(wrapper.find('.inner-slice').classes()).toContain('linked-hover');

    // 2. Jetzt Winter Tmin aktivieren
    await wrapper.setProps({ activeSelections: ['Winter Tmin'] });
    
    // @ts-ignore - Wenn schon eins aktiv ist, sollte linked-hover false sein (Zeile 85-86)
    const isLinked = wrapper.vm.isHoverLinked('Winter Tmax');
    expect(isLinked).toBe(false);
  });
});