INSERT INTO region (ID, NAME, country_id_fk) VALUES (7,'BOURGOGNE', 1);
INSERT INTO region (ID, NAME, country_id_fk) VALUES (8,'VAL DE LOIRE', 1);
INSERT INTO appellation (ID, NAME, region_id_fk) VALUES (3,'BEAUJOLAIS', 7);
INSERT INTO detail(ID, COUNTRY_ID_FK, REGION_ID_FK, APPELLATION_ID_FK, TYPE, MAP_READY, DESCRIPTION) VALUES (10, 1, 7, 3, 2, true, 'Le vignoble du Beaujolais s’étend sur des paysages vallonnés au cœur d’une région viticole reconnue.
Administrativement rattaché à la région Bourgogne, il produit des vins accessibles et fruités, appréciés pour leur convivialité et leur fraîcheur.
Ce terroir incarne une tradition viticole vivante, marquée par la diversité de ses villages et de ses sols.');
INSERT INTO detail(ID, COUNTRY_ID_FK, REGION_ID_FK, APPELLATION_ID_FK, TYPE, MAP_READY, DESCRIPTION) VALUES (11, 1, 8, NULL, 1, true, 'Le vignoble du Val de Loire, installé le long du fleuve, se distingue par la variété de ses paysages et de ses sols.
On y trouve des vins frais et accessibles, qu’ils soient blancs, rouges ou rosés, reflet d’une région riche et diversifiée.');