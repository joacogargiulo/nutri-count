-- ==========================================================
-- SCRIPT DE CARGA DE ALIMENTOS BASICOS COMUNES - NUTRI COUNT
-- MATERIA: Taller Integrador III (Grupo de Gonella)
-- COMPATIBLE CON: Supabase / PostgreSQL
-- ==========================================================

INSERT INTO alimentos (
  nombre_alimento,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  medida_cantidad,
  medida_unidad,
  codigo_barras,
  origen
)
VALUES

-- LACTEOS
('Leche entera', 60, 3.2, 4.5, 3.3, 100, 'ml', NULL, 'Local'),
('Leche descremada', 34, 3.4, 5.0, 0.1, 100, 'ml', NULL, 'Local'),
('Yogur natural entero', 61, 3.5, 4.7, 3.3, 100, 'g', NULL, 'Local'),
('Yogur natural descremado', 56, 5.7, 7.7, 0.2, 100, 'g', NULL, 'Local'),
('Yogur griego natural', 97, 9.0, 3.6, 5.0, 100, 'g', NULL, 'Local'),
('Queso crema', 342, 6.0, 4.0, 34.0, 100, 'g', NULL, 'Local'),
('Queso untable light', 180, 10.0, 6.0, 12.0, 100, 'g', NULL, 'Local'),
('Queso mozzarella', 280, 22.0, 2.2, 22.0, 100, 'g', NULL, 'Local'),
('Queso tybo / barra', 330, 24.0, 2.0, 26.0, 100, 'g', NULL, 'Local'),
('Queso port salut', 290, 22.0, 2.0, 23.0, 100, 'g', NULL, 'Local'),
('Ricota entera', 174, 11.0, 3.0, 13.0, 100, 'g', NULL, 'Local'),
('Manteca', 717, 0.9, 0.1, 81.0, 100, 'g', NULL, 'Local'),
('Crema de leche', 340, 2.0, 3.0, 36.0, 100, 'g', NULL, 'Local'),

-- HUEVOS
('Huevo entero', 143, 12.6, 0.7, 9.5, 100, 'g', NULL, 'Local'),
('Clara de huevo', 52, 10.9, 0.7, 0.2, 100, 'g', NULL, 'Local'),
('Yema de huevo', 322, 15.9, 3.6, 26.5, 100, 'g', NULL, 'Local'),

-- CARNE VACUNA
('Carne picada magra cruda 90/10', 176, 20.0, 0.0, 10.0, 100, 'g', NULL, 'Local'),
('Carne picada comun cruda 80/20', 254, 17.0, 0.0, 20.0, 100, 'g', NULL, 'Local'),
('Nalga cruda', 150, 21.0, 0.0, 6.0, 100, 'g', NULL, 'Local'),
('Bola de lomo cruda', 160, 21.0, 0.0, 7.0, 100, 'g', NULL, 'Local'),
('Cuadrada cruda', 165, 21.0, 0.0, 8.0, 100, 'g', NULL, 'Local'),
('Peceto crudo', 145, 22.0, 0.0, 5.0, 100, 'g', NULL, 'Local'),
('Lomo crudo', 180, 20.0, 0.0, 10.0, 100, 'g', NULL, 'Local'),
('Bife angosto crudo', 210, 19.0, 0.0, 14.0, 100, 'g', NULL, 'Local'),
('Vacio crudo', 240, 18.0, 0.0, 18.0, 100, 'g', NULL, 'Local'),
('Asado crudo', 290, 17.0, 0.0, 24.0, 100, 'g', NULL, 'Local'),
('Matambre crudo', 250, 18.0, 0.0, 19.0, 100, 'g', NULL, 'Local'),
('Higado vacuno crudo', 135, 20.0, 4.0, 4.0, 100, 'g', NULL, 'Local'),

-- POLLO Y AVES
('Pechuga de pollo sin piel cruda', 120, 23.0, 0.0, 2.6, 100, 'g', NULL, 'Local'),
('Pechuga de pollo sin piel cocida', 165, 31.0, 0.0, 3.6, 100, 'g', NULL, 'Local'),
('Muslo de pollo sin piel crudo', 125, 19.0, 0.0, 5.0, 100, 'g', NULL, 'Local'),
('Pata-muslo con piel crudo', 215, 17.0, 0.0, 16.0, 100, 'g', NULL, 'Local'),
('Ala de pollo con piel cruda', 220, 18.0, 0.0, 16.0, 100, 'g', NULL, 'Local'),
('Pollo entero con piel crudo', 190, 18.0, 0.0, 13.0, 100, 'g', NULL, 'Local'),
('Pavo pechuga cruda', 110, 24.0, 0.0, 1.5, 100, 'g', NULL, 'Local'),

-- CERDO
('Bondiola de cerdo cruda', 260, 17.0, 0.0, 21.0, 100, 'g', NULL, 'Local'),
('Carre de cerdo crudo', 165, 21.0, 0.0, 8.0, 100, 'g', NULL, 'Local'),
('Solomillo de cerdo crudo', 120, 22.0, 0.0, 3.0, 100, 'g', NULL, 'Local'),
('Costilla de cerdo cruda', 290, 17.0, 0.0, 24.0, 100, 'g', NULL, 'Local'),
('Jamon cocido', 145, 20.0, 2.0, 6.0, 100, 'g', NULL, 'Local'),
('Panceta', 540, 37.0, 1.0, 42.0, 100, 'g', NULL, 'Local'),

-- PESCADOS Y MARISCOS
('Merluza cruda', 80, 17.0, 0.0, 1.2, 100, 'g', NULL, 'Local'),
('Atun al natural escurrido', 116, 26.0, 0.0, 1.0, 100, 'g', NULL, 'Local'),
('Atun en aceite escurrido', 198, 29.0, 0.0, 8.0, 100, 'g', NULL, 'Local'),
('Salmon crudo', 208, 20.0, 0.0, 13.0, 100, 'g', NULL, 'Local'),
('Sardina', 208, 25.0, 0.0, 11.0, 100, 'g', NULL, 'Local'),
('Caballa', 205, 19.0, 0.0, 14.0, 100, 'g', NULL, 'Local'),
('Lenguado crudo', 86, 18.0, 0.0, 1.2, 100, 'g', NULL, 'Local'),
('Corvina cruda', 100, 20.0, 0.0, 2.0, 100, 'g', NULL, 'Local'),
('Camarones cocidos', 99, 24.0, 0.2, 0.3, 100, 'g', NULL, 'Local'),
('Calamar crudo', 92, 15.6, 3.1, 1.4, 100, 'g', NULL, 'Local'),

-- PANES Y HARINAS
('Pan blanco', 265, 8.5, 49.0, 3.2, 100, 'g', NULL, 'Local'),
('Pan integral', 247, 13.0, 41.0, 4.2, 100, 'g', NULL, 'Local'),
('Pan frances', 270, 8.8, 56.0, 1.5, 100, 'g', NULL, 'Local'),
('Pan lactal blanco', 260, 8.0, 49.0, 3.5, 100, 'g', NULL, 'Local'),
('Pan lactal integral', 250, 10.0, 43.0, 4.0, 100, 'g', NULL, 'Local'),
('Tortilla de trigo', 310, 8.0, 52.0, 8.0, 100, 'g', NULL, 'Local'),
('Harina de trigo 000/0000', 364, 10.0, 76.0, 1.0, 100, 'g', NULL, 'Local'),
('Harina integral', 340, 13.0, 72.0, 2.5, 100, 'g', NULL, 'Local'),
('Harina de avena', 389, 16.9, 66.3, 6.9, 100, 'g', NULL, 'Local'),
('Pan rallado', 395, 13.0, 72.0, 5.0, 100, 'g', NULL, 'Local'),

-- CEREALES, ARROZ Y PASTAS
('Arroz blanco crudo', 365, 7.1, 80.0, 0.7, 100, 'g', NULL, 'Local'),
('Arroz blanco cocido', 130, 2.7, 28.2, 0.3, 100, 'g', NULL, 'Local'),
('Arroz integral crudo', 370, 7.5, 77.0, 2.7, 100, 'g', NULL, 'Local'),
('Arroz integral cocido', 112, 2.3, 23.5, 0.8, 100, 'g', NULL, 'Local'),
('Fideos secos crudos', 371, 13.0, 75.0, 1.5, 100, 'g', NULL, 'Local'),
('Fideos cocidos', 158, 5.8, 30.9, 0.9, 100, 'g', NULL, 'Local'),
('Avena tradicional seca', 389, 16.9, 66.3, 6.9, 100, 'g', NULL, 'Local'),
('Quinoa cruda', 368, 14.1, 64.2, 6.1, 100, 'g', NULL, 'Local'),
('Quinoa cocida', 120, 4.4, 21.3, 1.9, 100, 'g', NULL, 'Local'),
('Polenta / harina de maiz seca', 365, 7.0, 79.0, 1.5, 100, 'g', NULL, 'Local'),
('Polenta cocida en agua', 70, 1.6, 15.0, 0.4, 100, 'g', NULL, 'Local'),
('Copos de maiz sin azucar', 357, 7.5, 84.0, 0.4, 100, 'g', NULL, 'Local'),
('Granola comun', 450, 10.0, 64.0, 17.0, 100, 'g', NULL, 'Local'),

-- LEGUMBRES
('Lentejas secas', 352, 24.6, 63.0, 1.1, 100, 'g', NULL, 'Local'),
('Lentejas cocidas', 116, 9.0, 20.0, 0.4, 100, 'g', NULL, 'Local'),
('Garbanzos secos', 364, 19.0, 61.0, 6.0, 100, 'g', NULL, 'Local'),
('Garbanzos cocidos', 164, 8.9, 27.4, 2.6, 100, 'g', NULL, 'Local'),
('Porotos negros cocidos', 132, 8.9, 23.7, 0.5, 100, 'g', NULL, 'Local'),
('Porotos whites cocidos', 139, 9.7, 25.1, 0.4, 100, 'g', NULL, 'Local'),
('Arvejas cocidas', 84, 5.4, 15.6, 0.2, 100, 'g', NULL, 'Local'),
('Soja cocida', 172, 18.2, 8.4, 9.0, 100, 'g', NULL, 'Local'),
('Hummus', 166, 7.9, 14.3, 9.6, 100, 'g', NULL, 'Local'),

-- FRUTAS
('Banana', 89, 1.1, 22.8, 0.3, 100, 'g', NULL, 'Local'),
('Manzana', 52, 0.3, 13.8, 0.2, 100, 'g', NULL, 'Local'),
('Naranja', 47, 0.9, 11.8, 0.1, 100, 'g', NULL, 'Local'),
('Mandarina', 53, 0.8, 13.3, 0.3, 100, 'g', NULL, 'Local'),
('Pera', 57, 0.4, 15.2, 0.1, 100, 'g', NULL, 'Local'),
('Durazno', 39, 0.9, 9.5, 0.3, 100, 'g', NULL, 'Local'),
('Ciruela', 46, 0.7, 11.4, 0.3, 100, 'g', NULL, 'Local'),
('Uva', 69, 0.7, 18.1, 0.2, 100, 'g', NULL, 'Local'),
('Frutilla', 32, 0.7, 7.7, 0.3, 100, 'g', NULL, 'Local'),
('Arandanos', 57, 0.7, 14.5, 0.3, 100, 'g', NULL, 'Local'),
('Mango', 60, 0.8, 15.0, 0.4, 100, 'g', NULL, 'Local'),
('Anana', 50, 0.5, 13.1, 0.1, 100, 'g', NULL, 'Local'),
('Kiwi', 61, 1.1, 14.7, 0.5, 100, 'g', NULL, 'Local'),
('Sandia', 30, 0.6, 7.6, 0.2, 100, 'g', NULL, 'Local'),
('Melon', 34, 0.8, 8.2, 0.2, 100, 'g', NULL, 'Local'),
('Palta', 160, 2.0, 8.5, 14.7, 100, 'g', NULL, 'Local'),
('Limon', 29, 1.1, 9.3, 0.3, 100, 'g', NULL, 'Local'),

-- VERDURAS Y HORTALIZAS
('Lechuga cruda', 15, 1.4, 2.9, 0.2, 100, 'g', NULL, 'Local'),
('Tomate crudo', 18, 0.9, 3.9, 0.2, 100, 'g', NULL, 'Local'),
('Cebolla cruda', 40, 1.1, 9.3, 0.1, 100, 'g', NULL, 'Local'),
('Zanahoria cruda', 41, 0.9, 9.6, 0.2, 100, 'g', NULL, 'Local'),
('Morron rojo crudo', 31, 1.0, 6.0, 0.3, 100, 'g', NULL, 'Local'),
('Morron verde crudo', 20, 0.9, 4.6, 0.2, 100, 'g', NULL, 'Local'),
('Espinaca cruda', 23, 2.9, 3.6, 0.4, 100, 'g', NULL, 'Local'),
('Acelga cruda', 19, 1.8, 3.7, 0.2, 100, 'g', NULL, 'Local'),
('Brocoli crudo', 34, 2.8, 6.6, 0.4, 100, 'g', NULL, 'Local'),
('Coliflor cruda', 25, 1.9, 5.0, 0.3, 100, 'g', NULL, 'Local'),
('Zapallito crudo', 17, 1.2, 3.1, 0.3, 100, 'g', NULL, 'Local'),
('Zucchini crudo', 17, 1.2, 3.1, 0.3, 100, 'g', NULL, 'Local'),
('Berenjena cruda', 25, 1.0, 5.9, 0.2, 100, 'g', NULL, 'Local'),
('Pepino crudo', 15, 0.7, 3.6, 0.1, 100, 'g', NULL, 'Local'),
('Repollo crudo', 25, 1.3, 5.8, 0.1, 100, 'g', NULL, 'Local'),
('Champinones crudos', 22, 3.1, 3.3, 0.3, 100, 'g', NULL, 'Local'),
('Ajo crudo', 149, 6.4, 33.1, 0.5, 100, 'g', NULL, 'Local'),

-- TUBERCULOS Y SIMILARES
('Papa cruda', 77, 2.0, 17.5, 0.1, 100, 'g', NULL, 'Local'),
('Papa hervida', 87, 1.9, 20.1, 0.1, 100, 'g', NULL, 'Local'),
('Batata cruda', 86, 1.6, 20.1, 0.1, 100, 'g', NULL, 'Local'),
('Batata hervida', 76, 1.4, 17.7, 0.1, 100, 'g', NULL, 'Local'),
('Mandioca cruda', 160, 1.4, 38.1, 0.3, 100, 'g', NULL, 'Local'),
('Choclo cocido', 96, 3.4, 21.0, 1.5, 100, 'g', NULL, 'Local'),
('Calabaza cocida', 20, 0.7, 4.9, 0.1, 100, 'g', NULL, 'Local'),

-- FRUTOS SECOS, SEMILLAS Y GRASAS
('Aceite de oliva', 884, 0.0, 0.0, 100.0, 100, 'g', NULL, 'Local'),
('Aceite de girasol', 884, 0.0, 0.0, 100.0, 100, 'g', NULL, 'Local'),
('Mayonesa', 680, 1.0, 1.0, 75.0, 100, 'g', NULL, 'Local'),
('Mani', 567, 25.8, 16.1, 49.2, 100, 'g', NULL, 'Local'),
('Mantequilla de mani', 588, 25.0, 20.0, 50.0, 100, 'g', NULL, 'Local'),
('Almendras', 579, 21.2, 21.6, 49.9, 100, 'g', NULL, 'Local'),
('Nueces', 654, 15.2, 13.7, 65.2, 100, 'g', NULL, 'Local'),
('Castanas de caju', 553, 18.2, 30.2, 43.9, 100, 'g', NULL, 'Local'),
('Semillas de chia', 486, 16.5, 42.1, 30.7, 100, 'g', NULL, 'Local'),
('Semillas de lino', 534, 18.3, 28.9, 42.2, 100, 'g', NULL, 'Local'),
('Semillas de girasol', 584, 20.8, 20.0, 51.5, 100, 'g', NULL, 'Local'),

-- AZUCARES, DULCES Y BASICOS
('Azucar', 387, 0.0, 100.0, 0.0, 100, 'g', NULL, 'Local'),
('Miel', 304, 0.3, 82.4, 0.0, 100, 'g', NULL, 'Local'),
('Dulce de leche', 315, 7.0, 55.0, 7.0, 100, 'g', NULL, 'Local'),
('Mermelada', 250, 0.3, 65.0, 0.1, 100, 'g', NULL, 'Local'),
('Cacao amargo', 228, 19.6, 57.9, 13.7, 100, 'g', NULL, 'Local'),
('Chocolate comun', 535, 7.7, 59.0, 30.0, 100, 'g', NULL, 'Local'),
('Sal', 0, 0.0, 0.0, 0.0, 100, 'g', NULL, 'Local'),
('Vinagre', 18, 0.0, 0.0, 0.0, 100, 'g', NULL, 'Local'),
('Cafe preparado sin azucar', 1, 0.1, 0.0, 0.0, 100, 'ml', NULL, 'Local'),
('Yerba mate seca', 280, 12.0, 50.0, 5.0, 100, 'g', NULL, 'Local');
