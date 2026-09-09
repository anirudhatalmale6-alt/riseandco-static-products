/* ==========================================================================
   rise&co — products page store
   --------------------------------------------------------------------------
   Vanilla JavaScript. No jQuery, no framework, no back end, no network calls.

   It does two things:
     1. Renders the category / product grid from the data in js/catalog.js
     2. Opens a product detail overlay (photo gallery + description) when a
        "More Details and Pics" button is pressed

   The old ecommerce plugin fetched all of this from its servers at runtime.
   Here the same content is baked into js/catalog.js, so the page is fully
   self-contained and works from any plain web host, or straight off disk.

   To change a product: edit js/catalog.js. Nothing in this file needs touching.
   ========================================================================== */

(function () {
    "use strict";

    /* Where product photos live, relative to products.html. */
    var IMAGE_PATH = "images/products/";

    /* Text of the button under each product on the grid. */
    var GRID_BUTTON_LABEL = "More Details and Pics";

    /* ----------------------------------------------------------------------
       Small helpers
       ---------------------------------------------------------------------- */

    /* Builds an element with attributes and children in one call. */
    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (key) {
                if (key === "class") {
                    node.className = attrs[key];
                } else if (key === "html") {
                    node.innerHTML = attrs[key];
                } else if (key === "text") {
                    node.textContent = attrs[key];
                } else if (attrs[key] !== null && attrs[key] !== undefined) {
                    node.setAttribute(key, attrs[key]);
                }
            });
        }
        (children || []).forEach(function (child) {
            if (child) { node.appendChild(child); }
        });
        return node;
    }

    /* Flattens the catalog into one lookup so the overlay can find a product
       by its slug without walking the categories every time. */
    function indexBySlug(catalog) {
        var map = {};
        catalog.forEach(function (category) {
            category.products.forEach(function (product) {
                map[product.slug] = { product: product, category: category };
            });
        });
        return map;
    }

    /* ----------------------------------------------------------------------
       Grid
       ---------------------------------------------------------------------- */

    function buildCard(product) {
        var image = el("div", { class: "store-product__image" }, [
            el("img", {
                src: IMAGE_PATH + product.images[0],
                alt: product.title,
                loading: "lazy",
                width: "360",
                height: "481"
            })
        ]);

        var button = el("button", {
            class: "store-button",
            type: "button",
            "data-product": product.slug
        });
        button.textContent = GRID_BUTTON_LABEL;

        var card = el("div", { class: "store-product__card" }, [
            image,
            el("div", { class: "store-product__title", text: product.title }),
            el("div", { class: "store-product__price", text: product.price }),
            el("div", { class: "store-product__actions" }, [button])
        ]);

        return el("li", { class: "store-product" }, [card]);
    }

    function buildCategory(category) {
        var grid = el("ul", { class: "store-grid" },
            category.products.map(buildCard));

        return el("section", { class: "store-category" }, [
            el("h2", { class: "store-category__title", text: category.name }),
            /* The description wraps its text in a <p> so the theme's own
               paragraph styling applies, exactly as it did on the original. */
            category.description
                ? el("div", { class: "store-category__description" }, [
                      el("p", { text: category.description })
                  ])
                : null,
            grid
        ]);
    }

    function renderStore(root, catalog) {
        var fragment = document.createDocumentFragment();
        catalog.forEach(function (category) {
            fragment.appendChild(buildCategory(category));
        });
        root.appendChild(fragment);
    }

    /* ----------------------------------------------------------------------
       Product detail overlay
       ---------------------------------------------------------------------- */

    function Modal(catalogIndex) {
        var self = this;
        this.index = catalogIndex;
        this.lastFocus = null;

        this.mainImage = el("img", { src: "", alt: "" });
        this.thumbs = el("ul", { class: "store-gallery__thumbs" });

        this.title = el("h2", { class: "store-modal__title" });
        this.breadcrumb = el("p", { class: "store-modal__breadcrumb" });
        this.price = el("p", { class: "store-modal__price" });
        this.stock = el("p", { class: "store-modal__stock" });
        this.description = el("div", { class: "store-modal__description" });

        var close = el("button", {
            class: "store-modal__close",
            type: "button",
            "aria-label": "Close"
        });
        close.innerHTML = "&times;";
        close.addEventListener("click", function () { self.close(); });

        this.dialog = el("div", {
            class: "store-modal__dialog",
            role: "dialog",
            "aria-modal": "true"
        }, [
            close,
            this.title,
            this.breadcrumb,
            el("div", { class: "store-modal__body" }, [
                el("div", { class: "store-modal__gallery" }, [
                    el("div", { class: "store-gallery__main" }, [this.mainImage]),
                    this.thumbs
                ]),
                el("div", { class: "store-modal__info" }, [
                    this.price,
                    this.stock,
                    el("h3", { class: "store-modal__section-title", text: "Product Details" }),
                    this.description
                ])
            ])
        ]);

        this.root = el("div", { class: "store-modal" }, [this.dialog]);

        /* Clicking the dark backdrop (but not the dialog) closes the overlay. */
        this.root.addEventListener("click", function (event) {
            if (event.target === self.root) { self.close(); }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && self.isOpen()) { self.close(); }
        });

        document.body.appendChild(this.root);
    }

    Modal.prototype.isOpen = function () {
        return this.root.classList.contains("is-open");
    };

    Modal.prototype.setImage = function (file, buttons, activeIndex) {
        this.mainImage.src = IMAGE_PATH + file;
        buttons.forEach(function (button, i) {
            button.classList.toggle("is-active", i === activeIndex);
        });
    };

    Modal.prototype.open = function (slug) {
        var entry = this.index[slug];
        if (!entry) { return false; }

        var self = this;
        var product = entry.product;

        this.lastFocus = document.activeElement;

        this.title.textContent = product.title;
        this.breadcrumb.textContent = entry.category.name;
        this.price.textContent = product.price;
        this.stock.textContent = product.stock || "";
        this.stock.style.display = product.stock ? "" : "none";
        this.description.innerHTML = product.description || "";

        /* Rebuild the gallery for this product. */
        this.thumbs.innerHTML = "";
        this.mainImage.alt = product.title;

        var buttons = [];
        product.images.forEach(function (file, i) {
            var thumbImage = el("img", { src: IMAGE_PATH + file, alt: "", loading: "lazy" });
            var button = el("button", { type: "button", "aria-label": product.title + " photo " + (i + 1) }, [thumbImage]);
            button.addEventListener("click", function () {
                self.setImage(file, buttons, i);
            });
            buttons.push(button);
            self.thumbs.appendChild(el("li", { class: "store-gallery__thumb" }, [button]));
        });

        /* A single photo needs no thumbnail strip. */
        this.thumbs.style.display = product.images.length > 1 ? "" : "none";
        this.setImage(product.images[0], buttons, 0);

        this.root.classList.add("is-open");
        document.body.classList.add("store-modal-open");
        this.dialog.scrollTop = 0;
        this.root.scrollTop = 0;
        this.dialog.focus();
        return true;
    };

    Modal.prototype.close = function () {
        this.root.classList.remove("is-open");
        document.body.classList.remove("store-modal-open");

        /* Drop the deep-link from the address bar without adding history. */
        if (window.location.hash.indexOf("#!/") === 0) {
            history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        if (this.lastFocus && this.lastFocus.focus) { this.lastFocus.focus(); }
    };

    /* ----------------------------------------------------------------------
       Wire everything up
       ---------------------------------------------------------------------- */

    function init() {
        var root = document.getElementById("store");
        if (!root || typeof RISE_CATALOG === "undefined") { return; }

        renderStore(root, RISE_CATALOG);

        var modal = new Modal(indexBySlug(RISE_CATALOG));

        /* One listener on the grid handles every product button. */
        root.addEventListener("click", function (event) {
            var button = event.target.closest("[data-product]");
            if (!button) { return; }
            var slug = button.getAttribute("data-product");
            if (modal.open(slug)) {
                history.replaceState(null, "", "#!/" + slug);
            }
        });

        /* Deep links: products.html#!/white-sourdough opens that product. */
        function openFromHash() {
            var match = /^#!\/(.+)$/.exec(window.location.hash);
            if (match) { modal.open(decodeURIComponent(match[1])); }
        }
        window.addEventListener("hashchange", openFromHash);
        openFromHash();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
