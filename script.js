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
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0&autoplay=1&enablejsapi=1`;

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

// Volume de départ (data-volume="0.2" sur la vignette = 20 %), pour une vidéo dont le son est trop fort.
// Vimeo et YouTube acceptent cet ordre par message ; on le renvoie plusieurs fois le temps que le lecteur soit prêt.
function setStartVolume(player, volume) {
  if (player.tagName === "VIDEO") { player.volume = volume; return; }
  const send = () => {
    const win = player.contentWindow;
    if (!win) return;
    if (player.src.includes("vimeo")) win.postMessage({ method: "setVolume", value: volume }, "https://player.vimeo.com");
    else win.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [Math.round(volume * 100)] }), "*");
  };
  player.addEventListener("load", () => [0, 500, 1200, 2500].forEach((t) => setTimeout(send, t)), { once: true });
}

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l16 9-16 9z"/></svg>';
const EMPTY_SLOT = `
  <span class="video__empty">
    <span class="video__rec">REC</span>
    <span class="video__play">${PLAY_ICON}</span>
    <span class="video__label" data-en="Coming soon">Vidéo à venir</span>
  </span>`;

const lightbox = document.querySelector(".lightbox");

if (lightbox) {
  const frame = lightbox.querySelector(".lightbox__frame");
  let lastFocus = null;

  let closeTimer = null;

  const box = lightbox.querySelector(".lightbox__box");
  const caption = lightbox.querySelector(".lightbox__caption");
  const arrows = lightbox.querySelectorAll(".lightbox__nav");
  const playable = []; // vignettes qui ont une vidéo, dans l'ordre de la page
  let current = -1;

  // texte sous le lecteur : titre, ligne d'infos et phrase (data-desc / data-desc-en sur la vignette)
  const fillCaption = (card) => {
    const en = document.documentElement.lang === "en";
    const desc = (en && card.dataset.descEn) || card.dataset.desc || "";
    caption.innerHTML = `
      <span class="lightbox__meta">${card.querySelector(".card__meta")?.innerHTML || ""}</span>
      <span class="lightbox__title">${card.querySelector(".card__title")?.innerHTML || ""}</span>
      ${desc ? `<span class="lightbox__desc">${desc}</span>` : ""}`;
  };

  const show = (index) => {
    const card = playable[index];
    if (!card) return;
    const url = card.dataset.video.trim();
    const title = card.querySelector(".card__title")?.textContent || "Vidéo";
    const poster = card.querySelector(".card__thumb img")?.src;
    const ratio = card.dataset.ratio;
    const player = createPlayer(url, title);
    if (!player) return;
    // toutes les vidéos s'ouvrent à 50 %, sauf si la vignette indique un autre volume (data-volume)
    // (à régler à chaque fois : Vimeo garde sinon le dernier volume en mémoire)
    const volume = parseFloat(card.dataset.volume);
    setStartVolume(player, volume >= 0 && volume <= 1 ? volume : 0.5);
    current = index;
    clearTimeout(closeTimer);
    fillCaption(card);
    // statistiques : on compte l'ouverture de cette vidéo (événement GoatCounter "video/<titre>")
    const titleEl = card.querySelector(".card__title");
    const name = (titleEl?.dataset.fr ? new DOMParser().parseFromString(titleEl.dataset.fr, "text/html").body.textContent : title).trim();
    try { window.goatcounter?.count?.({ path: `video/${name}`, title: name, event: true }); } catch {}
    arrows.forEach((a) => { a.hidden = playable.length < 2; });
    // le lecteur prend le format de la vidéo (ex. vertical)
    if (ratio) box.style.setProperty("--ratio", ratio);
    else box.style.removeProperty("--ratio");
    // la vidéo apparaît en fondu une fois chargée, par-dessus la vignette, puis la vignette est retirée
    player.addEventListener(player.tagName === "VIDEO" ? "loadeddata" : "load", () => {
      player.classList.add("is-loaded");
      setTimeout(() => { if (frame.contains(player)) frame.style.backgroundImage = ""; }, 400);
    }, { once: true });
    frame.style.backgroundImage = poster ? `url("${poster}")` : "";
    frame.replaceChildren(player);
    if (!lightbox.hidden && lightbox.classList.contains("is-open")) return; // déjà ouvert : on change juste de vidéo
    lastFocus = document.activeElement;
    // on compense la barre de défilement qui disparaît, pour que la page ne bouge pas
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : "";
    lightbox.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => lightbox.classList.add("is-open")));
    lightbox.querySelector(".lightbox__close").focus({ preventScroll: true });
  };
  const step = (dir) => show((current + dir + playable.length) % playable.length);

  const close = () => {
    lightbox.classList.remove("is-open");
    lastFocus?.focus({ preventScroll: true });
    closeTimer = setTimeout(() => {
      lightbox.hidden = true;
      frame.replaceChildren(); // coupe la vidéo
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }, reduceMotion ? 0 : 350);
  };

  lightbox.addEventListener("click", (e) => {
    const nav = e.target.closest(".lightbox__nav");
    if (nav) step(Number(nav.dataset.dir));
    else if (e.target === lightbox || e.target.closest(".lightbox__close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
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
    // YouTube : miniature HD (maxresdefault), sinon repli sur la version standard
    const thumb = card.dataset.thumb || (yt ? `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg` : "");
    thumbBox.innerHTML = `
      ${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : ""}
      <span class="card__play">${PLAY_ICON}</span>`;
    if (yt && !card.dataset.thumb) {
      const img = thumbBox.querySelector("img");
      const fallback = () => { img.src = `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`; };
      img.addEventListener("error", fallback, { once: true });
      // quand la HD n'existe pas, YouTube renvoie une petite image grise de 120 px
      img.addEventListener("load", () => { if (img.naturalWidth <= 120) fallback(); }, { once: true });
    }

    // Vimeo : on récupère la miniature choisie sur Vimeo (via son service oEmbed)
    if (!thumb && /vimeo\.com/.test(url)) {
      fetch(`https://vimeo.com/api/oembed.json?width=960&url=${encodeURIComponent(url)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.width && data?.height) card.dataset.ratio = (data.width / data.height).toFixed(4);
          if (!data?.thumbnail_url) return;
          const img = document.createElement("img");
          img.src = data.thumbnail_url;
          img.alt = "";
          img.loading = "lazy";
          thumbBox.prepend(img);
        })
        .catch(() => {});
    }
    card.setAttribute("aria-label", `Lire : ${title}`);
    playable.push(card);
    card.addEventListener("click", () => show(playable.indexOf(card)));

    // Aperçu au survol : un court extrait .mp4 (sans son) qui tourne en boucle
    const preview = (card.dataset.preview || "").trim();
    if (preview && !reduceMotion) {
      let clip = null;
      card.addEventListener("mouseenter", () => {
        if (!clip) {
          clip = document.createElement("video");
          clip.className = "card__preview";
          clip.muted = true;
          clip.setAttribute("muted", ""); // requis par les navigateurs pour lancer sans clic
          clip.loop = true;
          clip.playsInline = true;
          clip.preload = "auto";
          clip.src = preview;
          clip.addEventListener("canplay", () => {
            if (card.classList.contains("is-previewing")) clip.play().catch(() => {});
          });
          thumbBox.prepend(clip);
        }
        clip.play().catch(() => {});
        card.classList.add("is-previewing");
      });
      card.addEventListener("mouseleave", () => {
        clip?.pause();
        card.classList.remove("is-previewing");
      });
    }
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
    const copied = document.documentElement.lang === "en" ? "Email copied:" : "Adresse copiée :";
    navigator.clipboard?.writeText(email).then(
      () => showToast(`${copied} ${email}`),
      () => showToast(email)
    );
  });
});

// =========================================================
// Langue FR / EN
// Chaque texte traduit porte sa version anglaise dans data-en="...".
// Le choix est retenu ; par défaut : français si le navigateur est en français.
// =========================================================

const langButtons = document.querySelectorAll(".lang-switch button");

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-en]").forEach((el) => {
    if (el.dataset.fr === undefined) el.dataset.fr = el.innerHTML;
    el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.fr;
  });
  langButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
}

let savedLang = null;
try { savedLang = localStorage.getItem("lang"); } catch {}
applyLang(savedLang || (navigator.language?.startsWith("fr") ? "fr" : "en"));

langButtons.forEach((b) =>
  b.addEventListener("click", () => {
    applyLang(b.dataset.lang);
    try { localStorage.setItem("lang", b.dataset.lang); } catch {}
  })
);

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
const heroVisual = document.querySelector(".hero__visual");
const viewer = document.querySelector(".viewer");
const viewerTc = document.querySelector(".viewer__tc");
const stacked = window.matchMedia("(max-width: 900px)"); // écran sous le texte (tablette / téléphone)

// Bande démo dans l'écran : data-showreel="clips/showreel.mp4"
const showreel = (viewer?.dataset.showreel || "").trim();
if (viewer && showreel) {
  const v = document.createElement("video");
  v.src = showreel;
  v.muted = true;
  v.setAttribute("muted", "");
  v.loop = true;
  v.autoplay = !reduceMotion;
  v.playsInline = true;
  viewer.prepend(v);
  viewer.classList.add("has-video");
}

// Sinon : aperçu, les images des vidéos défilent avec leur titre
const slides = viewer && !showreel ? [...viewer.querySelectorAll(".viewer__slide")] : [];
const viewerTitle = document.querySelector(".viewer__title");
let slideIndex = 0;
const slideTitle = (s) => (document.documentElement.lang === "en" && s.dataset.titleEn) || s.dataset.title;
if (viewerTitle && slides[0]) viewerTitle.textContent = slideTitle(slides[0]); // 1er titre dans la bonne langue
if (slides.length > 1 && !reduceMotion) {
  slides[0].classList.add("is-anim"); // la 1re image commence son dézoom tout de suite
  setInterval(() => {
    if (document.hidden) return;
    // l'image qui part disparaît en fondu mais garde son dézoom en cours ; on le remet à zéro une fois invisible
    const prev = slides[slideIndex];
    prev.classList.remove("is-on");
    setTimeout(() => { if (!prev.classList.contains("is-on")) prev.classList.remove("is-anim"); }, 1300);
    slideIndex = (slideIndex + 1) % slides.length;
    const next = slides[slideIndex];
    next.classList.remove("is-anim");
    void next.offsetWidth; // relance l'animation depuis le début
    next.classList.add("is-anim", "is-on");
    viewerTitle.classList.add("is-changing");
    setTimeout(() => {
      viewerTitle.textContent = slideTitle(slides[slideIndex]);
      viewerTitle.classList.remove("is-changing");
    }, 400);
  }, 3500);
}
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

  // timecode de l'écran (25 images/seconde, boucle de 60 s)
  if (viewerTc) {
    const frames = Math.floor(now / 40) % (60 * 25);
    const s = Math.floor(frames / 25);
    viewerTc.textContent = `00:00:${String(s).padStart(2, "0")}:${String(frames % 25).padStart(2, "0")}`;
  }

  // hero : l'écran descend doucement, le texte s'efface
  // (sur téléphone/tablette, rien ne bouge au scroll : sinon le texte passe sur l'écran)
  if (heroContent && y < window.innerHeight * 1.2) {
    if (stacked.matches) {
      heroContent.style.transform = "";
      heroContent.style.opacity = "";
      if (heroVisual) heroVisual.style.transform = "";
    } else {
      if (heroVisual) heroVisual.style.transform = `translateY(calc(-50% + ${y * 0.25}px))`;
      heroContent.style.transform = `translateY(${y * 0.18}px)`;
      heroContent.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.8));
    }
  }

  // étoiles en parallaxe (masquées sur téléphone, voir style.css)
  if (!stacked.matches) floats.forEach((el) => {
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

// ---------- Tuiles de l'accueil : les images défilent en fondu au survol ----------
document.querySelectorAll(".tile").forEach((tile) => {
  const imgs = [...tile.querySelectorAll(".tile__img")];
  if (imgs.length < 2 || reduceMotion) return;
  let i = 0, timer = null;
  const show = (n) => {
    imgs[i].classList.remove("is-on");
    i = n % imgs.length;
    imgs[i].classList.add("is-on");
  };
  const touch = window.matchMedia("(hover: none)").matches; // téléphone / tablette : pas de souris
  const start = () => {
    clearInterval(timer);
    show(i + 1);
    timer = setInterval(() => show(i + 1), touch ? 2500 : 1400); // plus lent sur téléphone (ça tourne tout seul)
  };
  const stop = () => { clearInterval(timer); show(0); };
  // téléphone / tablette : ça défile tout seul quand la carte est à l'écran
  if (touch) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.5 }).observe(tile);
  } else {
    tile.addEventListener("mouseenter", start);
    tile.addEventListener("mouseleave", stop);
  }
});

// ---------- Année du footer ----------
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
