// ---------- Vidéos ----------
// Chaque <div class="video" data-video="..."> devient un lecteur.
// Accepte un lien YouTube, Vimeo, ou un fichier .mp4 local.
// Si data-video est vide, on affiche un emplacement "Vidéo à venir".

function embedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (vimeo) {
    const hash = vimeo[2] ? `&h=${vimeo[2]}` : "";
    return `https://player.vimeo.com/video/${vimeo[1]}?title=0&byline=0&portrait=0${hash}`;
  }
  return null;
}

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l16 9-16 9z"/></svg>';

document.querySelectorAll(".video").forEach((box) => {
  const url = (box.dataset.video || "").trim();
  const title = box.closest(".project")?.querySelector("h3")?.textContent || "Vidéo";

  if (!url) {
    box.innerHTML = `
      <div class="video__empty">
        <span class="video__rec">REC</span>
        <span class="video__play">${PLAY_ICON}</span>
        <span class="video__label">Vidéo à venir</span>
      </div>`;
    return;
  }

  if (/\.(mp4|webm)$/i.test(url)) {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    box.appendChild(video);
    return;
  }

  const src = embedUrl(url);
  if (src) {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = title;
    iframe.loading = "lazy";
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    box.appendChild(iframe);
  }
});

// ---------- Apparition au scroll ----------
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

// ---------- Année du footer ----------
document.getElementById("year").textContent = new Date().getFullYear();
