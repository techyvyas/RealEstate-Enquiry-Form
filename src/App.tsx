/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

export type InterestedInOption = '' | 'Plot' | 'Rent' | 'Buy property' | 'Sell property';

export interface EnquiryFormData {
  name: string;
  email: string;
  phone: string;
  interestedIn: InterestedInOption;
  message: string;
}

export interface EnquiryFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  interestedIn?: string;
}

export interface SubmittedEnquiry extends EnquiryFormData {
  id: string;
  submittedAt: string;
  referenceCode: string;
}

const INTERESTED_IN_OPTIONS: Exclude<InterestedInOption, ''>[] = [
  'Plot',
  'Rent',
  'Buy property',
  'Sell property',
];

const INITIAL_FORM_DATA: EnquiryFormData = {
  name: '',
  email: '',
  phone: '',
  interestedIn: '',
  message: '',
};

const WEBHOOK_URL = 'https://chenna15.app.n8n.cloud/webhook/project2externalformthroughwebhook';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+\d\s().-]{7,20}$/;

export default function App() {
  const [formData, setFormData] = useState<EnquiryFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<EnquiryFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<SubmittedEnquiry | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<SubmittedEnquiry[]>([]);
  const [showToast, setShowToast] = useState(false);

  const formIdPrefix = useId();
  const nameId = `${formIdPrefix}-name`;
  const emailId = `${formIdPrefix}-email`;
  const phoneId = `${formIdPrefix}-phone`;
  const interestedInId = `${formIdPrefix}-interestedIn`;
  const messageId = `${formIdPrefix}-message`;

  const validateField = (
    field: keyof EnquiryFormData,
    value: string
  ): string | undefined => {
    const trimmed = value.trim();

    if (field === 'name') {
      if (!trimmed) {
        return 'Full name is required. Please enter your full name.';
      }
      if (trimmed.length < 2) {
        return 'Full name must be at least 2 characters long.';
      }
      return undefined;
    }

    if (field === 'email') {
      if (!trimmed) {
        return 'Email address is required. Please enter your email address.';
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Please enter a valid email address (e.g., name@domain.com).';
      }
      return undefined;
    }

    if (field === 'phone') {
      if (trimmed && !PHONE_REGEX.test(trimmed)) {
        return 'Please enter a valid phone number (7–20 digits).';
      }
      return undefined;
    }

    if (field === 'interestedIn') {
      if (!trimmed) {
        return 'Please select an enquiry option from the list.';
      }
      return undefined;
    }

    return undefined;
  };

  const validateAll = (data: EnquiryFormData): EnquiryFormErrors => {
    const nextErrors: EnquiryFormErrors = {};

    const nameError = validateField('name', data.name);
    if (nameError) nextErrors.name = nameError;

    const emailError = validateField('email', data.email);
    if (emailError) nextErrors.email = emailError;

    const phoneError = validateField('phone', data.phone);
    if (phoneError) nextErrors.phone = phoneError;

    const interestedInError = validateField('interestedIn', data.interestedIn);
    if (interestedInError) nextErrors.interestedIn = interestedInError;

    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof EnquiryFormData;

    if (submitError) {
      setSubmitError(null);
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (touched[fieldName] || errors[fieldName as keyof EnquiryFormErrors]) {
      const fieldError = validateField(fieldName, value);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: fieldError,
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof EnquiryFormData;

    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));

    const fieldError = validateField(fieldName, value);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: fieldError,
    }));
  };

  const handleQuickSelectInterest = (option: Exclude<InterestedInOption, ''>) => {
    if (submittedEnquiry) {
      setSubmittedEnquiry(null);
    }
    if (submitError) {
      setSubmitError(null);
    }
    setFormData((prev) => ({
      ...prev,
      interestedIn: option,
    }));
    setErrors((prev) => ({
      ...prev,
      interestedIn: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    setTouched({
      name: true,
      email: true,
      phone: true,
      interestedIn: true,
    });

    const validationErrors = validateAll(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement | null;
      if (element) {
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);

    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const referenceCode = `HC-${randomCode}`;
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      interestedIn: formData.interestedIn,
      message: formData.message.trim(),
      referenceCode,
      submittedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      const created: SubmittedEnquiry = {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        interestedIn: payload.interestedIn,
        message: payload.message,
        id: `${Date.now()}`,
        submittedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        referenceCode,
      };

      setSubmittedEnquiry(created);
      setRecentEnquiries((prev) => [created, ...prev.slice(0, 4)]);
      setShowToast(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? `Unable to submit enquiry (${err.message}). Please try again.`
          : 'Unable to submit enquiry. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewEnquiry = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    setSubmittedEnquiry(null);
    setShowToast(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-900 selection:text-white">
      {/* Top Navigation Bar - Strict 3-Zone Contract */}
      <header className="w-full bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
          <a
            href="#enquiry-card"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            HavenCrest Realty
          </a>

          <nav
            aria-label="Property categories"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {INTERESTED_IN_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleQuickSelectInterest(option)}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  formData.interestedIn === option && !submittedEnquiry
                    ? 'text-emerald-800 underline underline-offset-8 decoration-2'
                    : ''
                }`}
              >
                {option}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#enquiry-form"
              onClick={() => {
                if (submittedEnquiry) handleResetForNewEnquiry();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              New Enquiry
            </a>
          </div>
        </div>
      </header>

      {/* Subtle Toast Notification on Valid Submission */}
      {showToast && submittedEnquiry && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3.5 rounded-xl shadow-lg border border-slate-800 flex items-start gap-3 transition-opacity duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-white">
              Enquiry received, {submittedEnquiry.name}
            </p>
            <p className="text-slate-300 mt-0.5">
              Your <span className="text-emerald-300 font-medium">{submittedEnquiry.interestedIn}</span> enquiry ({submittedEnquiry.referenceCode}) has been logged with our advisory desk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white text-xs font-medium ml-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Main Content Area — Centered on the page */}
      <main className="flex-1 flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto">
          {/* Centered Split/Unified Real Estate Enquiry Card */}
          <div
            id="enquiry-card"
            className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
          >
            {/* Left Column: Property Advisory Context */}
            <aside className="lg:col-span-5 bg-slate-900 text-white p-7 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-medium tracking-wide">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Private Property Advisory</span>
                </div>

                <h1
                  className="mt-4 text-2xl sm:text-3xl font-display font-medium tracking-tight text-white leading-snug"
                  style={{ textWrap: 'balance' }}
                >
                  Real Estate Property Enquiry
                </h1>

                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Connect directly with a senior property specialist for residential plots, leasing, acquisitions, or portfolio sales.
                </p>

                {/* Quick Filter / Category Selector */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <p className="text-xs font-medium text-slate-400 mb-3">
                    Enquiry Portfolios Covered
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {INTERESTED_IN_OPTIONS.map((item) => {
                      const isSelected = formData.interestedIn === item && !submittedEnquiry;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleQuickSelectInterest(item)}
                          className={`text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer whitespace-nowrap shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{item}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-75 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Direct Contact & Response Standards */}
              <div className="mt-10 pt-6 border-t border-slate-800 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Typical response within 2 business hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="tabular-nums">+1 (800) 555-0194 · Mon–Sat, 9am–7pm</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>concierge@havencrestrealty.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>450 Lexington Ave, Suite 1800</span>
                </div>
              </div>
            </aside>

            {/* Right Column: Main Form or Confirmation View */}
            <section
              id="enquiry-form"
              aria-label="Property Enquiry Form"
              className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-center bg-white"
            >
              {submittedEnquiry ? (
                /* Confirmation Screen */
                <div
                  role="region"
                  aria-live="polite"
                  aria-label="Enquiry Confirmation"
                  className="py-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <p className="text-xs font-medium text-emerald-700">
                    Enquiry Confirmed · Reference {submittedEnquiry.referenceCode}
                  </p>

                  <h2
                    className="mt-1.5 text-2xl sm:text-3xl font-display font-semibold text-slate-900 tracking-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    Thank you, {submittedEnquiry.name}!
                  </h2>

                  <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                    We have received your property enquiry regarding{' '}
                    <span className="font-semibold text-slate-900">
                      {submittedEnquiry.interestedIn}
                    </span>
                    . A dedicated HavenCrest advisor will reach out to you at{' '}
                    <span className="font-medium text-slate-900">
                      {submittedEnquiry.email}
                    </span>{' '}
                    shortly.
                  </p>

                  {/* Summary Details Box */}
                  <dl className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Full Name</dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {submittedEnquiry.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Interested In</dt>
                      <dd className="mt-1 font-semibold text-emerald-800">
                        {submittedEnquiry.interestedIn}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Email Address</dt>
                      <dd className="mt-1 font-medium text-slate-900 break-all">
                        {submittedEnquiry.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Phone Number</dt>
                      <dd className="mt-1 font-medium text-slate-900 tabular-nums">
                        {submittedEnquiry.phone || 'Not provided'}
                      </dd>
                    </div>
                    {submittedEnquiry.message && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-slate-500">
                          Message / Property Details
                        </dt>
                        <dd className="mt-1 text-slate-700 leading-relaxed whitespace-pre-line">
                          {submittedEnquiry.message}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={handleResetForNewEnquiry}
                      className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>Submit Another Enquiry</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Enquiry Form */
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                      Property Enquiry Details
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                      Fields marked with <span className="text-red-600 font-semibold">*</span> are mandatory.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* 1. Full Name */}
                    <div>
                      <label
                        htmlFor={nameId}
                        className="block text-sm font-medium text-slate-800 mb-1.5"
                      >
                        Full Name <span className="text-red-600" aria-hidden="true">*</span>
                      </label>
                      <input
                        id={nameId}
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter your full name"
                        aria-required="true"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? `${nameId}-error` : undefined}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                          errors.name
                            ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                            : 'border-slate-300 hover:border-slate-400 focus:border-emerald-700 focus:ring-emerald-700/20'
                        }`}
                      />
                      {errors.name && (
                        <p
                          id={`${nameId}-error`}
                          role="alert"
                          className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    {/* 2. Email Address & 3. Phone Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Email Address */}
                      <div>
                        <label
                          htmlFor={emailId}
                          className="block text-sm font-medium text-slate-800 mb-1.5"
                        >
                          Email Address <span className="text-red-600" aria-hidden="true">*</span>
                        </label>
                        <input
                          id={emailId}
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your email address"
                          aria-required="true"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? `${emailId}-error` : undefined}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                            errors.email
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                              : 'border-slate-300 hover:border-slate-400 focus:border-emerald-700 focus:ring-emerald-700/20'
                          }`}
                        />
                        {errors.email && (
                          <p
                            id={`${emailId}-error`}
                            role="alert"
                            className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.email}</span>
                          </p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label
                          htmlFor={phoneId}
                          className="block text-sm font-medium text-slate-800 mb-1.5"
                        >
                          Phone Number
                        </label>
                        <input
                          id={phoneId}
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your phone number (optional)"
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 tabular-nums ${
                            errors.phone
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                              : 'border-slate-300 hover:border-slate-400 focus:border-emerald-700 focus:ring-emerald-700/20'
                          }`}
                        />
                        {errors.phone && (
                          <p
                            id={`${phoneId}-error`}
                            role="alert"
                            className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 4. Interested In */}
                    <div>
                      <label
                        htmlFor={interestedInId}
                        className="block text-sm font-medium text-slate-800 mb-1.5"
                      >
                        Interested In <span className="text-red-600" aria-hidden="true">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={interestedInId}
                          name="interestedIn"
                          required
                          value={formData.interestedIn}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-required="true"
                          aria-invalid={Boolean(errors.interestedIn)}
                          aria-describedby={
                            errors.interestedIn ? `${interestedInId}-error` : undefined
                          }
                          className={`w-full appearance-none px-3.5 py-2.5 pr-10 text-sm rounded-xl border bg-white transition-colors focus:outline-none focus:ring-2 cursor-pointer ${
                            formData.interestedIn === ''
                              ? 'text-slate-400'
                              : 'text-slate-900'
                          } ${
                            errors.interestedIn
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                              : 'border-slate-300 hover:border-slate-400 focus:border-emerald-700 focus:ring-emerald-700/20'
                          }`}
                        >
                          <option value="" disabled>
                            Select an option
                          </option>
                          {INTERESTED_IN_OPTIONS.map((option) => (
                            <option
                              key={option}
                              value={option}
                              className="text-slate-900"
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          aria-hidden="true"
                          className="w-4 h-4 text-slate-500 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                        />
                      </div>
                      {errors.interestedIn && (
                        <p
                          id={`${interestedInId}-error`}
                          role="alert"
                          className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.interestedIn}</span>
                        </p>
                      )}
                    </div>

                    {/* 5. Message / Property Details */}
                    <div>
                      <label
                        htmlFor={messageId}
                        className="block text-sm font-medium text-slate-800 mb-1.5"
                      >
                        Message / Property Details
                      </label>
                      <textarea
                        id={messageId}
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Tell us about your preferred location, budget, or property requirements (optional)"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 resize-y"
                      />
                    </div>

                    {submitError && (
                      <div
                        role="alert"
                        className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* Submit Enquiry Button */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:bg-emerald-800/75 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <span>Submitting Enquiry...</span>
                          </>
                        ) : (
                          <span>Submit Enquiry</span>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Your contact details are kept confidential and never shared.</span>
                    </div>
                  </form>
                </div>
              )}
            </section>
          </div>

          {/* Session Enquiry Log (if user submits one or more enquiries) */}
          {recentEnquiries.length > 0 && (
            <section
              aria-label="Recent Submitted Enquiries"
              className="mt-8 pt-6 border-t border-slate-200/80"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-600">
                  Submitted Enquiries in This Session ({recentEnquiries.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-200/70 bg-white rounded-xl border border-slate-200/80 px-5">
                {recentEnquiries.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-slate-700">
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-medium text-emerald-800">{item.interestedIn}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500">{item.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 tabular-nums">
                      <span>{item.referenceCode}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>Submitted at {item.submittedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-5 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>HavenCrest Realty Advisory · Residential &amp; Commercial Property Specialists</span>
          <span>Licensed Brokerage · Equal Housing Opportunity</span>
        </div>
      </footer>
    </div>
  );
}
