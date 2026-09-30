# iskandar.das — Portfolio

Portfolio de montage, VFX, motion design et étalonnage.
En ligne : https://tensya.github.io/portfolio/

## Fichiers

- `index.html` : le contenu du site (textes, projets, contact)
- `style.css` : le design (couleurs, polices, animations)
- `script.js` : les lecteurs vidéo et les animations au scroll

## Ajouter une vidéo

1. Mets ta vidéo en ligne sur **Vimeo** ou **YouTube** (en « non répertoriée » si tu veux).
2. Copie le lien de la vidéo.
3. Dans `index.html`, trouve le projet et colle le lien dans `data-video=""` :

```html
<div class="video" data-video="https://vimeo.com/123456789"></div>
```

Tant que `data-video` est vide, le site affiche un cadre « Vidéo à venir ».

## Mettre à jour le site en ligne

Après une modification : commit, puis push sur la branche `main`.
GitHub Pages met le site à jour automatiquement en 1 à 2 minutes.
