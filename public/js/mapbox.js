/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoia3JzYW5qYXkxMSIsImEiOiJjbHU1MjFzeDQxZ3U1MnFudnp2MzRoNTViIn0.Ofc8cm-QiMxOhjHFg-oXqw';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/krsanjay11/clu53wic1012g01p7ark18h3j', // style URL
    scrollZoom: false,
    // center: [-74.5, 40], // starting position [lng, lat]
    // zoom: 9, // starting zoom,
    // interactive: false,
  });

  // create a bound variable
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  }); // moves and zooms the map right to the bounds
};
