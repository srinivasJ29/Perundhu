/**
 * PERUNDHU (பேருந்து) — Custom Leaflet SVG Map Icons
 * High-contrast, accessible vector icons adhering strictly to PERUNDHU design tokens:
 * - Deep teal: #071F21
 * - Primary teal: #1D7772
 * - Sage: #67958C
 * - Warm peach: #F5BE99
 * - Coral red: #F22932
 */

import L from 'leaflet';

/**
 * Creates a Leaflet DivIcon for a major bus terminal / bus stand.
 */
export function createBusStandIcon(
  isSelected = false,
  code = '',
  role?: 'ORIGIN' | 'DESTINATION' | null
): L.DivIcon {
  const isTerminalRole = role === 'ORIGIN' || role === 'DESTINATION';
  const size = isTerminalRole ? 42 : isSelected ? 40 : 34;

  let borderColor = '#FFFFFF';
  let borderWidth = '2px';
  let shadow = '0 2px 8px rgba(7, 31, 33, 0.25)';

  if (role === 'ORIGIN') {
    borderColor = '#10B981';
    borderWidth = '3px';
    shadow = '0 0 0 4px rgba(16, 185, 129, 0.45), 0 4px 14px rgba(7, 31, 33, 0.4)';
  } else if (role === 'DESTINATION') {
    borderColor = '#F22932';
    borderWidth = '3px';
    shadow = '0 0 0 4px rgba(242, 41, 50, 0.45), 0 4px 14px rgba(7, 31, 33, 0.4)';
  } else if (isSelected) {
    borderColor = '#F5BE99';
    borderWidth = '3px';
    shadow = '0 0 0 4px rgba(245, 190, 153, 0.4), 0 4px 12px rgba(7, 31, 33, 0.35)';
  }

  const roleBadgeHtml = role === 'ORIGIN'
    ? `<span style="position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #10B981; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap; font-family: system-ui, sans-serif;">START</span>`
    : role === 'DESTINATION'
    ? `<span style="position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #F22932; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap; font-family: system-ui, sans-serif;">END</span>`
    : '';

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      background: #071F21;
      border: ${borderWidth} solid ${borderColor};
      border-radius: 8px;
      box-shadow: ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      transition: transform 0.2s ease;
      cursor: pointer;
    " role="img" aria-label="Bus Stand ${code}">
      ${roleBadgeHtml}
      <svg width="${size * 0.52}" height="${size * 0.52}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10h16v10H4z"/>
        <path d="m2 10 10-6 10 6"/>
        <path d="M9 14h6v6H9z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'perundhu-bus-stand-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

/**
 * Creates a Leaflet DivIcon for an intermediate bus stop in a route sequence.
 */
export function createBusStopIcon(
  sequence: number,
  isSelected = false,
  isFareStage = false
): L.DivIcon {
  const size = isSelected ? 32 : 26;
  const bg = isSelected ? '#FACC15' : isFareStage ? '#0A0A0A' : '#18181B';
  const textColor = isSelected ? '#0A0A0A' : '#FFFFFF';
  const borderColor = isSelected ? '#0A0A0A' : '#FACC15';
  const borderWidth = isSelected ? '3px' : '2px';
  const shadow = isSelected
    ? '0 0 0 4px rgba(250, 204, 21, 0.6), 0 4px 10px rgba(0,0,0,0.4)'
    : '0 2px 6px rgba(0,0,0,0.3)';

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bg};
      border: ${borderWidth} solid ${borderColor};
      border-radius: 50%;
      box-shadow: ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${textColor};
      font-size: ${size * 0.42}px;
      font-weight: 800;
      font-family: 'Inter', system-ui, sans-serif;
      cursor: pointer;
    " role="img" aria-label="Stop ${sequence}">
      ${sequence}
    </div>
  `;

  return L.divIcon({
    className: 'perundhu-bus-stop-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

/**
 * Creates a Leaflet DivIcon for a real-time tracking bus with heading arrow.
 */
export function createBusLocationIcon(
  fleetNumber: string,
  heading = 0,
  isSimulated = true,
  isSelected = false
): L.DivIcon {
  const width = 44;
  const height = 44;
  const bg = '#0A0A0A';
  const badgeText = isSimulated ? 'SIM' : 'LIVE';
  const badgeBg = isSimulated ? '#FACC15' : '#22C55E';
  const badgeColor = '#0A0A0A';
  const borderColor = isSelected ? '#FFFFFF' : '#FACC15';

  const html = `
    <div style="position: relative; width: ${width}px; height: ${height}px;" role="img" aria-label="Bus ${fleetNumber}">
      <!-- Heading Arrow Rotation -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: rotate(${heading}deg);
        pointer-events: none;
      ">
        <svg width="${width}" height="${height}" viewBox="0 0 44 44">
          <polygon points="22,2 28,10 16,10" fill="#FACC15" stroke="#0A0A0A" stroke-width="1.5" />
        </svg>
      </div>

      <!-- Main Bus Circle -->
      <div style="
        position: absolute;
        top: 7px;
        left: 7px;
        width: 30px;
        height: 30px;
        background: ${bg};
        border: 2px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45), 0 0 8px rgba(250, 204, 21, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FACC15;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.6 19.1 6 18 6H4C2.9 6 1.9 6.6 1.6 7.8L.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/>
          <circle cx="7" cy="18" r="2"/>
          <path d="M9 18h5"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      </div>

      <!-- Truthful Source Badge -->
      <span style="
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        background: ${badgeBg};
        color: ${badgeColor};
        font-size: 9px;
        font-weight: 900;
        padding: 1px 5px;
        border-radius: 4px;
        border: 1px solid #0A0A0A;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.4);
        white-space: nowrap;
        font-family: system-ui, sans-serif;
      ">
        ${badgeText}
      </span>
    </div>
  `;

  return L.divIcon({
    className: 'perundhu-bus-live-marker',
    html,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    popupAnchor: [0, -height / 2]
  });
}

/**
 * Creates a Leaflet DivIcon for user's GPS device location beacon.
 */
export function createUserLocationIcon(): L.DivIcon {
  const size = 28;
  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    " role="img" aria-label="My Location">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(2, 132, 199, 0.25);
        animation: perundhuPulse 2s infinite ease-out;
      "></div>
      <div style="
        width: 14px;
        height: 14px;
        background: #0284C7;
        border: 2.5px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'perundhu-user-location-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}
