import React from 'react';
import { Bus, ShieldCheck } from 'lucide-react';
import { BUS_CATEGORY_ASSETS, BusImageAsset } from '../../../lib/assets';
import { useLanguage } from '../../../hooks/useLanguage';

interface BusCategoryShowcaseProps {
  onSelectCategory?: (category: 'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE') => void;
  selectedCategory?: 'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE' | null;
}

export const BusCategoryShowcase: React.FC<BusCategoryShowcaseProps> = ({
  onSelectCategory,
  selectedCategory
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const categories: BusImageAsset[] = [
    BUS_CATEGORY_ASSETS.ORDINARY_NON_AC,
    BUS_CATEGORY_ASSETS.DELUXE,
    BUS_CATEGORY_ASSETS.ULTRA_DELUXE
  ];

  return (
    <section className="bus-category-showcase-section" aria-labelledby="bus-categories-heading">
      <div className="section-header">
        <div className="title-group">
          <Bus size={20} className="section-icon text-primary" />
          <div>
            <h3 id="bus-categories-heading">
              {isTa ? 'தமிழ்நாடு அரசுப் பேருந்து வகைகள் & வாகன அமைப்புகள்' : 'Tamil Nadu Government Bus Fleet & Liveries'}
            </h3>
            <p className="section-subtitle">
              {isTa
                ? 'உண்மையான தமிழ்நாடு அரசுப் போக்குவரத்துக் கழக (TNSTC & SETC) பேருந்து புகைப்படங்கள்'
                : 'Authentic TNSTC & SETC fleet photography, official liveries, and service categories'}
            </p>
          </div>
        </div>
      </div>

      <div className="bus-categories-grid">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <article
              key={cat.category}
              className={`bus-category-card ${isSelected ? 'selected' : ''}`}
              data-testid={`bus-category-${cat.category.toLowerCase()}`}
              onClick={() => onSelectCategory?.(cat.category)}
              role={onSelectCategory ? 'button' : 'article'}
              tabIndex={onSelectCategory ? 0 : undefined}
            >
              <div className="bus-category-img-wrap">
                <picture>
                  <source type="image/webp" srcSet={cat.thumb} />
                  <img
                    src={cat.jpg}
                    alt={isTa ? cat.altTa : cat.altEn}
                    className="bus-category-img"
                    loading="lazy"
                  />
                </picture>
                <div className="category-pill-overlay">
                  <span>{cat.category.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="bus-category-content">
                <h4 className="bus-category-title">{isTa ? cat.titleTa : cat.titleEn}</h4>
                <div className="bus-meta-row">
                  <span className="meta-label">{isTa ? 'வண்ண அமைப்பு:' : 'Livery:'}</span>
                  <span className="meta-val font-semibold">{cat.livery}</span>
                </div>
                <div className="bus-meta-row">
                  <span className="meta-label">{isTa ? 'வாகன மாதிரி:' : 'Chassis:'}</span>
                  <span className="meta-val">{cat.model}</span>
                </div>

                <div className="bus-attribution-footer" title={cat.attribution}>
                  <ShieldCheck size={12} className="shield-icon" />
                  <span>{cat.attribution}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
