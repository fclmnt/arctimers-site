(() => {
    const root = document.documentElement;
    root.classList.remove("no-js");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Appearance: follows the system until the header button pins light or dark.
    // The <head> script applies a saved choice before the first paint.
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    const colors = { light: "#e9e1d2", dark: "#0f1116" };
    const pinned = () => (root.dataset.theme === "light" || root.dataset.theme === "dark" ? root.dataset.theme : null);
    const current = () => pinned() || (systemDark.matches ? "dark" : "light");
    const toggle = document.querySelector(".theme-toggle");

    const applyTheme = () => {
        const theme = pinned();
        // Screenshots: the dark sources carry the system query; a pinned theme overrides it.
        document.querySelectorAll('source[data-scheme="dark"]').forEach((source) => {
            source.media = theme ? (theme === "dark" ? "all" : "not all") : "(prefers-color-scheme: dark)";
        });
        document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
            meta.content = colors[theme || (meta.media.includes("dark") ? "dark" : "light")];
        });
        if (toggle) {
            const next = current() === "dark" ? "light" : "dark";
            toggle.setAttribute("aria-label", toggle.dataset[next === "dark" ? "labelDark" : "labelLight"]);
        }
    };

    if (toggle) {
        toggle.addEventListener("click", () => {
            const next = current() === "dark" ? "light" : "dark";
            // Back to following the system when the choice matches it.
            const matchesSystem = next === (systemDark.matches ? "dark" : "light");
            const swap = () => {
                if (matchesSystem) delete root.dataset.theme;
                else root.dataset.theme = next;
                applyTheme();
            };
            // Cross-fade instead of flashing the whole page to the other brightness.
            if (document.startViewTransition && !reduceMotion) document.startViewTransition(swap);
            else swap();
            try {
                if (matchesSystem) localStorage.removeItem("theme");
                else localStorage.setItem("theme", next);
            } catch (e) {}
        });
    }
    systemDark.addEventListener("change", applyTheme);
    applyTheme();

    // Header border once the page scrolls.
    const header = document.querySelector(".site-header");
    const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Fade sections in as they enter the viewport.
    const revealed = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealed.forEach((el) => el.classList.add("in"));
    } else {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in");
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -10% 0px" });
        revealed.forEach((el) => io.observe(el));
    }

    // FAQ answers slide open and shut. CSS can't animate a <details> to its natural height
    // in Safari, so the height is animated here, from wherever it is if clicked mid-slide.
    if (!reduceMotion) {
        document.querySelectorAll(".faq details").forEach((details) => {
            const summary = details.querySelector("summary");
            let opening = details.open;
            let animation = null;
            summary.addEventListener("click", (event) => {
                event.preventDefault();
                opening = !opening;
                const start = details.getBoundingClientRect().height;
                if (animation) animation.cancel();
                details.classList.remove("closing");
                details.open = opening;
                const end = details.getBoundingClientRect().height;
                details.open = true;
                details.classList.toggle("closing", !opening);
                details.style.overflow = "hidden";
                animation = details.animate(
                    { height: [`${start}px`, `${end}px`] },
                    { duration: 300, easing: "cubic-bezier(.2,.7,.2,1)" }
                );
                animation.onfinish = () => {
                    details.open = opening;
                    details.classList.remove("closing");
                    details.style.overflow = "";
                    animation = null;
                };
            });
        });
    }

    // Hero "Ends in" readout: counts down from the time in its data attribute, fills
    // the hour's progress bar, and starts over at zero.
    const time = document.querySelector("[data-countdown]");
    if (time) {
        const start = Number(time.dataset.countdown) || 22 * 60 + 41;
        const bar = document.querySelector(".chip .bar");
        const minutes = time.dataset.minutes || "m";
        let seconds = start;
        const render = () => {
            const m = Math.floor(seconds / 60);
            const s = String(seconds % 60).padStart(2, "0");
            time.textContent = `${m}${minutes} ${s}s`;
            if (bar) bar.style.setProperty("--progress", `${((3600 - seconds) / 3600) * 100}%`);
        };
        render();
        if (!reduceMotion) {
            setInterval(() => {
                seconds = seconds > 0 ? seconds - 1 : start;
                render();
            }, 1000);
        }
    }
})();
