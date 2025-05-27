#!/bin/sh

if [ $# -ne 1 ]; then
  echo "Usage: $0 fichier.svg"
  exit 1
fi

INPUT_FILE="$1"
BASENAME=$(basename "$INPUT_FILE" .svg)
OUTPUT_FILE="${BASENAME}_split_paths.svg"

echo "🔍 Traitement de : $INPUT_FILE"

# Extraire l'attribut d du premier path
D=$(xmlstarlet sel -t -v "//path[1]/@d" "$INPUT_FILE")

if [ -z "$D" ]; then
  echo "❌ Impossible d'extraire l'attribut d."
  exit 1
fi

echo "📏 Contenu de l'attribut d extrait :"
echo "$D"

# Extraire les autres attributs (sauf d) du premier path
ATTRS=$(xmlstarlet sel -t -m "//path[1]/@*" -v "name()" -o "=" -v "." -n "$INPUT_FILE" | grep -v '^d=' | awk -F= '{print $1"="$2}' | sed 's/=/="/; s/$/"/' | tr '\n' ' ')
ATTRS=$(echo "$ATTRS" | sed 's/ $//')

echo "🧩 Autres attributs extraits :"
echo "$ATTRS"

# Découper le d à chaque 'M' sauf le premier vide
echo "<!-- Découpage du path original -->" > "$OUTPUT_FILE"

echo "$D" | awk -v attrs="$ATTRS" '
BEGIN { RS="M"; ORS="" }
NR > 1 {
    gsub(/^ +| +$/, "", $0);
    if ($0 != "") {
        print "<path " attrs " d=\"M" $0 "\"/>\n"
    }
}
' >> "$OUTPUT_FILE"

echo "✅ Fichier généré : $OUTPUT_FILE"