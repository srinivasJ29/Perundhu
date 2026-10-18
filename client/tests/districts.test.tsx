import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/features/auth';
import {
  TAMIL_NADU_DISTRICTS,
  TOTAL_DISTRICTS_COUNT,
  filterDistricts,
  DistrictSelectionPage,
  RouteSelectionPlaceholder
} from '../src/features/districts';
import { STORAGE_KEYS } from '../src/config/constants';
import { safeGetItem } from '../src/lib/storage';

// Mock backend API call
vi.mock('../src/services/api/districts.service', () => ({
  districtsService: {
    getDistricts: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'backend-mdu-123',
          code: 'MDU',
          nameEn: 'Madurai',
          nameTa: 'மதுரை',
          headquarters: 'Madurai',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 }
    }),
    getBusStandsByDistrict: vi.fn()
  }
}));

const renderWithProviders = (initialRoute = '/districts') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/districts" element={<DistrictSelectionPage />} />
            <Route path="/districts/:districtId/routes" element={<RouteSelectionPlaceholder />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  );
};

describe('PERUNDHU Step 4 — Tamil Nadu District Selection Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('3.1 Canonical 38-District Catalogue', () => {
    it('should contain exactly 38 unique districts of Tamil Nadu', () => {
      expect(TAMIL_NADU_DISTRICTS).toHaveLength(38);
      expect(TOTAL_DISTRICTS_COUNT).toBe(38);

      const uniqueCodes = new Set(TAMIL_NADU_DISTRICTS.map((d) => d.code));
      expect(uniqueCodes.size).toBe(38);

      const uniqueNames = new Set(TAMIL_NADU_DISTRICTS.map((d) => d.nameEn.toLowerCase()));
      expect(uniqueNames.size).toBe(38);
    });

    it('should verify all required English district names exist in catalogue', () => {
      const requiredDistricts = [
        'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
        'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
        'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
        'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
        'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
        'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
        'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
        'Vellore', 'Viluppuram', 'Virudhunagar'
      ];

      const catalogueNames = TAMIL_NADU_DISTRICTS.map((d) => d.nameEn);
      requiredDistricts.forEach((name) => {
        expect(catalogueNames).toContain(name);
      });
    });

    it('should configure Madurai as the initial available pilot district and all others as coming soon', () => {
      const madurai = TAMIL_NADU_DISTRICTS.find((d) => d.code === 'MDU');
      expect(madurai).toBeDefined();
      expect(madurai?.isPilot).toBe(true);
      expect(madurai?.status).toBe('AVAILABLE');

      const otherDistricts = TAMIL_NADU_DISTRICTS.filter((d) => d.code !== 'MDU');
      expect(otherDistricts).toHaveLength(37);
      otherDistricts.forEach((d) => {
        expect(d.isPilot).toBe(false);
        expect(d.status).toBe('COMING_SOON');
      });
    });
  });

  describe('3.2 District Search & Filtering Logic', () => {
    it('should filter districts by English name case-insensitively', () => {
      const results = filterDistricts(TAMIL_NADU_DISTRICTS, 'mad');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].code).toBe('MDU');

      const chennaiResults = filterDistricts(TAMIL_NADU_DISTRICTS, 'CHENNAI');
      expect(chennaiResults.some((d) => d.nameEn === 'Chennai')).toBe(true);
    });

    it('should filter districts by Tamil script name', () => {
      const results = filterDistricts(TAMIL_NADU_DISTRICTS, 'மதுரை');
      expect(results.some((d) => d.code === 'MDU')).toBe(true);
    });

    it('should filter districts by district code', () => {
      const results = filterDistricts(TAMIL_NADU_DISTRICTS, 'CBE');
      expect(results.some((d) => d.nameEn === 'Coimbatore')).toBe(true);
    });

    it('should prioritize active pilot districts at the top of results', () => {
      const allResults = filterDistricts(TAMIL_NADU_DISTRICTS, '');
      expect(allResults[0].code).toBe('MDU');
      expect(allResults[0].status).toBe('AVAILABLE');
    });

    it('should filter by availability status', () => {
      const availableOnly = filterDistricts(TAMIL_NADU_DISTRICTS, '', 'AVAILABLE');
      expect(availableOnly).toHaveLength(1);
      expect(availableOnly[0].code).toBe('MDU');
    });
  });

  describe('3.3 UI Rendering, Interaction & Navigation', () => {
    it('should render the DistrictSelectionPage with title, subtitle, and search input', async () => {
      renderWithProviders();

      // Heading and subtitle
      expect(screen.getByRole('heading', { level: 1, name: /Choose Your District|உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்/i })).toBeInTheDocument();
      expect(screen.getByText(/explore available bus routes and services|பேருந்து வழித்தடங்கள் மற்றும் சேவைகளைப் பார்க்க/i)).toBeInTheDocument();

      // Search input
      const searchInput = screen.getByPlaceholderText(/Search by district name|மாவட்டப் பெயர் அல்லது குறியீடு/i);
      expect(searchInput).toBeInTheDocument();

      // Madurai card exists with pilot indicator
      await waitFor(() => {
        expect(screen.getByTestId('district-card-mdu')).toBeInTheDocument();
      });
    });

    it('should dynamically update results when typing in search input', async () => {
      renderWithProviders();

      const searchInput = screen.getByPlaceholderText(/Search by district name|மாவட்டப் பெயர் அல்லது குறியீடு/i);

      // Search for specific district
      fireEvent.change(searchInput, { target: { value: 'Coimbatore' } });

      await waitFor(() => {
        expect(screen.getByTestId('district-card-cbe')).toBeInTheDocument();
        expect(screen.queryByTestId('district-card-mdu')).not.toBeInTheDocument();
      });

      // Clear search button should appear and work
      const clearBtn = screen.getByRole('button', { name: /Clear search|தேடலை அழிக்க/i });
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByTestId('district-card-mdu')).toBeInTheDocument();
      });
    });

    it('should display empty state when search query matches no districts', async () => {
      renderWithProviders();

      const searchInput = screen.getByPlaceholderText(/Search by district name|மாவட்டப் பெயர் அல்லது குறியீடு/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistentDistrictName123' } });

      await waitFor(() => {
        expect(screen.getByText(/No districts found|மாவட்டங்கள் எதுவும் கிடைக்கவில்லை/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Clear Search Filter|தேடலை மீட்டமைக்க/i })).toBeInTheDocument();
      });
    });

    it('should allow selecting Madurai and navigate to Step 5 route destination', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('district-card-mdu')).toBeInTheDocument();
      });

      const exploreBtn = screen.getByRole('button', { name: /Explore Routes|வழித்தடங்களை ஆராய்க/i });
      expect(exploreBtn).toBeInTheDocument();

      fireEvent.click(exploreBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getAllByText(/Madurai Pilot Selected|மதுரை முன்னோடி வழித்தடம்/i).length).toBeGreaterThan(0);
      });

      // Verify safeStorage persisted district code
      const savedCode = safeGetItem(STORAGE_KEYS.SELECTED_DISTRICT, null);
      expect(savedCode).toBe('MDU');
    });

    it('should render coming soon districts without allowing invalid selection', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('district-card-chn')).toBeInTheDocument();
      });

      const chennaiCard = screen.getByTestId('district-card-chn');
      expect(chennaiCard).toHaveTextContent(/Coming Soon|விரைவில்/i);
      expect(chennaiCard).toHaveTextContent(/Live tracking telemetry is scheduled|அடுத்தடுத்த விரிவாக்கக் கட்டங்களில்/i);

      // Should NOT have an active "Explore Routes" button for Chennai
      expect(chennaiCard.querySelector('button.district-card-action-btn')).toBeNull();
    });
  });
});
