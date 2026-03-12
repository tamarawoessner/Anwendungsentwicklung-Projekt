import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import RadialSeasonMenu from '../src/components/RadialSeasonMenu.vue';

describe('RadialSeasonMenu.vue', () => {
  it('sollte bei Klick auf eine Jahreszeit das selection-changed Event feuern', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    // First outer slice represents "Winter".
    const winterPath = wrapper.find('.outer-slice');
    await winterPath.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('selection-changed');
    expect(wrapper.emitted('selection-changed')![0]).toEqual(['Winter']);
  });

  it('sollte die "active" Klasse korrekt setzen', () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: ['Winter Tmin'] }
    });

    const activeSlice = wrapper.find('.inner-slice.active');
    expect(activeSlice.exists()).toBe(true);
  });

  it('sollte Hover-Zustände verwalten', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const winterPath = wrapper.find('.outer-slice');
    await winterPath.trigger('mouseenter');
    // @ts-ignore Access internal ref to assert hover state changes.
    expect(wrapper.vm.hoveredOuter).toBe('Winter');

    await winterPath.trigger('mouseleave');
    // @ts-ignore
    expect(wrapper.vm.hoveredOuter).toBe(null);
  });

  it('sollte Klicks auf das Ganzes-Jahr-Rad (zweites Rad) verarbeiten', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    // The 5th outer slice belongs to the "Ganzes Jahr" wheel.
    const yearWheel = wrapper.findAll('.outer-slice').at(4);
    await yearWheel?.trigger('click');
    expect(wrapper.emitted('selection-changed')![0]).toEqual(['Ganzes Jahr']);

    await yearWheel?.trigger('mouseenter');
    // @ts-ignore
    expect(wrapper.vm.hoveredOuter).toBe('Ganzes Jahr');
  });

  it('sollte innere Segmente des Jahres-Rads toggeln', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const innerYearMin = wrapper.findAll('.inner-slice').at(8);
    await innerYearMin?.trigger('click');
    expect(wrapper.emitted('selection-changed')![0]).toEqual(['Ganzes Jahr Tmin']);
  });

  it('sollte isHoverLinked Logik komplett abdecken', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const winterPath = wrapper.find('.outer-slice');
    await winterPath.trigger('mouseenter');
    
    // @ts-ignore A linked inner slice should preview with the linked-hover class.
    expect(wrapper.find('.inner-slice').classes()).toContain('linked-hover');

    await wrapper.setProps({ activeSelections: ['Winter Tmin'] });
    
    // @ts-ignore If one value in a group is active, linked hover preview is disabled.
    const isLinked = wrapper.vm.isHoverLinked('Winter Tmax');
    expect(isLinked).toBe(false);
  });

  it('sollte isActive fuer Outer-Gruppen korrekt auswerten', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    expect(wrapper.vm.isActive('Winter')).toBe(false);

    await wrapper.setProps({ activeSelections: ['Winter Tmin'] });
    expect(wrapper.vm.isActive('Winter')).toBe(true);

    await wrapper.setProps({ activeSelections: ['Winter Tmax'] });
    expect(wrapper.vm.isActive('Winter')).toBe(true);
  });

  it('sollte isActive fuer ein einzelnes inneres Segment korrekt auswerten', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: ['Sommer Tmax'] }
    });

    expect(wrapper.vm.isActive('Sommer Tmax')).toBe(true);
    expect(wrapper.vm.isActive('Sommer Tmin')).toBe(false);
  });

  it('sollte isHoverLinked false liefern, wenn kein Outer-Segment gehovert ist', () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    expect(wrapper.vm.isHoverLinked('Winter Tmin')).toBe(false);
  });

  it('sollte isHoverLinked false liefern, wenn Segment nicht zur gehoverten Gruppe gehoert', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const winterPath = wrapper.findAll('.outer-slice').at(0);
    await winterPath?.trigger('mouseenter');

    expect(wrapper.vm.isHoverLinked('Herbst Tmin')).toBe(false);
  });

  it('sollte bei komplett inaktiver Gruppe beide verknuepften Segmente als linked-hover werten', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const springPath = wrapper.findAll('.outer-slice').at(1);
    await springPath?.trigger('mouseenter');

    expect(wrapper.vm.isHoverLinked('Frühling Tmin')).toBe(true);
    expect(wrapper.vm.isHoverLinked('Frühling Tmax')).toBe(true);
  });

  it('sollte Hover-Handler fuer alle Outer-Segmente ausfuehren', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const expectedOuter = ['Winter', 'Frühling', 'Sommer', 'Herbst', 'Ganzes Jahr'];
    const outerSlices = wrapper.findAll('.outer-slice');

    expect(outerSlices).toHaveLength(expectedOuter.length);

    for (let i = 0; i < outerSlices.length; i += 1) {
      await outerSlices[i].trigger('mouseenter');
      expect(wrapper.vm.hoveredOuter).toBe(expectedOuter[i]);

      await outerSlices[i].trigger('mouseleave');
      expect(wrapper.vm.hoveredOuter).toBe(null);
    }
  });

  it('sollte Klicks fuer alle Inner-Segmente emittieren', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const expectedInnerSelections = [
      'Winter Tmin',
      'Winter Tmax',
      'Frühling Tmin',
      'Frühling Tmax',
      'Sommer Tmin',
      'Sommer Tmax',
      'Herbst Tmin',
      'Herbst Tmax',
      'Ganzes Jahr Tmin',
      'Ganzes Jahr Tmax'
    ];

    const innerSlices = wrapper.findAll('.inner-slice');
    expect(innerSlices).toHaveLength(expectedInnerSelections.length);

    for (const slice of innerSlices) {
      await slice.trigger('click');
    }

    const emissions = wrapper.emitted('selection-changed') ?? [];
    const emittedSelections = emissions.map((entry) => entry[0]);
    expect(emittedSelections).toEqual(expectedInnerSelections);
  });

  it('sollte Klicks auf Fruehling, Sommer und Herbst emittieren', async () => {
    const wrapper = mount(RadialSeasonMenu, {
      props: { activeSelections: [] }
    });

    const outerSlices = wrapper.findAll('.outer-slice');
    await outerSlices[1].trigger('click');
    await outerSlices[2].trigger('click');
    await outerSlices[3].trigger('click');

    const emissions = wrapper.emitted('selection-changed') ?? [];
    expect(emissions.map((e) => e[0])).toEqual(['Frühling', 'Sommer', 'Herbst']);
  });
});