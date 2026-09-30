// Script commun à toutes les pages du portfolio.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// =========================================================
// Vidéos (vignettes + lightbox)
// Accepte un lien YouTube, Vimeo, ou un fichier .mp4 local.
// Si data-video est vide, on affiche un emplacement "Vidéo à venir".
// =========================================================

function youtubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function embedUrl(url) {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0&autoplay=1`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (vimeo) {
    const hash = vimeo[2] ? `&h=${vimeo[2]}` : "";
    return `https://player.vimeo.com/video/${vimeo[1]}?title=0&byline=0&portrait=0&autoplay=1${hash}`;
  }
  return null;
}

function createPlayer(url, title) {
  if (/\.(mp4|webm)$/i.test(url)) {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.autoplay = true;
    return video;
  }
  const src = embedUrl(url);
  if (!src) return null;
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.title = title;
  iframe.allow = "autoplay; fullscreen; picture-in-picture";
  iframe.allowFullscreen = true;
  return iframe;
}

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l16 9-16 9z"/></svg>';
const EMPTY_SLOT = `
  <span class="video__empty">
    <span class="video__rec">REC</span>
    <span class="video__play">${PLAY_ICON}</span>
    <span class="video__label">Vidéo à venir</span>
  </span>`;

const lightbox = document.querySelector(".lightbox");

if (lightbox) {
  const frame = lightbox.querySelector(".lightbox__frame");
  let lastFocus = null;

  const open = (url, title) => {
    const player = createPlayer(url, title);
    if (!player) return;
    lastFocus = document.activeElement;
    frame.replaceChildren(player);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".lightbox__close").focus();
  };

  const close = () => {
    lightbox.hidden = true;
    frame.replaceChildren(); // coupe la vidéo
    document.body.style.overflow = "";
    lastFocus?.focus();
  };

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.closest(".lightbox__close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) close();
  });

  document.querySelectorAll(".card").forEach((card) => {
    const url = (card.dataset.video || "").trim();
    const title = card.querySelector(".card__title")?.textContent || "Vidéo";
    const thumbBox = card.querySelector(".card__thumb");

    if (!url) {
      card.disabled = true;
      card.classList.add("card--empty");
      thumbBox.innerHTML = EMPTY_SLOT;
      return;
    }

    const yt = youtubeId(url);
    const thumb = card.dataset.thumb || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : "");
    thumbBox.innerHTML = `
      ${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : ""}
      <span class="card__play">${PLAY_ICON}</span>`;
    card.setAttribute("aria-label", `Lire : ${title}`);
    card.addEventListener("click", () => open(url, title));
  });
}

// =========================================================
// Liens e-mail : beaucoup d'ordinateurs n'ont pas de logiciel de mail
// configuré, donc on copie aussi l'adresse et on l'affiche dans un message.
// =========================================================

const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.appendChild(toast);
let toastTimer;

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 3500);
}

document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  link.addEventListener("click", () => {
    const email = link.getAttribute("href").replace("mailto:", "");
    navigator.clipboard?.writeText(email).then(
      () => showToast(`Adresse copiée : ${email}`),
      () => showToast(email)
    );
  });
});

// =========================================================
// Apparition au scroll (avec un léger décalage dans les grilles)
// =========================================================

document.querySelectorAll(".cards, .works, .skills").forEach((grid) => {
  grid.querySelectorAll(":scope > .reveal").forEach((el, i) => {
    el.style.transitionDelay = `${i * 90}ms`;
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// =========================================================
// Animations liées au scroll (une seule boucle pour tout)
// =========================================================

const progress = document.querySelector(".progress");
const orb = document.querySelector(".hero__orb");
const heroContent = document.querySelector(".hero__content");
const floats = [...document.querySelectorAll(".float")];

const marquees = [...document.querySelectorAll(".marquee__track")].map((track) => ({ track, x: 0 }));
const MARQUEE_SPEED = 0.6; // pixels par image, vitesse constante

const timeline = document.querySelector(".timeline__track");
const playhead = timeline?.querySelector(".timeline__playhead");
const clips = timeline ? [...timeline.querySelectorAll(".clip")] : [];
const TIMELINE_LOOP = 9000; // durée d'un passage de la tête de lecture (ms)

function tick(now) {
  const y = window.scrollY;

  // barre de progression
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }

  // sphère du hero : descend, tourne et grossit un peu ; le texte s'efface
  if (orb && y < window.innerHeight * 1.2) {
    orb.style.transform = `translateY(calc(-50% + ${y * 0.35}px)) rotate(${y * 0.06}deg) scale(${1 + y * 0.0005})`;
    heroContent.style.transform = `translateY(${y * 0.18}px)`;
    heroContent.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.8));
  }

  // étoiles en parallaxe
  floats.forEach((el) => {
    const s = Number(el.dataset.speed) || 0;
    el.style.transform = `translate3d(0, ${y * s}px, 0) rotate(${y * s * 0.4}deg)`;
  });

  // bandeau : défile en continu à vitesse constante
  marquees.forEach((m) => {
    const half = m.track.scrollWidth / 2;
    m.x -= MARQUEE_SPEED;
    if (m.x <= -half) m.x += half;
    m.track.style.transform = `translate3d(${m.x}px, 0, 0)`;
  });

  // timeline : la tête de lecture balaie les clips et allume celui qu'elle traverse
  if (timeline) {
    const t = (now % TIMELINE_LOOP) / TIMELINE_LOOP;
    let active;
    if (playhead && playhead.offsetParent) {
      const inner = timeline.clientWidth - 28;
      const px = t * inner;
      playhead.style.transform = `translateX(${px}px)`;
      const headX = timeline.getBoundingClientRect().left + 14 + px;
      active = clips.findIndex((c) => {
        const r = c.getBoundingClientRect();
        return headX >= r.left && headX <= r.right + 4;
      });
    } else {
      active = Math.floor(t * clips.length); // mobile : on allume les étapes à tour de rôle
    }
    clips.forEach((c, i) => c.classList.toggle("is-active", i === active));
  }

  requestAnimationFrame(tick);
}

if (!reduceMotion) requestAnimationFrame(tick);

// ---------- Année du footer ----------
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
