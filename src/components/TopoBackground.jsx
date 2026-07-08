import { useEffect, useRef } from 'react';

export default function TopoBackground() {
  const svgRef = useRef(null);

  useEffect(() => {
    function draw() {
      const svg = svgRef.current;
      if (!svg) return;
      const w = window.innerWidth;
      const h = document.body.scrollHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      let paths = '';
      const lines = 9;
      for (let i = 0; i < lines; i++) {
        const baseY = (h / lines) * i + 40;
        const segs = 8;
        let d = `M0,${baseY}`;
        for (let s = 1; s <= segs; s++) {
          const x = (w / segs) * s;
          const wob = Math.sin(i * 1.7 + s * 1.3) * 26;
          d += ` L${x},${baseY + wob}`;
        }
        paths += `<path d="${d}" fill="none" stroke="#3c4b3a" stroke-width="1"></path>`;
      }
      svg.innerHTML = paths;
    }

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(document.body);
    window.addEventListener('resize', draw);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, []);

  return <svg className="topo-bg" ref={svgRef} xmlns="http://www.w3.org/2000/svg"></svg>;
}
