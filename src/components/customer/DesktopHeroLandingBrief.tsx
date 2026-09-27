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
    <aside className={`desktop-hero-stroke-card ${className}`} aria-label="Sai Darshan Mart">
      <div className="desktop-hero-stroke__top-tag">
        <span className="material-symbols-outlined desktop-hero-stroke__tag-icon">storefront</span>
        <span className="desktop-hero-stroke__tag-text">AAPKI APNI SUPERMARKET • JABALPUR</span>
      </div>

      <div className="desktop-hero-stroke__lines-container">
        <StrokeText
          lines={["SAI DARSHAN", "MART"]}
          lineHeight={1.16}
          mobileFontSize={100}
          highlightWord="MART"
          highlightColor={isDark ? '#81C995' : '#1E8E3E'}
          highlightStrokeColor={isDark ? '#81C995' : '#1E8E3E'}
          strokeWidth={1.8}
          drawDuration={1.3}
          fillDelay={0.12}
          stagger={0.035}
          ease="power2.out"
          trigger="mount"
          fillMode="wipe"
          fontSize={88}
          fontWeight={800}
          fontFamily="var(--font-syne), 'Syne', sans-serif"
          letterSpacing={0}
          align="left"
          className="w-full"
        />
      </div>

      <div className="desktop-hero-stroke__motto-line">
        <span className="desktop-hero-stroke__motto-text">There is only one boss: The Customer</span>
        <BeatingHeart />
      </div>

      <div className="desktop-hero-stroke__narrative">
        <TypingText
          text="Jabalpur's trusted neighborhood supermarket delivering authentic quality, farm-fresh grocery essentials, pure unadulterated spices, and household provisions directly to your doorstep with honest pricing and genuine care."
          speed={22}
          startDelay={500}
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
