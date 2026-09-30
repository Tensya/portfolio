# Alex.Das — Portfolio

Portfolio d'Alexandre Correia Da Silva : montage et VFX.
En ligne : https://tensya.github.io/portfolio/

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

## Mettre à jour le site en ligne

Après une modification : commit, puis push sur la branche `main`.
GitHub Pages met le site à jour automatiquement en 1 à 2 minutes.
