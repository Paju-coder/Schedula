import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SplitText({ text, className = "", delay = 0 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const chars = containerRef.current.querySelectorAll('.char');
    
    gsap.fromTo(chars, 
      { 
        y: 100, 
        opacity: 0,
        rotateX: -90
      },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        stagger: 0.02,
        duration: 0.8,
        delay: delay,
        ease: "power4.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        }
      }
    );
  }, [delay]);

  return (
    <span ref={containerRef} className={`inline-block perspective-1000 ${className}`}>
      {text.split("").map((char, i) => (
        <span 
          key={i} 
          className="char inline-block will-change-transform"
          style={{ display: char === " " ? "inline" : "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
