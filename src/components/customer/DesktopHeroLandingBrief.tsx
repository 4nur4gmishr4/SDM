import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts';
import { StrokeText, BeatingHeart, TypingText } from '../common';
import './DesktopHeroLandingBrief.css';

interface DesktopHeroLandingBriefProps {
  className?: string;
}

export function DesktopHeroLandingBrief({ className = '' }: DesktopHeroLandingBriefProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <aside className={`desktop-hero-stroke-card ${className}`} aria-label="Sai Darshan Shopping Mart">
      <div className="desktop-hero-stroke__lines-container">
        <StrokeText
          lines={["SAI", "DARSHAN", "SHOPPING", "MART"]}
          lineHeight={1.06}
          mobileFontSize={36}
          highlightWord="MART"
          strokeColor={isDark ? '#FFFFFF' : '#1A1C19'}
          fillColor={isDark ? '#FFFFFF' : '#1A1C19'}
          highlightColor={isDark ? '#81C995' : '#1E8E3E'}
          highlightStrokeColor={isDark ? '#81C995' : '#1E8E3E'}
          strokeWidth={1.8}
          drawDuration={1.3}
          fillDelay={0.12}
          stagger={0.035}
          ease="power2.out"
          trigger="mount"
          fillMode="wipe"
          fontSize={52}
          fontWeight={800}
          fontFamily="var(--font-syne), 'Syne', sans-serif"
          letterSpacing={0}
          align="left"
          className="w-full"
        />
      </div>

      <div className="desktop-hero-stroke__motto-line">
        <span className="desktop-hero-stroke__motto-text">There is only one boss: The Customer</span>
        <BeatingHeart size={16} />
      </div>

      <div className="desktop-hero-stroke__narrative">
        <TypingText
          text="Jabalpur's trusted supermarket delivering farm-fresh groceries, pure spices, and daily essentials directly to your doorstep with fast local delivery."
          speed={12}
          startDelay={150}
        />
      </div>

      <div className="desktop-hero-stroke__bottom-row">
        <p className="desktop-hero-stroke__desc">
          Daily Fresh Groceries • Pure Spices • Fast Delivery
        </p>
        <Link to="/shop" className="desktop-hero-stroke__shop-btn">
          <span>Shop Now</span>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
        </Link>
      </div>
    </aside>
  );
}
