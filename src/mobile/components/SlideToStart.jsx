import { useRef, useState } from 'react';

export default function SlideToStart({ onComplete }) {
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const completedBySlideRef = useRef(false);
  const [distance, setDistance] = useState(0);

  const travel = () => Math.max(0, (trackRef.current?.clientWidth || 0) - 66);
  const position = (event) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(travel(), Math.max(0, event.clientX - rect.left - 31));
  };
  const start = (event) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDistance(position(event));
  };
  const move = (event) => {
    if (draggingRef.current) setDistance(position(event));
  };
  const finish = (event) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const completed = position(event) >= travel() * .72;
    setDistance(0);
    if (completed) {
      completedBySlideRef.current = true;
      onComplete?.();
    }
  };

  return <div className="ayna-slide-start" ref={trackRef}>
    <span className="ayna-slide-start-fill" style={{ width: `${distance + 58}px` }} aria-hidden="true" />
    <span className="ayna-slide-start-label" aria-hidden="true">Get matched <span>slide to start</span></span>
    <button
      type="button"
      className="ayna-slide-start-handle"
      aria-label="Slide or tap to get matched"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={() => { draggingRef.current = false; setDistance(0); }}
      onClick={() => {
        if (completedBySlideRef.current) { completedBySlideRef.current = false; return; }
        onComplete?.();
      }}
      style={{ transform: `translateX(${distance}px)` }}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>
    </button>
  </div>;
}
