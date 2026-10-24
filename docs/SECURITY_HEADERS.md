# Public website response headers

The public domain was hosted on GitHub Pages when this work started on 24 October 2026. Its HTML already had meta CSP and referrer policies. GitHub Pages does not support the custom response headers required for frame-ancestors, X-Frame-Options, nosniff and an explicit HSTS policy.

`vercel.json` supplies these headers on the existing `clientovo-website-preview` Vercel project. It does not change DNS. Do not count the public-domain rollout as complete until direct responses from `https://clientovo.com` have been checked after the DNS cutover.

## Policy

- HTML retains its existing page-specific CSP script hashes, same-origin resources, styles and Formspree enquiry destination. The HTTP policy adds `frame-ancestors 'none'` to prevent framing.
- All responses use `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and disable camera, microphone and geolocation.
- HSTS is one year for this hostname only. Do not add includeSubDomains or preload without separately reviewing the app, scanner and other subdomains.
- Non-HTML resources use a restrictive default CSP. Images, fonts, styles, scripts and the example PDF remain directly accessible; they are not intended for third-party framing.
- HTML meta policies remain as protection for the parallel GitHub Pages deployment. HTTP and meta policies are both enforced, so keep their script hashes in sync.

Vercel runs the policy check during each build. After editing HTML or an inline script, update its meta policy hash, then run:

```sh
node scripts/security-headers.mjs
node scripts/security-headers.mjs --check
```

## Cutover

1. Deploy and verify the exact repository commit on the existing Vercel website project. Retain the current URLs, canonical links, form action and app links.
2. Confirm the existing Vercel account's plan permits the intended commercial hosting; this change does not purchase or upgrade a plan.
3. Attach `clientovo.com` to that website project and `www.clientovo.com` as a permanent redirect to the apex. Use the project-specific DNS recommendations returned by Vercel, not remembered IP values.
4. In the existing GoDaddy DNS zone, change only the apex website A records and the www website CNAME. Preserve MX, TXT, DKIM, autodiscover, app, scanner and verification records. Keep the existing nameservers.
5. Wait for Vercel verification/TLS, then check apex and www, HTTP-to-HTTPS, all HTML pages, a missing page, JavaScript/CSS/font/image MIME types, the example PDF, enquiry validation/submission handling, demo navigation and mobile menu. Check both actual response headers and browser policy violations.
6. Record the deployment SHA and acceptance evidence. The separate provider-security and enquiry inbox-delivery checklist items are not closed by this change.

## Recovery

Before changing DNS, record the existing website entries. The observed apex had four GitHub Pages A values: 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153. Reconfirm these against the actual zone before treating them as a rollback record. Rollback can restore the saved website DNS entries while GitHub Pages still serves this repository and its CNAME. Do not delete the GitHub Pages configuration during cutover.
