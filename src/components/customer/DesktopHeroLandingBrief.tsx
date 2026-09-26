import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts';
import { StrokeText } from '../common/StrokeText';
import './DesktopHeroLandingBrief.css';

interface DesktopHeroLandingBriefProps {
  className?: string;
}

export function DesktopHeroLandingBrief({ className = '' }: DesktopHeroLandingBriefProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Exact color update matching our supermarket brand
  const strokeColor = isDark ? '#81C995' : '#1E8E3E';
  const fillColor = isDark ? '#F8FAFC' : '#1E8E3E';

  return (
    <aside className={`desktop-hero-stroke-card ${className}`} aria-label="Sai Darshan Mart">
      <div className="desktop-hero-stroke__top-tag">
        <span className="material-symbols-outlined desktop-hero-stroke__tag-icon">storefront</span>
        <span className="desktop-hero-stroke__tag-text">AAPKI APNI SUPERMARKET • JABALPUR</span>
      </div>

      <div className="desktop-hero-stroke__lines-container">
        {/* Line 1: SAI */}
        <div className="desktop-hero-stroke__line">
          <StrokeText
            text="SAI"
            strokeColor={strokeColor}
            fillColor={fillColor}
            fontSize={56}
            fontWeight={900}
            letterSpacing={-1}
            strokeWidth={1.4}
            drawDuration={1.4}
            fillDelay={0.15}
            trigger="mount"
            fillMode="wipe"
          />
        </div>

        {/* Line 2: DARSHAN */}
        <div className="desktop-hero-stroke__line">
          <StrokeText
            text="DARSHAN"
            strokeColor={strokeColor}
            fillColor={fillColor}
            fontSize={56}
            fontWeight={900}
            letterSpacing={-1}
            strokeWidth={1.4}
            drawDuration={1.6}
            fillDelay={0.25}
            trigger="mount"
            fillMode="wipe"
          />
        </div>

        {/* Line 3: MART */}
        <div className="desktop-hero-stroke__line">
          <StrokeText
            text="MART"
            strokeColor={strokeColor}
            fillColor={fillColor}
            fontSize={56}
            fontWeight={900}
            letterSpacing={-1}
            strokeWidth={1.4}
            drawDuration={1.4}
            fillDelay={0.35}
            trigger="mount"
            fillMode="wipe"
          />
        </div>
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
