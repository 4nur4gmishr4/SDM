import { useState, useEffect, useRef } from 'react';
import './TypingText.css';

interface TypingTextProps {
  text: string;
  speed?: number; // ms per character
  startDelay?: number; // ms before typing starts
  showCursor?: boolean;
  className?: string;
}

export function TypingText({
  text,
  speed = 28,
  startDelay = 600,
  showCursor = true,
  className = '',
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsTypingComplete(true);
      return;
    }

    setDisplayedText('');
    setIsTypingComplete(false);

    let charIndex = 0;
    
    const timeout = setTimeout(() => {
      timerRef.current = setInterval(() => {
        charIndex++;
        setDisplayedText(text.slice(0, charIndex));
        
        if (charIndex >= text.length) {
          clearInterval(timerRef.current);
          setIsTypingComplete(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={`typing-text-wrapper ${className}`}>
      <span>{displayedText}</span>
      {showCursor && (
        <span className={`typing-cursor ${isTypingComplete ? 'typing-cursor--idle' : ''}`}>
          |
        </span>
      )}
    </span>
  );
}

export default TypingText;
