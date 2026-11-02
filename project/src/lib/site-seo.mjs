export function canonical(site, page) {
  if (!page.path.startsWith('/') || page.path.includes('?') || page.path.includes('#') || page.path.includes('..')) throw new Error('Invalid canonical path');
  return site.domain.replace(/\/$/, '') + page.path;
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function metadata(site, page, options = {}) {
  const url = canonical(site, page);
  const production = options.production === true;
  const indexable = page.indexable === true && (!page.approvalRequired || site.author.publicProfileApproved === true);
  return {
    title: page.title,
    description: page.description,
    canonical: url,
    robots: production && indexable ? 'index,follow,max-image-preview:large' : 'noindex,follow',
    lang: 'en-GB',
    ogType: page.type === 'article' ? 'article' : 'website',
    ogImage: site.domain + '/images/g3-social-preview.png',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
  };
}

export function schema(site, page) {
  if (page.type === 'notfound') return { '@context': 'https://schema.org', '@graph': [] };
  const root = site.domain.replace(/\/$/, '') + '/';
  const url = canonical(site, page);
  const orgId = root + '#organization';
  const websiteId = root + '#website';
  const pageId = url + '#webpage';

  const org = {
    '@type': 'Organization',
    '@id': orgId,
    name: site.name,
    url: root,
    telephone: site.phoneE164,
    email: site.email,
    description: site.positioning,
    logo: { '@type': 'ImageObject', url: root + 'images/g3-qualified-engineer-logo.svg' },
    areaServed: { '@type': 'City', name: 'London' },
  };
  const ownedSocial = Object.values(site.socialProfiles || {}).filter((x) => typeof x === 'string' && /^https:\/\//.test(x));
  if (ownedSocial.length) org.sameAs = ownedSocial;
  if (site.address?.verified === true && site.address.streetAddress && site.address.postalCode) {
    org['@type'] = ['Organization', 'Plumber'];
    org.address = {
      '@type': 'PostalAddress',
      streetAddress: site.address.streetAddress,
      addressLocality: site.address.addressLocality,
      postalCode: site.address.postalCode,
      addressCountry: 'GB',
    };
    if (Array.isArray(site.openingHours) && site.openingHours.length) org.openingHoursSpecification = site.openingHours;
  }

  const website = { '@type': 'WebSite', '@id': websiteId, url: root, name: site.name, publisher: { '@id': orgId }, inLanguage: 'en-GB' };
  const kinds = {
    home: 'WebPage',
    collection: 'CollectionPage',
    contact: 'ContactPage',
    about: 'AboutPage',
    policy: 'WebPage',
    web: 'WebPage',
    service: 'WebPage',
    area: 'WebPage',
    article: 'WebPage',
    faq: 'FAQPage',
    profile: site.author.publicProfileApproved ? 'ProfilePage' : 'WebPage',
  };
  const node = { '@type': kinds[page.type] || 'WebPage', '@id': pageId, url, name: page.h1, description: page.description, isPartOf: { '@id': websiteId }, publisher: { '@id': orgId }, inLanguage: 'en-GB' };
  if (page.image) node.primaryImageOfPage = { '@type': 'ImageObject', url: site.domain + page.image };
  if (page.lastTechnicalReview && page.reviewer) node.lastReviewed = page.lastTechnicalReview;

  const graph = [org, website, node];

  if (page.path !== '/' && page.breadcrumb?.length) {
    const id = url + '#breadcrumbs';
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': id,
      itemListElement: page.breadcrumb.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: site.domain + item.path,
      })),
    });
    node.breadcrumb = { '@id': id };
  }

  if (page.type === 'service' || page.type === 'area') {
    const id = url + '#service';
    graph.push({
      '@type': 'Service',
      '@id': id,
      name: page.h1,
      description: page.answer,
      provider: { '@id': orgId },
      areaServed: { '@type': page.areaName ? 'Place' : 'City', name: page.areaName || 'London' },
      url,
      serviceType: page.areaName ? 'Unvented cylinder service enquiries' : page.h1,
    });
    node.mainEntity = { '@id': id };
  }

  if (page.type === 'article') {
    const id = url + '#article';
    const article = {
      '@type': 'TechArticle',
      '@id': id,
      headline: page.h1,
      description: page.answer,
      mainEntityOfPage: { '@id': pageId },
      publisher: { '@id': orgId },
      author: { '@id': orgId },
      inLanguage: 'en-GB',
    };
    if (page.datePublished) article.datePublished = page.datePublished;
    if (page.dateModified) article.dateModified = page.dateModified;
    if (page.image) article.image = site.domain + page.image;
    const citations = (page.sourceIds || []).map((sid) => site.sources[sid]?.url).filter(Boolean);
    if (citations.length) article.citation = citations;
    graph.push(article);
    node.mainEntity = { '@id': id };
    if (page.authorName && site.author.publicProfileApproved === true && page.authorName === site.author.name) {
      article.author = { '@id': root + '#yassi' };
    }
  }

  if (site.author.publicProfileApproved === true && (page.type === 'profile' || page.authorName === site.author.name)) {
    const person = {
      '@type': 'Person',
      '@id': root + '#yassi',
      name: site.author.fullName || site.author.name,
      jobTitle: site.author.role,
      worksFor: { '@id': orgId },
      url: root + 'author/yassi',
    };
    if (site.author.photo) person.image = site.domain + site.author.photo;
    const sameAs = [site.author.linkedin, site.author.x].filter((x) => typeof x === 'string' && /^https:\/\//.test(x));
    if (sameAs.length) person.sameAs = sameAs;
    if (site.author.credentials?.length) person.hasCredential = site.author.credentials;
    graph.push(person);
    if (page.type === 'profile') node.mainEntity = { '@id': person['@id'] };
  }

  if (page.type === 'collection' && page.links?.length) {
    const id = url + '#itemlist';
    graph.push({
      '@type': 'ItemList',
      '@id': id,
      itemListElement: page.links.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        url: site.domain + item.path,
      })),
    });
    node.mainEntity = { '@id': id };
  }

  if (page.faqs?.length) {
    const questions = page.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    }));
    if (page.type === 'faq') {
      node.mainEntity = questions;
    } else {
      graph.push({
        '@type': 'FAQPage',
        '@id': url + '#faq',
        url: url + '#faqs',
        isPartOf: { '@id': pageId },
        mainEntity: questions,
      });
    }
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function sitemap(site, pages, options = {}) {
  const origin = site.domain.replace(/\/$/, '');
  const selected = options.production === true ? pages.filter((page) => page.indexable && (!page.approvalRequired || site.author.publicProfileApproved)) : [];
  const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    selected.map((page) => '<url><loc>' + escape(origin + page.path) + '</loc>' + (page.dateModified ? '<lastmod>' + escape(page.dateModified) + '</lastmod>' : '') + '</url>').join('\n') +
    '\n</urlset>\n'
  );
}
