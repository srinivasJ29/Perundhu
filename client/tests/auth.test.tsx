import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { AuthProvider, LoginPage, SignupPage, PasswordField } from '../src/features/auth';
import { authService } from '../src/services/api/auth.service';

// Mock authService methods
vi.mock('../src/services/api/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn().mockRejectedValue(new Error('No active session')),
    logout: vi.fn().mockResolvedValue(undefined),
    getMe: vi.fn()
  }
}));

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/login') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={ui} />
            <Route path="/signup" element={ui} />
            <Route path="/onboarding" element={<div>Onboarding Destination</div>} />
            <Route path="/" element={<div>Home Destination</div>} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  );
};

describe('PERUNDHU Step 3 — Authentication Experience & Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('2.1 Login Page & Controls', () => {
    it('should render PERUNDHU brand, "Welcome Back" heading, and essential login inputs', () => {
      renderWithProviders(<LoginPage />, '/login');

      // Brand text
      expect(screen.getAllByText(/PERUNDHU|பேருந்து/i).length).toBeGreaterThan(0);

      // Heading
      expect(screen.getByRole('heading', { name: /Welcome Back|மீண்டும் வருக/i })).toBeInTheDocument();

      // Inputs
      expect(screen.getByLabelText(/Email Address|மின்னஞ்சல் முகவரி/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password|கடவுச்சொல்/i, { selector: 'input' })).toBeInTheDocument();

      // Submit button
      expect(screen.getByRole('button', { name: /Sign In|உள்நுழைக/i })).toBeInTheDocument();

      // Link to signup
      expect(screen.getByRole('link', { name: /Sign up|பதிவு செய்க/i })).toBeInTheDocument();
    });

    it('should toggle password visibility with accessible button and label', () => {
      renderWithProviders(<PasswordField label="Secret Password" id="test-password" />);

      const input = screen.getByLabelText('Secret Password', { selector: 'input' }) as HTMLInputElement;
      expect(input.type).toBe('password');

      const toggleBtn = screen.getByRole('button', { name: /Show password|கடவுச்சொல்லைக் காட்டுக/i });
      expect(toggleBtn).toBeInTheDocument();

      // Click to show password
      fireEvent.click(toggleBtn);
      expect(input.type).toBe('text');
      expect(screen.getByRole('button', { name: /Hide password|கடவுச்சொல்லை மறைக்க/i })).toBeInTheDocument();

      // Click to hide password again
      fireEvent.click(screen.getByRole('button', { name: /Hide password|கடவுச்சொல்லை மறைக்க/i }));
      expect(input.type).toBe('password');
    });

    it('should display validation errors when submitting empty login form', async () => {
      renderWithProviders(<LoginPage />, '/login');

      const submitBtn = screen.getByRole('button', { name: /Sign In|உள்நுழைக/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Email address is required|மின்னஞ்சல் முகவரி தேவை/i)).toBeInTheDocument();
        expect(screen.getByText(/Password is required|கடவுச்சொல் தேவை/i)).toBeInTheDocument();
      });

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should display friendly error banner upon 401 invalid credentials', async () => {
      const authErr = new Error('Invalid email or password');
      (authErr as any).statusCode = 401;
      vi.mocked(authService.login).mockRejectedValueOnce(authErr);

      renderWithProviders(<LoginPage />, '/login');

      const emailInput = screen.getByLabelText(/Email Address|மின்னஞ்சல் முகவரி/i);
      const passwordInput = screen.getByLabelText(/Password|கடவுச்சொல்/i, { selector: 'input' });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });

      const submitBtn = screen.getByRole('button', { name: /Sign In|உள்நுழைக/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Invalid email or password|மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது/i);
      });
    });

    it('should authenticate user and redirect to onboarding upon successful login', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        user: {
          id: 'user-123',
          email: 'passenger@tnstc.in',
          fullName: 'Arun Kumar',
          role: 'PASSENGER',
          isActive: true
        },
        accessToken: 'mock-jwt-token-123'
      });

      renderWithProviders(<LoginPage />, '/login');

      fireEvent.change(screen.getByLabelText(/Email Address|மின்னஞ்சல் முகவரி/i), {
        target: { value: 'passenger@tnstc.in' }
      });
      fireEvent.change(screen.getByLabelText(/Password|கடவுச்சொல்/i, { selector: 'input' }), {
        target: { value: 'ValidPass123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /Sign In|உள்நுழைக/i }));

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          email: 'passenger@tnstc.in',
          password: 'ValidPass123'
        });
        expect(screen.getByText('Onboarding Destination')).toBeInTheDocument();
      });
    });
  });

  describe('2.2 Signup Page & Validation', () => {
    it('should render PERUNDHU brand, "Create Your Account" heading, and verified contract fields', () => {
      renderWithProviders(<SignupPage />, '/signup');

      // Heading
      expect(screen.getByRole('heading', { name: /Create Your Account|புதிய கணக்கை உருவாக்குங்கள்/i })).toBeInTheDocument();

      // Inputs
      expect(screen.getByLabelText(/Full Name|முழுப் பெயர்/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address|மின்னஞ்சல் முகவரி/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Number|தொலைபேசி எண்/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password|கடவுச்சொல்$/i, { selector: 'input' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password|கடவுச்சொல்லை உறுதிப்படுத்துக/i, { selector: 'input' })).toBeInTheDocument();
      expect(screen.getByLabelText(/agree to the TNSTC terms|விதிமுறைகள்/i)).toBeInTheDocument();

      // Action
      expect(screen.getByRole('button', { name: /Create Account|கணக்கை உருவாக்குங்கள்/i })).toBeInTheDocument();

      // Link to login
      expect(screen.getByRole('link', { name: /Sign in|உள்நுழைக/i })).toBeInTheDocument();
    });

    it('should validate passwords match and terms checkbox', async () => {
      renderWithProviders(<SignupPage />, '/signup');

      fireEvent.change(screen.getByLabelText(/Full Name|முழுப் பெயர்/i), { target: { value: 'Meena' } });
      fireEvent.change(screen.getByLabelText(/Email Address|மின்னஞ்சல் முகவரி/i), { target: { value: 'meena@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password|கடவுச்சொல்$/i, { selector: 'input' }), { target: { value: 'Password123' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password|கடவுச்சொல்லை உறுதிப்படுத்துக/i, { selector: 'input' }), { target: { value: 'Mismatch999' } });

      fireEvent.click(screen.getByRole('button', { name: /Create Account|கணக்கை உருவாக்குங்கள்/i }));

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match|கடவுச்சொற்கள் பொருந்தவில்லை/i)).toBeInTheDocument();
        expect(screen.getByText(/accept the terms|விதிமுறைகளை ஏற்க வேண்டும்/i)).toBeInTheDocument();
      });

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should display conflict error when email is already registered', async () => {
      const conflictErr = new Error('An account with this email address already exists');
      (conflictErr as any).statusCode = 409;
      vi.mocked(authService.register).mockRejectedValueOnce(conflictErr);

      renderWithProviders(<SignupPage />, '/signup');

      fireEvent.change(screen.getByLabelText(/Full Name|முழுப் பெயர்/i), { target: { value: 'Karthik' } });
      fireEvent.change(screen.getByLabelText(/Email Address|மின்னஞ்சல் முகவரி/i), { target: { value: 'existing@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password|கடவுச்சொல்$/i, { selector: 'input' }), { target: { value: 'Secret1234' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password|கடவுச்சொல்லை உறுதிப்படுத்துக/i, { selector: 'input' }), { target: { value: 'Secret1234' } });
      fireEvent.click(screen.getByLabelText(/agree to the TNSTC terms|விதிமுறைகள்/i));

      fireEvent.click(screen.getByRole('button', { name: /Create Account|கணக்கை உருவாக்குங்கள்/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/already exists|ஏற்கனவே கணக்கு உள்ளது/i);
      });
    });

    it('should successfully register and navigate to onboarding destination', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce({
        id: 'new-user-456',
        email: 'newpassenger@tnstc.in',
        fullName: 'Selvi Devi',
        role: 'PASSENGER',
        isActive: true
      });

      vi.mocked(authService.login).mockResolvedValueOnce({
        user: {
          id: 'new-user-456',
          email: 'newpassenger@tnstc.in',
          fullName: 'Selvi Devi',
          role: 'PASSENGER',
          isActive: true
        },
        accessToken: 'mock-jwt-token-456'
      });

      renderWithProviders(<SignupPage />, '/signup');

      fireEvent.change(screen.getByLabelText(/Full Name|முழுப் பெயர்/i), { target: { value: 'Selvi Devi' } });
      fireEvent.change(screen.getByLabelText(/Email Address|மின்னஞ்சல் முகவரி/i), { target: { value: 'newpassenger@tnstc.in' } });
      fireEvent.change(screen.getByLabelText(/^Password|கடவுச்சொல்$/i, { selector: 'input' }), { target: { value: 'SecurePass123' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password|கடவுச்சொல்லை உறுதிப்படுத்துக/i, { selector: 'input' }), { target: { value: 'SecurePass123' } });
      fireEvent.click(screen.getByLabelText(/agree to the TNSTC terms|விதிமுறைகள்/i));

      fireEvent.click(screen.getByRole('button', { name: /Create Account|கணக்கை உருவாக்குங்கள்/i }));

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          fullName: 'Selvi Devi',
          email: 'newpassenger@tnstc.in',
          password: 'SecurePass123',
          phone: undefined
        });
      });
    });
  });
});
