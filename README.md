# Alex.Das — Portfolio

Portfolio d'Alexandre Correia Da Silva : montage et VFX.
En ligne : https://alexdasvfx.github.io/

## Fichiers

- `index.html` : la page d'accueil (tuiles des catégories, savoir-faire, à propos, contact)
- `projets.html` : la page Projets (edits, VFX, exercices)
- `courts-metrages.html` : la page Courts-métrages
- `style.css` : le design (couleurs, polices, animations)
- `script.js` : les lecteurs vidéo et les animations au scroll

## Ajouter une vidéo

1. Mets ta vidéo en ligne sur **Vimeo** ou **YouTube** (en « non répertoriée » si tu veux).
2. Copie le lien de la vidéo.
3. Dans `projets.html` ou `courts-metrages.html`, trouve la vignette et colle le lien dans `data-video=""`
   (la vidéo s'ouvre en grand au clic) :

```html
<button class="card reveal" type="button" data-video="https://youtu.be/XXXXXXXXXXX" data-thumb="">
```

Pour YouTube, la miniature est trouvée automatiquement. Pour Vimeo, mets le chemin d'une image dans `data-thumb` (ex. `images/projet1.jpg`).

Tant que `data-video` est vide, le site affiche un cadre « Vidéo à venir ».

**Aperçu au survol (optionnel)** : exporte un extrait de 3 à 5 s, sans son, en .mp4 léger
(moins de 3 Mo, 720p suffit), mets-le dans le dossier `clips/` et ajoute `data-preview` :

```html
<button class="card reveal" type="button" data-video="https://youtu.be/XXXXXXXXXXX" data-preview="clips/projet1.mp4">
```

## Traduction anglaise

Chaque texte a sa version anglaise juste à côté, dans `data-en="..."`.
Quand tu ajoutes un titre de projet, ajoute aussi sa traduction : `<span class="card__title" data-en="My title">Mon titre</span>`.

## Mettre à jour le site en ligne

Après une modification : commit, puis push sur la branche `main`.

Si tu modifies `style.css` ou `script.js`, change aussi le numéro `?v=...` dans les 3 pages HTML
(ex. `style.css?v=20261001` → `style.css?v=20261015`), pour que les visiteurs reçoivent la nouvelle version.
GitHub Pages met le site à jour automatiquement en 1 à 2 minutes.
