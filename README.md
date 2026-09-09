# rise&co — static products page

A self-contained, hand-coded replacement for `riseandco.com.au/products.html`.

The original page was a theme shell with an ecommerce plugin embedded in it. The
plugin fetched the categories, products, photos, prices and descriptions from its
own servers at page load and injected them into an empty `<div>`. Everything you
actually see on that page — the whole product grid — came down over the network
from that platform.

This version has no plugin and no back end. The same content is baked into the
page, so it works on any plain web host, or opened straight off a USB stick.

---

## What's in the box

```
products.html          the page
css/                   stylesheets
js/                    scripts + the product data
images/                site images
images/products/       the 35 product photos
fonts/                 Roboto Mono, Font Awesome, Glyphicons
favicon.ico
```

Total: about 8 MB, 40 requests, all served from your own domain.

---

## Deploying it

The page is static, so there is nothing to install and no server-side
requirements — no PHP, no database, no Node.

### Any normal web host (cPanel, Plesk, shared hosting)

1. Log in to your host's file manager, or connect over FTP/SFTP.
2. Go to your web root — usually `public_html`, `htdocs` or `www`.
3. Upload **the contents of this folder** (not the folder itself), so that
   `products.html` sits beside your existing `index.html`.
4. Visit `https://yourdomain.com/products.html`.

That's it. The folder structure must be kept as-is, because the page references
`css/`, `js/`, `images/` and `fonts/` relative to itself.

### Netlify / Cloudflare Pages / GitHub Pages

Drag the folder onto Netlify Drop, or point the service at the repository. There
is no build step — set the publish directory to the folder root and leave the
build command empty.

### Checking it locally before you upload

Opening `products.html` by double-clicking works in most browsers. If yours
blocks local files, run a one-line server from inside the folder:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/products.html`.

---

## A note on the navigation links

The menu links (`index.html#who-we-are`, `index.html#loyalty`, `order`, and so on)
are left exactly as they were on the original page. They point at the rest of the
site, so they resolve correctly once this file is deployed alongside it. On its
own, in isolation, those links will 404 — that is expected, not a fault.

---

## Editing the products

All product content lives in one file: **`js/catalog.js`**. It is plain data —
no code — laid out as a list of categories, each with a list of products:

```js
{
  "name": "Rolls & Bagels",
  "description": null,              // optional line under the category heading
  "products": [
    {
      "slug": "potato-milk-bun",    // used for the #!/deep-link
      "title": "Potato Milk Bun",
      "price": "AU$0.00",
      "stock": "In stock",
      "images": ["4521689987.jpg", "..."],   // files in images/products/
      "description": "<p>...</p>"
    }
  ]
}
```

To change a price, edit the `price` string. To add a product, copy an existing
block, drop your photos into `images/products/` and list their filenames. To
reorder anything, move the blocks around. Nothing else needs touching.

`js/products.js` reads that data and builds the grid. The two settings at the top
of it — the image folder and the button label — are the only things in there you
are likely to want to change.

---

## Styling

`css/products.css` holds everything for the product grid and the detail overlay,
and starts with a small block of variables:

```css
:root {
    --store-text:        #222222;   /* body + heading colour */
    --store-surface:     #f2f4f4;   /* card / button background */
    --store-border:      #c0c0c0;   /* card + button border */
    --store-image-ratio: 133.3333%; /* 3:4 portrait; = height / width */
    --store-gutter:      8px;       /* half the gap between cards */
}
```

Change those and the whole grid follows. The rest of the file is commented with
the measurements it reproduces.

The other stylesheets in `css/` are the original theme's, lifted unchanged apart
from re-pointing their font and image URLs at the local folders.

---

## Layout rules it reproduces

Measured off the live page, and matched to within a pixel:

| Viewport         | Columns | Category heading | Button          |
|------------------|---------|------------------|-----------------|
| under 515px      | 1       | 28px             | 16px / 40px tall|
| 515 – 719px      | 1       | 28px             | 14px / 32px tall|
| 720 – 1199px     | 2       | 28px             | 14px / 32px tall|
| 1200px and up    | 3       | 30px             | 16px / 40px tall|

---

## Optional: making it leaner

Two of the theme's plugins do nothing on this page — there is no carousel and no
form here. They are still loaded because `js/main.js` calls `.owlCarousel()` and
`.validate()` unconditionally, and would throw without them, which would stop the
page loader from clearing.

If you want them gone, do it as a pair:

1. In `js/main.js`, delete lines 76–90 — the `OWL CAROUSEL` block and the
   `$('.validate').validate();` line directly under `CONTACT FORM REQUEST`.
   Leave the `$(document).on('submit', ...)` handler below it alone; it is
   harmless, it simply never fires when there is no form on the page.
2. Remove these from `products.html`:
   - `<script src="js/owl.carousel.min.js">`
   - `<script src="js/jquery.validate.min.js">`
   - `<link href="css/owl.carousel.css">`
   - `<link href="css/owl.theme.css">`
3. Delete those four files.

That saves roughly 60 KB. Test the page afterwards — the loader should still
clear and the menu should still open.

A bigger saving is available in the images: `images/Textured_1.jpg` is 1.9 MB on
its own, and the product photos are full-size JPEGs. Converting them to WebP
would cut several megabytes without any visible change. I left them untouched so
this stays a faithful copy of what is live now — say the word if you want it done.
