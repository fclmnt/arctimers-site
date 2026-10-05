(() => {
    document.documentElement.classList.remove("no-js");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // Hero countdown chip: ticks down from 9:59 and starts over.
    const time = document.querySelector("[data-countdown]");
    if (time) {
        let seconds = 10 * 60 - 1;
        const render = () => {
            const m = Math.floor(seconds / 60);
            const s = String(seconds % 60).padStart(2, "0");
            time.textContent = `${m}m ${s}s`;
        };
        render();
        if (!reduceMotion) {
            setInterval(() => {
                seconds = seconds > 0 ? seconds - 1 : 10 * 60 - 1;
                render();
            }, 1000);
        }
    }

    // App preview: plays while on screen, with a pause button.
    const video = document.querySelector(".video-frame video");
    const toggle = document.querySelector(".video-toggle");
    if (video && toggle) {
        let userPaused = reduceMotion;
        const setPressed = () => toggle.setAttribute("aria-pressed", String(!video.paused));
        video.addEventListener("play", setPressed);
        video.addEventListener("pause", setPressed);
        toggle.addEventListener("click", () => {
            if (video.paused) {
                userPaused = false;
                video.play().catch(() => {});
            } else {
                userPaused = true;
                video.pause();
            }
        });
        if ("IntersectionObserver" in window) {
            new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !userPaused) {
                        video.play().catch(() => {});
                    } else if (!entry.isIntersecting) {
                        video.pause();
                    }
                });
            }, { threshold: 0.35 }).observe(video);
        }
        setPressed();
    }
})();
