ALTER TABLE detail add DESCRIPTION varchar(1000);
UPDATE detail set description = 'La France est l’un des berceaux historiques de la viticulture mondiale. Avec une diversité de terroirs unique, elle produit des vins de renommée internationale, allant des grands crus prestigieux aux appellations locales pleines de caractère.
' where id = 1;
UPDATE detail set description = 'Le Bordelais est l’une des régions viticoles les plus célèbres au monde. Situé autour de la ville de Bordeaux, il est réputé pour ses vins rouges d’assemblage à base de Merlot et de Cabernet Sauvignon, mais aussi pour ses blancs secs et moelleux. Ses châteaux prestigieux et ses terroirs variés en font un pilier de la viticulture française.
' where id = 2;
UPDATE detail set description = 'Situé dans le Bordelais, le Médoc est réputé pour ses vins rouges puissants et élégants, majoritairement issus du cépage Cabernet Sauvignon. Il abrite plusieurs prestigieux châteaux classés, dont certains Grands Crus, qui font la fierté de la viticulture bordelaise.
' where id = 3;
UPDATE detail set description = 'Située au nord-est de la France, la Champagne est célèbre pour son vin effervescent élaboré selon une méthode traditionnelle. C’est la seule région autorisée à produire le champagne, symbole de fête et de raffinement dans le monde entier.
' where id = 4;