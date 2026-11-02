import { useState } from 'react';
import { Phone, Mail, Send, Copy, Check, AlertCircle } from 'lucide-react';
import { validateEnquiry, buildEnquiryDraft, type EnquiryData } from '../../lib/enquiry';
import { supabase } from '../../lib/supabase';

const serviceOptions = [
  'Unvented cylinder servicing',
  'Unvented cylinder repairs',
  'Megaflo servicing',
  'Megaflo repairs',
  'Cylinder installation',
  'Cylinder replacement',
  'Expansion vessel services',
  'Tundish discharge investigation',
  'Immersion heater and thermostat',
  'Landlord cylinder maintenance',
  'Urgent hot-water help',
  'Other enquiry',
];

const SITE = {
  phoneDisplay: '020 7205 4433',
  phoneE164: '+442072054433',
  email: 'info@g3qualifiedengineerlondon.co.uk',
};

export default function ContactForm() {
  const [data, setData] = useState<EnquiryData>({
    name: '',
    phone: '',
    email: '',
    postcode: '',
    service: '',
    model: '',
    symptoms: '',
    access: '',
    contactPermission: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EnquiryData, string>>>({});
  const [status, setStatus] = useState<'idle' | 'draft-prepared' | 'error'>('idle');
  const [notice, setNotice] = useState('');
  const [mailto, setMailto] = useState('');
  const [copied, setCopied] = useState(false);
  const [body, setBody] = useState('');

  const update = (field: keyof EnquiryData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEnquiry(data);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const draft = buildEnquiryDraft(SITE.email, data);
    setMailto(draft.mailto);
    setBody(draft.body);
    setNotice(draft.notice);
    setStatus('draft-prepared');
    setCopied(false);

    try {
      await supabase.from('contact_enquiries').insert({
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        postcode: data.postcode.trim().toUpperCase(),
        service: data.service.trim(),
        model: data.model.trim() || null,
        symptoms: data.symptoms.trim(),
        access: data.access.trim() || null,
        contact_permission: data.contactPermission,
        status: 'draft',
      });
    } catch {
      // Persistence is best-effort; the email draft still works without it.
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const inputClass = 'w-full rounded-lg border bg-white px-4 py-3 text-[16px] text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition';
  const errorClass = 'border-red-400 focus:ring-red-500';
  const labelClass = 'block text-sm font-medium text-navy-800 mb-1.5';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-navy-900 mb-2">Enquiry form</h2>
      <p className="text-sm text-slate-600 mb-6">
        Complete the form to prepare a readable enquiry draft. Sending it through your email app confirms the enquiry — this website does not send it for you.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <a href={`tel:${SITE.phoneE164}`} className="flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-orange-700 transition-colors text-sm">
          <Phone className="w-4 h-4" />
          {SITE.phoneDisplay}
        </a>
        <a href={`mailto:${SITE.email}`} className="flex items-center justify-center gap-2 bg-navy-900 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-colors text-sm">
          <Mail className="w-4 h-4" />
          {SITE.email}
        </a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input id="name" type="text" value={data.name} onChange={(e) => update('name', e.target.value)} className={`${inputClass} ${errors.name ? errorClass : 'border-slate-300'}`} placeholder="Your name" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input id="phone" type="tel" value={data.phone} onChange={(e) => update('phone', e.target.value)} className={`${inputClass} ${errors.phone ? errorClass : 'border-slate-300'}`} placeholder="020 7205 4433" />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" value={data.email} onChange={(e) => update('email', e.target.value)} className={`${inputClass} ${errors.email ? errorClass : 'border-slate-300'}`} placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="postcode" className={labelClass}>Property postcode</label>
            <input id="postcode" type="text" value={data.postcode} onChange={(e) => update('postcode', e.target.value)} className={`${inputClass} ${errors.postcode ? errorClass : 'border-slate-300'}`} placeholder="SW6 1AA" />
            {errors.postcode && <p className="mt-1 text-xs text-red-600">{errors.postcode}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="service" className={labelClass}>Service needed</label>
          <select id="service" value={data.service} onChange={(e) => update('service', e.target.value)} className={`${inputClass} ${errors.service ? errorClass : 'border-slate-300'}`}>
            <option value="">Choose a service…</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.service && <p className="mt-1 text-xs text-red-600">{errors.service}</p>}
        </div>

        <div>
          <label htmlFor="model" className={labelClass}>Equipment make/model <span className="text-slate-400 font-normal">(optional)</span></label>
          <input id="model" type="text" value={data.model} onChange={(e) => update('model', e.target.value)} className={`${inputClass} border-slate-300`} placeholder="Megaflo Eco indirect 210L" />
        </div>

        <div>
          <label htmlFor="symptoms" className={labelClass}>Describe the symptom</label>
          <textarea id="symptoms" value={data.symptoms} onChange={(e) => update('symptoms', e.target.value)} rows={4} className={`${inputClass} ${errors.symptoms ? errorClass : 'border-slate-300'} resize-y`} placeholder="What has changed, when it started, which outlets are affected…" />
          {errors.symptoms && <p className="mt-1 text-xs text-red-600">{errors.symptoms}</p>}
        </div>

        <div>
          <label htmlFor="access" className={labelClass}>Access / preferred time <span className="text-slate-400 font-normal">(optional)</span></label>
          <input id="access" type="text" value={data.access} onChange={(e) => update('access', e.target.value)} className={`${inputClass} border-slate-300`} placeholder="Weekday mornings, parking on street" />
        </div>

        <div className="flex items-start gap-3">
          <input
            id="permission"
            type="checkbox"
            checked={data.contactPermission}
            onChange={(e) => update('contactPermission', e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          <label htmlFor="permission" className="text-sm text-slate-700 leading-relaxed">
            I confirm the contact details above may be used to answer this enquiry. I understand this does not confirm a booking.
          </label>
        </div>
        {errors.contactPermission && <p className="text-xs text-red-600">{errors.contactPermission}</p>}

        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-orange-700 transition-colors text-[16px]"
        >
          <Send className="w-5 h-5" />
          Prepare enquiry draft
        </button>
      </form>

      {status === 'draft-prepared' && (
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">{notice}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {mailto && (
              <a href={mailto} className="flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-orange-700 transition-colors text-sm">
                <Send className="w-4 h-4" />
                Open in email app
              </a>
            )}
            <button onClick={handleCopy} className="flex items-center justify-center gap-2 bg-navy-900 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-colors text-sm">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy text'}
            </button>
          </div>
          <pre className="mt-4 text-xs text-slate-600 bg-white rounded-lg p-4 overflow-x-auto whitespace-pre-wrap border border-slate-200 max-h-60 overflow-y-auto">{body}</pre>
        </div>
      )}
    </div>
  );
}
