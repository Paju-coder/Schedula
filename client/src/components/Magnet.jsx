import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Magnet({ children, strength = 30, className = "" }) {
  const magnetRef = useRef(null);

  useEffect(() => {
    const el = magnetRef.current;
    
    const mouseMove = (e) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();
      
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      
      gsap.to(el, {
        x: x * (strength / 100),
        y: y * (strength / 100),
        duration: 0.5,
        ease: "power2.out"
      });
    };

    const mouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    };

    el.addEventListener('mousemove', mouseMove);
    el.addEventListener('mouseleave', mouseLeave);

    return () => {
      el.removeEventListener('mousemove', mouseMove);
      el.removeEventListener('mouseleave', mouseLeave);
    };
  }, [strength]);

  return (
    <div ref={magnetRef} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}
