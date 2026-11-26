// Everything a crawler reads, generated from portfolio.config.json so it cannot drift from what the
// canvas and the editor show: the <head> of both pages, the JSON-LD graph, the static README on the
// root page, the no-JS fallback inside /site/, llms.txt and sitemap.xml.
//
// Invariants:
//   * Pure functions: no file or network access here. build-data.mjs reads, calls and writes.
//   * Every string that came from config or from the network goes through esc() before it is HTML.
//   * The @id values (#person, #profile, #website, #photo) are stable anchors that other sites'
//     sameAs/links resolve against. Do not rename them.
// Why the README is real, visible HTML and not sr-only text: the intro is a canvas, so without it
// the canonical URL would carry no readable content at all. See AGENTS.md, "Landmines".

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
const abs = (base, path) => new URL(path, base).href;
// Only http(s) and mailto links are ever written: the feed is third-party input.
const safeUrl = (url) => (/^(https?:\/\/|mailto:)/i.test(url || "") ? url : "#");
const link = (url, text, attrs = "") => `<a href="${esc(safeUrl(url))}"${attrs}>${esc(text)}</a>`;

// === HEAD ===

// page: "home" (the intro, canonical entity home) or "site" (the editor).
export function headHtml(config, page) {
  const seo = config.seo;
  const home = page === "home";
  const url = home ? seo.siteUrl : abs(seo.siteUrl, "site/");
  const title = home ? seo.title : seo.siteTitle;
  const description = home ? seo.description : seo.siteDescription;
  const image = abs(seo.siteUrl, seo.ogImage);
  const [first, ...rest] = config.identity.name.split(" ");
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="author" content="${esc(config.identity.name)}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta name="theme-color" content="#0b0b0a">`,
    `<meta property="og:type" content="${home ? "profile" : "website"}">`,
    `<meta property="og:site_name" content="${esc(config.identity.name)}">`,
    `<meta property="og:locale" content="${esc(seo.locale)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(seo.social)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(seo.ogImageAlt)}">`,
    ...(home
      ? [
          `<meta property="profile:first_name" content="${esc(first)}">`,
          `<meta property="profile:last_name" content="${esc(rest.join(" "))}">`,
          `<meta property="profile:username" content="${esc(config.identity.github)}">`,
        ]
      : []),
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="${esc(seo.twitter)}">`,
    `<meta name="twitter:creator" content="${esc(seo.twitter)}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(seo.social)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    `<meta name="twitter:image:alt" content="${esc(seo.ogImageAlt)}">`,
    ...config.links.filter((l) => l.me).map((l) => `<link rel="me" href="${esc(l.url)}">`),
    // The one font both pages set text in; preloading it removes a late swap on the README.
    `<link rel="preload" href="/assets/fonts/IBMPlexMono-Regular.ttf" as="font" type="font/ttf" crossorigin>`,
    ...(config.writing?.feed ? [`<link rel="alternate" type="application/rss+xml" title="${esc(config.writing.title || "Blog")}" href="${esc(config.writing.feed)}">`] : []),
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="/favicon.ico" sizes="32x32">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">`,
    `<script type="application/ld+json">\n${JSON.stringify(home ? jsonLd(config) : siteJsonLd(config), null, 1).replace(/</g, "\\u003c")}\n</script>`,
  ];
  return lines.join("\n");
}

// === JSON-LD ===

export function jsonLd(config, today = new Date().toISOString().slice(0, 10)) {
  const seo = config.seo;
  const p = seo.person;
  const id = (hash) => `${seo.siteUrl}#${hash}`;
  const place = (o) => ({ "@type": "PostalAddress", addressLocality: o.locality, addressRegion: o.region, addressCountry: o.country });
  const sameAs = config.links.filter((l) => l.me).map((l) => l.url);
  const credentials = (config.credentials || []).filter((c) => c.kind).map((c) => ({
    "@type": "EducationalOccupationalCredential",
    credentialCategory: c.kind,
    name: c.kind === "degree" ? c.name.replace(/^B\.Tech,/, "Bachelor of Technology,") : c.name,
    recognizedBy: { "@type": c.kind === "degree" ? "CollegeOrUniversity" : "Organization", name: c.issuer },
  }));
  const code = config.projects.filter((x) => x.schema).map((x) => ({
    "@type": "SoftwareSourceCode",
    "@id": id(slug(x.name)),
    name: x.name,
    description: x.desc,
    url: x.url,
    codeRepository: x.url,
    programmingLanguage: x.stack?.[0],
    author: { "@id": id("person") },
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": id("profile"),
        url: seo.siteUrl,
        name: seo.title,
        inLanguage: "en",
        dateCreated: `${seo.created}T00:00:00+05:30`,
        dateModified: `${today}T00:00:00+05:30`,
        isPartOf: { "@id": id("website") },
        about: { "@id": id("person") },
        mainEntity: { "@id": id("person") },
        primaryImageOfPage: { "@id": id("photo") },
      },
      {
        "@type": "WebSite",
        "@id": id("website"),
        url: seo.siteUrl,
        name: config.identity.name,
        alternateName: config.identity.github,
        inLanguage: "en",
        publisher: { "@id": id("person") },
      },
      {
        "@type": "Person",
        "@id": id("person"),
        name: config.identity.name,
        givenName: p.givenName,
        familyName: p.familyName,
        alternateName: p.alternateName,
        url: seo.siteUrl,
        image: { "@id": id("photo") },
        mainEntityOfPage: { "@id": id("profile") },
        email: p.email,
        jobTitle: p.jobTitle,
        description: p.description,
        worksFor: { "@type": "Organization", "@id": id(p.worksFor.id || slug(p.worksFor.name)), name: p.worksFor.name, url: p.worksFor.url },
        ...(p.occupation
          ? { hasOccupation: { "@type": "Occupation", name: p.occupation.name, skills: p.occupation.skills, occupationLocation: { "@type": "City", name: p.home.locality } } }
          : {}),
        homeLocation: { "@type": "Place", name: `${p.home.locality}, ${p.home.region}, India`, address: place(p.home) },
        alumniOf: p.alumniOf.map((a) => ({ "@type": "CollegeOrUniversity", name: a.name, url: a.url })),
        hasCredential: credentials,
        knowsAbout: p.knowsAbout,
        identifier: { "@type": "PropertyValue", propertyID: "ORCID", value: p.orcid, url: `https://orcid.org/${p.orcid}` },
        sameAs,
      },
      // Organisations the person owns or founded. Their @ids are published anchors too.
      ...(seo.organizations || []).map((o) => ({
        "@type": "Organization",
        "@id": id(o.id),
        name: o.name,
        description: o.description,
        ...(o.url ? { url: o.url } : {}),
        foundingDate: o.foundingDate,
        founder: { "@id": id("person") },
        location: { "@type": "Place", address: place(o) },
      })),
      // The blog lives on another host; naming the person as its author ties the two together.
      ...(config.writing
        ? [{ "@type": "Blog", "@id": `${config.writing.site}#blog`, url: config.writing.site, name: config.writing.title || "Blog", inLanguage: "en", author: { "@id": id("person") }, publisher: { "@id": id("person") } }]
        : []),
      ...code,
      {
        "@type": "ImageObject",
        "@id": id("photo"),
        url: abs(seo.siteUrl, seo.photo),
        contentUrl: abs(seo.siteUrl, seo.photo),
        width: 400,
        height: 400,
        caption: config.identity.name,
      },
    ],
  };
}

// /site/ is a second view of the same person: a WebPage that points back at the root's nodes, plus a breadcrumb.
export function siteJsonLd(config, today = new Date().toISOString().slice(0, 10)) {
  const seo = config.seo;
  const id = (hash) => `${seo.siteUrl}#${hash}`;
  const url = abs(seo.siteUrl, "site/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: seo.siteTitle,
        description: seo.siteDescription,
        inLanguage: "en",
        dateModified: `${today}T00:00:00+05:30`,
        isPartOf: { "@id": id("website") },
        about: { "@id": id("person") },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: config.identity.name, item: seo.siteUrl },
          { "@type": "ListItem", position: 2, name: "Editor", item: url },
        ],
      },
    ],
  };
}

// === README (root page, below the intro) ===

const h2 = (text) => `<h2><span class="md" aria-hidden="true">## </span>${esc(text)}</h2>`;
const day = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function workList(config) {
  return config.work
    .map((w) => {
      const org = w.url ? link(w.url, w.org) : esc(w.org);
      return `<li><span class="when">${esc(w.when)}</span><span class="what"><strong>${esc(w.title)}</strong>, ${org}${w.where ? ` · ${esc(w.where)}` : ""}<br>${esc(w.desc)}</span></li>`;
    })
    .join("\n");
}

function projectList(config) {
  const main = config.projects.filter((p) => !p.more);
  const more = config.projects.filter((p) => p.more);
  const item = (p) => `<li><span class="when">${esc(p.tag || "")}</span><span class="what"><strong>${link(p.url, p.name)}</strong><br>${esc(p.desc)}</span></li>`;
  const rest = more.length ? `\n<p class="more">More: ${more.map((p) => link(p.url, p.name)).join(", ")}</p>` : "";
  return `<ul class="rows">\n${main.map(item).join("\n")}\n</ul>${rest}`;
}

function writingList(config, posts) {
  const w = config.writing;
  if (!w) return "";
  const rows = posts.slice(0, 6).map((p) => `<li><span class="when">${esc(day(p.date))}</span><span class="what">${link(p.url, p.title)}</span></li>`);
  return `${h2("Writing")}\n<p>Field notes on application control, detection engineering and systems, at ${link(w.site, new URL(w.site).host)}.</p>\n${rows.length ? `<ul class="rows">\n${rows.join("\n")}\n</ul>\n` : ""}<p class="more">${link(w.archive, "All posts")}</p>`;
}

function credentialList(config) {
  return (config.credentials || [])
    .map((c) => `<li><span class="when">${esc(c.when || "")}</span><span class="what">${c.url ? link(c.url, c.name) : esc(c.name)}, ${esc(c.issuer)}</span></li>`)
    .join("\n");
}

export function readmeHtml(config, { posts = [], today }) {
  const p = config.seo.person;
  const lede = [p.jobTitle, p.worksFor.name, `${p.home.locality}, India`].join(" · ");
  const elsewhere = config.links.map((l) => `<li>${link(l.url, l.label, l.me ? ' rel="me"' : "")}</li>`).join("\n");
  return `<article class="readme" id="readme" aria-labelledby="readme-title">
<p class="readme-bar"><span>~/README.md</span><a href="#top">intro ↑</a></p>
<header class="readme-head">
<img src="/${esc(config.seo.photo)}" alt="${esc(config.identity.name)}" width="96" height="96" loading="lazy" decoding="async">
<div>
<h1 id="readme-title"><span class="md" aria-hidden="true"># </span>${esc(config.identity.name)}</h1>
<p class="lede">${esc(lede)}</p>
</div>
</header>
${config.about.long.map((text) => `<p>${esc(text)}</p>`).join("\n")}
<p class="more"><a href="/site/">Open the editor</a> for the full work log, project screenshots, stack and contribution calendar.</p>
${h2("Work")}
<ul class="rows">
${workList(config)}
</ul>
${h2("Open source")}
${projectList(config)}
${writingList(config, posts)}
${h2("Credentials")}
<ul class="rows">
${credentialList(config)}
</ul>
${h2("Elsewhere")}
<ul class="links">
${elsewhere}
</ul>
<footer class="readme-foot">
<p>Updated <time datetime="${esc(today)}">${esc(day(today))}</time> · built on ${link("https://github.com/pavanjoshi914/dev-portfolio-template", "dev-portfolio-template")} by Pavan Joshi</p>
</footer>
</article>`;
}

// === /site/ no-JS fallback (inside <noscript>, replaced by the editor when scripts run) ===

export function staticHtml(config, { posts = [] }) {
  const projects = config.projects.map((p) => `<li>${link(p.url, p.name)}: ${esc(p.desc)}</li>`).join("\n");
  const work = config.work.map((w) => `<li>${esc(w.when)}: ${esc(w.title)}, ${esc(w.org)}. ${esc(w.desc)}</li>`).join("\n");
  const writing = posts.slice(0, 6).map((p) => `<li>${link(p.url, p.title)}</li>`).join("\n");
  return `<div class="static">
<p><strong>${esc(config.identity.name)}</strong></p>
<p>${esc(config.about.bio)}</p>
<p>This page is an interactive editor and needs JavaScript. The same content is on the <a href="/#readme">README</a>.</p>
<p>Work</p>
<ul>
${work}
</ul>
<p>Projects</p>
<ul>
${projects}
</ul>${writing ? `\n<p>Writing</p>\n<ul>\n${writing}\n</ul>` : ""}
</div>`;
}

// === llms.txt and sitemap.xml ===

export function llmsTxt(config, { posts = [] }) {
  const seo = config.seo;
  const p = seo.person;
  const main = config.projects.filter((x) => !x.more);
  const [role] = config.work.filter((w) => w.org === p.worksFor.name);
  return `# ${config.identity.name}

> ${seo.summary}

This file is generated from portfolio.config.json by scripts/build-data.mjs and mirrors the facts on ${seo.siteUrl} (the canonical page).

## Profile

- Role: ${p.jobTitle}, ${p.worksFor.name} (${role ? role.when : ""})
- Location: ${p.home.locality}, ${p.home.region}, India
- Focus: ${p.knowsAbout.join(", ")}
- Contact: ${p.email}

## About

${config.about.long.join("\n\n")}

## Work

${config.work.map((w) => `- ${w.title}, ${w.org} (${w.when}): ${w.desc}`).join("\n")}

## Credentials

${(config.credentials || []).map((c) => `- ${c.name}, ${c.issuer}${c.when ? ` (${c.when})` : ""}`).join("\n")}

## Open source

${main.map((x) => `- [${x.name}](${x.url}): ${x.desc}`).join("\n")}
${posts.length ? `\n## Writing\n\n${posts.slice(0, 8).map((x) => `- [${x.title}](${x.url})`).join("\n")}\n- [All posts](${config.writing.archive})\n` : ""}
## Profiles

${config.links.filter((l) => l.me).map((l) => `- [${l.label}](${l.url})`).join("\n")}
`;
}

export function sitemapXml(config, today) {
  const urls = [config.seo.siteUrl, abs(config.seo.siteUrl, "site/")];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${esc(u)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join("\n")}
</urlset>
`;
}
