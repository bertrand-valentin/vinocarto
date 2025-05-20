#!/bin/bash

FILE="$1"
BACKUP="${FILE%.svg}-old.svg"
TMP_FILE="__tmp_adapted.svg"

if [[ ! -f "$FILE" ]]; then
  echo "❌ Erreur : fichier introuvable."
  exit 1
fi

# Sauvegarde
cp "$FILE" "$BACKUP"

# Extraire width et height de façon portable
WIDTH=$(sed -n 's/.*width="\([^"]*\)".*/\1/p' "$FILE" | head -1)
HEIGHT=$(sed -n 's/.*height="\([^"]*\)".*/\1/p' "$FILE" | head -1)

if [[ -z "$WIDTH" || -z "$HEIGHT" ]]; then
  echo "❌ Impossible d'extraire les dimensions du SVG."
  exit 1
fi

# Adapter le SVG
awk -v w="$WIDTH" -v h="$HEIGHT" '
  BEGIN { replaced = 0 }
  /<svg/ {
    # Supprimer attributs inutiles
    gsub(/(sodipodi|inkscape|xmlns:[a-z]+|style|version|id|export-[a-z]+)="[^"]*"/, "")
    # Supprimer width/height existants
    gsub(/width="[^"]*"/, "")
    gsub(/height="[^"]*"/, "")
    # Ajouter width/height responsive et viewBox
    if ($0 !~ /viewBox/) {
      sub(/<svg/, "<svg width=\"100%\" height=\"100%\" viewBox=\"0 0 " w " " h "\" preserveAspectRatio=\"xMidYMid meet\"", $0)
    } else {
      sub(/viewBox="[^"]*"/, "viewBox=\"0 0 " w " " h "\"", $0)
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

echo "✅ SVG adapté avec viewBox 0 0 $WIDTH $HEIGHT. Sauvegarde : $BACKUP"