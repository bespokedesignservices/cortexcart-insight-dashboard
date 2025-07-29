'use client';

import React, { useState, memo } from 'react';
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CountryMapChart = ({ chartData }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  // The component will now re-render whenever chartData changes.
  // We can safely check for the data here.
  if (!chartData || chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No location data available.</div>;
  }

  // Process the data directly inside the component render.
  const dataMap = chartData.reduce((acc, { country, value }) => {
    if (country) {
      acc[country.toUpperCase()] = (acc[country.toUpperCase()] || 0) + value;
    }
    return acc;
  }, {});

  const maxValue = Math.max(...Object.values(dataMap), 0);

  const colorScale = scaleLinear()
    .domain([0, maxValue])
    .range(["#E6F2FF", "#0052B3"]);

  return (
    <>
      <div data-tooltip-id="country-tooltip" className="h-full w-full">
        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
          <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => {
                const countryCode = geo.properties.iso_a3; // 3-letter code
                const value = dataMap[countryCode] || 0;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      const { name } = geo.properties;
                      setTooltipContent(`${name} — ${value.toLocaleString()} visitors`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    style={{
                      default: {
                        fill: value > 0 ? colorScale(value) : '#F5F4F6',
                        outline: 'none'
                      },
                      hover: { fill: '#0052B3', outline: 'none' },
                      pressed: { fill: '#003E8A', outline: 'none' }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <Tooltip id="country-tooltip" content={tooltipContent} />
    </>
  );
};

export default memo(CountryMapChart);