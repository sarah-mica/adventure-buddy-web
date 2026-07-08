export default function ElevationProfile({ stops }) {
  const w = 300, h = 34;
  if (!stops || stops.length < 2) {
    return <svg className="elev" viewBox={`0 0 ${w} ${h}`}></svg>;
  }
  const elevs = stops.map(s => parseFloat(s.elev) || 0);
  let acc = 0;
  const cum = elevs.map(e => (acc += e));
  const min = Math.min(0, ...cum), max = Math.max(1, ...cum);
  const range = (max - min) || 1;
  const pts = cum.map((v, i) => {
    const x = (i / (cum.length - 1)) * (w - 4) + 2;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x},${y}`;
  });
  const path = 'M' + pts.join(' L');
  const areaPath = path + ` L${w - 2},${h - 2} L2,${h - 2} Z`;

  return (
    <svg className="elev" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={areaPath} fill="var(--sage)" opacity="0.15" />
      <path d={path} fill="none" stroke="var(--sage)" strokeWidth="1.5" />
    </svg>
  );
}
