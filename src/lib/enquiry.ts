export interface EnquiryData {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  service: string;
  model: string;
  symptoms: string;
  access: string;
  contactPermission: boolean;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryData, string>>;

const clean = (value: string) => String(value || '').trim();
const line = (value: string) => clean(value).replace(/[\r\n]+/g, ' ');

export function validateEnquiry(data: EnquiryData): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (clean(data.name).length < 2 || clean(data.name).length > 100) {
    errors.name = 'Enter your name, up to 100 characters.';
  }
  const phone = clean(data.phone).replace(/[\s()-]/g, '');
  if (!/^(?:0\d{9,10}|(?:\+44|0044)\d{9,10})$/.test(phone)) {
    errors.phone = 'Enter a UK telephone number.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(data.email)) || clean(data.email).length > 254) {
    errors.email = 'Enter a valid email address.';
  }
  if (!/^(?:GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(clean(data.postcode))) {
    errors.postcode = 'Enter the full property postcode.';
  }
  if (!clean(data.service) || clean(data.service).length > 100) {
    errors.service = 'Choose the service you want to discuss.';
  }
  if (clean(data.symptoms).length < 10 || clean(data.symptoms).length > 1500) {
    errors.symptoms = 'Describe the symptom in 10 to 1500 characters.';
  }
  if (data.contactPermission !== true) {
    errors.contactPermission = 'Confirm the contact details may be used to answer this enquiry.';
  }
  return errors;
}

export function buildEnquiryDraft(email: string, data: EnquiryData) {
  const errors = validateEnquiry(data);
  if (Object.keys(errors).length) {
    return { errors, subject: '', body: '', mailto: '', notice: '', status: 'invalid' as const };
  }
  const subject = 'Cylinder enquiry - ' + line(data.postcode).toUpperCase() + ' - ' + line(data.service);
  const body = [
    'Hello G3 Qualified Engineer London,',
    '',
    'I would like to discuss an assessment and availability.',
    '',
    'Name: ' + line(data.name),
    'Phone: ' + line(data.phone),
    'Email: ' + line(data.email),
    'Postcode: ' + line(data.postcode).toUpperCase(),
    'Service: ' + line(data.service),
    'Equipment make/model: ' + line(data.model).slice(0, 160),
    'Symptoms: ' + clean(data.symptoms),
    'Access / preferred time: ' + line(data.access).slice(0, 200),
    '',
    'I understand that this enquiry does not confirm a booking.',
  ].join('\n');
  const target = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  return {
    errors: {} as EnquiryErrors,
    subject,
    body,
    mailto: target.length <= 1800 ? target : '',
    status: 'draft-prepared' as const,
    notice: 'Draft prepared. Send it using your email application, or copy the text into webmail. It has not been sent by this website.',
  };
}
