#!/bin/bash

# Usage: ./adapt_responsive_svg.sh fichier.svg

FILE="$1"
BACKUP="${FILE%.svg}-old.svg"
TMP_FILE="__tmp_adapted.svg"

if [[ ! -f "$FILE" ]]; then
  echo "❌ Erreur : fichier introuvable."
  exit 1
fi

# Sauvegarde
cp "$FILE" "$BACKUP"

# Adapter le SVG
awk '
  BEGIN { replaced = 0 }
  /<svg/ {
    # Supprimer attributs inutiles
    gsub(/(sodipodi|inkscape|xmlns:[a-z]+|style|version|id|export-[a-z]+)="[^"]*"/, "")
    # Supprimer width/height existants
    gsub(/width="[^"]*"/, "")
    gsub(/height="[^"]*"/, "")
    # Ajouter width/height responsive et viewBox
    if ($0 !~ /viewBox/) {
      sub(/<svg/, "<svg width=\"100%\" height=\"100%\" viewBox=\"0 0 1000 1000\" preserveAspectRatio=\"xMidYMid meet\"", $0)
    } else {
      sub(/viewBox="[^"]*"/, "viewBox=\"0 0 1000 1000\"", $0)
      $0 = "<svg width=\"100%\" height=\"100%\" preserveAspectRatio=\"xMidYMid meet\" " $0
    }
    replaced = 1
  }
  { print }
  END {
    if (!replaced) {
      print "Erreur : balise <svg> non trouvée." > "/dev/stderr"
      exit 1
    }
  }
' "$FILE" > "$TMP_FILE"

mv "$TMP_FILE" "$FILE"

echo "✅ SVG adapté pour affichage responsive. Sauvegarde : $BACKUP"