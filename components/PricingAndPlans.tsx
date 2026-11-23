import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Building2, 
  HelpCircle, 
  CreditCard, 
  ArrowRight, 
  Gift, 
  QrCode, 
  FileText,
  PhoneCall,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from '../services/toast';
import { trackEvent } from '../services/analytics';
import { submitSchoolInvoiceRequest } from '../services/emailService';

interface PricingAndPlansProps {
  userEmail?: string | null;
  onSelectPlan?: (planName: string) => void;
}

export const PricingAndPlans: React.FC<PricingAndPlansProps> = ({
  userEmail,
  onSelectPlan
}) => {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    trackEvent('pricing_view', { source: 'subscription_plans_tab', plan_highlighted: 'founding_pass' });
  }, []);

  const plans = [
    {
      id: 'founding_pass',
      name: 'Founding Educator Pass',
      tagline: '1-Year Complimentary Full Access for Indian PE Teachers',
      priceAnnual: '₹0',
      priceMonthly: '₹0',
      originalPrice: '₹2,999/year',
      popular: true,
      badge: '100% FREE FOR 1 YEAR',
      features: [
        'Full AI PE Lesson Plan Generator (CBSE/ICSE/State)',
        'Khelo India Fitness Battery & Percentile Calculators',
        'Yearly & Weekly Academic Curriculum Planners',
        'Theory Master Resources & Notes Generator',
        'AI Game Rules Bot & PE Classroom Timers',
        'Founding Educator Certificate Badge'
      ],
      buttonText: 'Active Free Pass',
      buttonVariant: 'primary' as const
    },
    {
      id: 'teacher_pro',
      name: 'PE Teacher Pro',
      tagline: 'For Individual Physical Education Professionals & Coaches',
      priceAnnual: '₹299/year',
      priceMonthly: '₹49/month',
      originalPrice: '₹1,200/year',
      popular: false,
      badge: 'AFFORDABLE INDIVIDUAL PASS',
      features: [
        'All Features in Founding Educator Pass',
        'Unlimited Board-Pattern CBSE Test Paper Generation',
        'High-Resolution Diagrams & Export to PDF / Word',
        'AI Sports Movement & Biomechanics Video Lab',
        'Parent Letter Drafter & School Notices',
        'Priority AI Response & Support (Within 24 Working Hours)'
      ],
      buttonText: 'Upgrade to Pro Pass',
      buttonVariant: 'secondary' as const
    },
    {
      id: 'school_unlimited',
      name: 'School / Institution Pass',
      tagline: 'Complete PE Department Suite for Schools & Management',
      priceAnnual: '₹1,999/year',
      priceMonthly: '₹249/month',
      originalPrice: '₹8,000/year',
      popular: false,
      badge: 'FOR ENTIRE PE DEPARTMENT',
      features: [
        'Unlimited Teacher Accounts per School Campus',
        'Principal Inspection Dashboard & Audit Reports',
        'Centralized Khelo India Student Fitness Database',
        'Custom School Name & Logo Branding on all PDFs',
        'School Purchase Order & Tax Invoice Support',
        'Dedicated Onboarding Assistance by Founder L. Samy'
      ],
      buttonText: 'Get School Pass',
      buttonVariant: 'outline' as const
    }
  ];

  const handlePlanClick = (planId: string, planName: string) => {
    trackEvent('resource_viewed', { resource_name: planName, category: 'subscription_plans' });
    setSelectedPlanModal(planName);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanModal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitSchoolInvoiceRequest({
        planName: selectedPlanModal,
        billingCycle,
        schoolName: schoolName.trim(),
        phone: phone.trim(),
        contactEmail: userEmail || undefined
      });
      if (result.success) {
        toast.success(`Request for "${selectedPlanModal}" sent! We will contact you at ${phone || userEmail}.`);
        setSelectedPlanModal(null);
        setSchoolName('');
        setPhone('');
      } else {
        toast.error(result.message || 'Could not send request right now. Please email contact@smartpeindia.app.');
      }
    } catch {
      toast.error('Network error submitting request. Please email contact@smartpeindia.app.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-4 md:p-8 overflow-x-hidden">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-black uppercase tracking-widest">
          <Gift size={14} />
          <span>Affordable & Free Options for Every Indian School</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight font-display">
          Simple, Transparent <span className="text-primary">PE Plans</span>
        </h1>
        <p className="text-slate-600 font-medium text-base leading-relaxed">
          Every PE educator gets 1 Year 100% Free Access. Upgrade to Pro or School Institutional passes to unlock unlimited test papers, school logo headers, and GST tax invoice receipts.
        </p>

        {/* Billing Toggle */}
        <div className="pt-4 flex items-center justify-center space-x-4">
          <span className={`text-xs font-black uppercase tracking-wider ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>
            Annual Billing (Save 60%)
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'annual' ? 'monthly' : 'annual')}
            className="relative w-14 h-8 bg-slate-900 rounded-full p-1 transition-colors"
          >
            <div
              className={`w-6 h-6 bg-primary rounded-full transition-transform ${
                billingCycle === 'monthly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
          <span className={`text-xs font-black uppercase tracking-wider ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
            Monthly Billing
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 pt-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-[2.5rem] border-4 border-slate-900 p-6 xl:p-8 min-w-0 flex flex-col justify-between transition-all ${
              plan.popular ? 'shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] lg:-translate-y-1 ring-4 ring-primary/20' : 'shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md whitespace-nowrap">
                {plan.badge}
              </div>
            )}

            <div className="space-y-6 pt-2 min-w-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase font-display">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-bold mt-1 min-h-[32px]">{plan.tagline}</p>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight break-words">
                    {billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  <span className="text-xs font-bold text-slate-400 line-through whitespace-nowrap">{plan.originalPrice}</span>
                </div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                  {plan.id === 'founding_pass' ? 'Active automatically for all accounts' : 'School Purchase Order & Invoice available'}
                </p>
              </div>

              <div className="border-t-2 border-slate-100 pt-6 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Included Features</p>
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handlePlanClick(plan.id, plan.name)}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center justify-center space-x-2 ${
                  plan.id === 'founding_pass'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-primary text-white hover:bg-primary-container'
                }`}
              >
                <span>{plan.buttonText}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* School Purchase Order / GST Invoice Section */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 border-4 border-slate-900 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-amber-400">
            <Building2 size={14} />
            <span>School Purchasing & Billing</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black uppercase font-display">Need a School Purchase Order or GST Invoice?</h2>
          <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
            We provide official tax invoices for school accounting departments, multi-branch discounts, and custom school setup.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button
            onClick={() => setSelectedPlanModal('School Institutional Pass')}
            className="px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-container transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <FileText size={16} />
            <span>Request School Invoice</span>
          </button>
          <a
            href="mailto:contact@smartpeindia.app?subject=School%20Purchase%20Order%20Inquiry"
            className="px-8 py-4 bg-white/10 text-white border border-white/20 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center space-x-2"
          >
            <PhoneCall size={16} />
            <span>Contact Founder</span>
          </a>
        </div>
      </div>

      {/* Payment / Invoice Request Modal */}
      {selectedPlanModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] border-4 border-slate-900 p-8 shadow-2xl relative space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Smart PE India Subscription</p>
                <h3 className="text-2xl font-black text-slate-900 uppercase font-display">{selectedPlanModal}</h3>
              </div>
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="w-10 h-10 bg-slate-100 rounded-full font-black text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Enter your details below to activate your pass, request an official GST Invoice for your school, or receive instant UPI payment options.
            </p>

            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                  School / Institution Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Mary's Academy, Delhi"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                  WhatsApp / Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl space-y-2">
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Instant UPI / QR Code Direct Pay</span>
                </p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Support UPI Apps (GPay / PhonePe / Paytm / BHIM) or Bank Wire Transfer.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-container transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{isSubmitting ? 'Sending Request...' : 'Submit & Request Invoice'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingAndPlans;
