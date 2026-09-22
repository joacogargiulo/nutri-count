-- ==========================================================
-- SCRIPT DE CARGA DE ALIMENTOS BASICOS COMUNES - NUTRI COUNT
-- MATERIA: Taller Integrador III (Grupo de Gonella)
-- COMPATIBLE CON: Supabase / PostgreSQL
-- ==========================================================

INSERT INTO alimentos (
  id_alimento,
  nombre_alimento,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  medida_cantidad,
  medida_unidad
)
VALUES

-- LACTEOS
('lac_leche_entera', 'Leche entera', 60, 3.2, 4.5, 3.3, 100, 'ml'),
('lac_leche_descremada', 'Leche descremada', 34, 3.4, 5.0, 0.1, 100, 'ml'),
('lac_yogur_natural_entero', 'Yogur natural entero', 61, 3.5, 4.7, 3.3, 100, 'g'),
('lac_yogur_natural_descremado', 'Yogur natural descremado', 56, 5.7, 7.7, 0.2, 100, 'g'),
('lac_yogur_griego_natural', 'Yogur griego natural', 97, 9.0, 3.6, 5.0, 100, 'g'),
('lac_queso_crema', 'Queso crema', 342, 6.0, 4.0, 34.0, 100, 'g'),
('lac_queso_untable_light', 'Queso untable light', 180, 10.0, 6.0, 12.0, 100, 'g'),
('lac_queso_mozzarella', 'Queso mozzarella', 280, 22.0, 2.2, 22.0, 100, 'g'),
('lac_queso_tybo_barra', 'Queso tybo / barra', 330, 24.0, 2.0, 26.0, 100, 'g'),
('lac_queso_port_salut', 'Queso port salut', 290, 22.0, 2.0, 23.0, 100, 'g'),
('lac_ricota_entera', 'Ricota entera', 174, 11.0, 3.0, 13.0, 100, 'g'),
('lac_manteca', 'Manteca', 717, 0.9, 0.1, 81.0, 100, 'g'),
('lac_crema_de_leche', 'Crema de leche', 340, 2.0, 3.0, 36.0, 100, 'g'),

-- HUEVOS
('hue_huevo_entero', 'Huevo entero', 143, 12.6, 0.7, 9.5, 100, 'g'),
('hue_clara_huevo', 'Clara de huevo', 52, 10.9, 0.7, 0.2, 100, 'g'),
('hue_yema_huevo', 'Yema de huevo', 322, 15.9, 3.6, 26.5, 100, 'g'),

-- CARNE VACUNA
('vac_carne_picada_magra_cruda', 'Carne picada magra cruda 90/10', 176, 20.0, 0.0, 10.0, 100, 'g'),
('vac_carne_picada_comun_cruda', 'Carne picada comun cruda 80/20', 254, 17.0, 0.0, 20.0, 100, 'g'),
('vac_nalga_cruda', 'Nalga cruda', 150, 21.0, 0.0, 6.0, 100, 'g'),
('vac_bola_lomo_cruda', 'Bola de lomo cruda', 160, 21.0, 0.0, 7.0, 100, 'g'),
('vac_cuadrada_cruda', 'Cuadrada cruda', 165, 21.0, 0.0, 8.0, 100, 'g'),
('vac_peceto_crudo', 'Peceto crudo', 145, 22.0, 0.0, 5.0, 100, 'g'),
('vac_lomo_crudo', 'Lomo crudo', 180, 20.0, 0.0, 10.0, 100, 'g'),
('vac_bife_angosto_crudo', 'Bife angosto crudo', 210, 19.0, 0.0, 14.0, 100, 'g'),
('vac_vacio_crudo', 'Vacio crudo', 240, 18.0, 0.0, 18.0, 100, 'g'),
('vac_asado_crudo', 'Asado crudo', 290, 17.0, 0.0, 24.0, 100, 'g'),
('vac_matambre_crudo', 'Matambre crudo', 250, 18.0, 0.0, 19.0, 100, 'g'),
('vac_higado_vacuno_crudo', 'Higado vacuno crudo', 135, 20.0, 4.0, 4.0, 100, 'g'),

-- POLLO Y AVES
('ave_pechuga_pollo_cruda', 'Pechuga de pollo sin piel cruda', 120, 23.0, 0.0, 2.6, 100, 'g'),
('ave_pechuga_pollo_cocida', 'Pechuga de pollo sin piel cocida', 165, 31.0, 0.0, 3.6, 100, 'g'),
('ave_muslo_pollo_sin_piel_crudo', 'Muslo de pollo sin piel crudo', 125, 19.0, 0.0, 5.0, 100, 'g'),
('ave_pata_muslo_con_piel_crudo', 'Pata-muslo con piel crudo', 215, 17.0, 0.0, 16.0, 100, 'g'),
('ave_ala_pollo_con_piel_cruda', 'Ala de pollo con piel cruda', 220, 18.0, 0.0, 16.0, 100, 'g'),
('ave_pollo_entero_con_piel_crudo', 'Pollo entero con piel crudo', 190, 18.0, 0.0, 13.0, 100, 'g'),
('ave_pavo_pechuga_cruda', 'Pavo pechuga cruda', 110, 24.0, 0.0, 1.5, 100, 'g'),

-- CERDO
('cer_bondiola_cruda', 'Bondiola de cerdo cruda', 260, 17.0, 0.0, 21.0, 100, 'g'),
('cer_carre_crudo', 'Carre de cerdo crudo', 165, 21.0, 0.0, 8.0, 100, 'g'),
('cer_solomillo_crudo', 'Solomillo de cerdo crudo', 120, 22.0, 0.0, 3.0, 100, 'g'),
('cer_costilla_cruda', 'Costilla de cerdo cruda', 290, 17.0, 0.0, 24.0, 100, 'g'),
('cer_jamon_cocido', 'Jamon cocido', 145, 20.0, 2.0, 6.0, 100, 'g'),
('cer_panceta', 'Panceta', 540, 37.0, 1.0, 42.0, 100, 'g'),

-- PESCADOS Y MARISCOS
('pes_merluza_cruda', 'Merluza cruda', 80, 17.0, 0.0, 1.2, 100, 'g'),
('pes_atun_al_natural_escurrido', 'Atun al natural escurrido', 116, 26.0, 0.0, 1.0, 100, 'g'),
('pes_atun_en_aceite_escurrido', 'Atun en aceite escurrido', 198, 29.0, 0.0, 8.0, 100, 'g'),
('pes_salmon_crudo', 'Salmon crudo', 208, 20.0, 0.0, 13.0, 100, 'g'),
('pes_sardina', 'Sardina', 208, 25.0, 0.0, 11.0, 100, 'g'),
('pes_caballa', 'Caballa', 205, 19.0, 0.0, 14.0, 100, 'g'),
('pes_lenguado_crudo', 'Lenguado crudo', 86, 18.0, 0.0, 1.2, 100, 'g'),
('pes_corvina_cruda', 'Corvina cruda', 100, 20.0, 0.0, 2.0, 100, 'g'),
('pes_camarones_cocidos', 'Camarones cocidos', 99, 24.0, 0.2, 0.3, 100, 'g'),
('pes_calamar_crudo', 'Calamar crudo', 92, 15.6, 3.1, 1.4, 100, 'g'),

-- PANES Y HARINAS
('pan_pan_blanco', 'Pan blanco', 265, 8.5, 49.0, 3.2, 100, 'g'),
('pan_pan_integral', 'Pan integral', 247, 13.0, 41.0, 4.2, 100, 'g'),
('pan_pan_frances', 'Pan frances', 270, 8.8, 56.0, 1.5, 100, 'g'),
('pan_pan_lactal_blanco', 'Pan lactal blanco', 260, 8.0, 49.0, 3.5, 100, 'g'),
('pan_pan_lactal_integral', 'Pan lactal integral', 250, 10.0, 43.0, 4.0, 100, 'g'),
('pan_tortilla_trigo', 'Tortilla de trigo', 310, 8.0, 52.0, 8.0, 100, 'g'),
('pan_harina_trigo', 'Harina de trigo 000/0000', 364, 10.0, 76.0, 1.0, 100, 'g'),
('pan_harina_integral', 'Harina integral', 340, 13.0, 72.0, 2.5, 100, 'g'),
('pan_harina_avena', 'Harina de avena', 389, 16.9, 66.3, 6.9, 100, 'g'),
('pan_pan_rallado', 'Pan rallado', 395, 13.0, 72.0, 5.0, 100, 'g'),

-- CEREALES, ARROZ Y PASTAS
('cer_arroz_blanco_crudo', 'Arroz blanco crudo', 365, 7.1, 80.0, 0.7, 100, 'g'),
('cer_arroz_blanco_cocido', 'Arroz blanco cocido', 130, 2.7, 28.2, 0.3, 100, 'g'),
('cer_arroz_integral_crudo', 'Arroz integral crudo', 370, 7.5, 77.0, 2.7, 100, 'g'),
('cer_arroz_integral_cocido', 'Arroz integral cocido', 112, 2.3, 23.5, 0.8, 100, 'g'),
('cer_fideos_secos_crudos', 'Fideos secos crudos', 371, 13.0, 75.0, 1.5, 100, 'g'),
('cer_fideos_cocidos', 'Fideos cocidos', 158, 5.8, 30.9, 0.9, 100, 'g'),
('cer_avena_tradicional_seca', 'Avena tradicional seca', 389, 16.9, 66.3, 6.9, 100, 'g'),
('cer_quinoa_cruda', 'Quinoa cruda', 368, 14.1, 64.2, 6.1, 100, 'g'),
('cer_quinoa_cocida', 'Quinoa cocida', 120, 4.4, 21.3, 1.9, 100, 'g'),
('cer_polenta_seca', 'Polenta / harina de maiz seca', 365, 7.0, 79.0, 1.5, 100, 'g'),
('cer_polenta_cocida_agua', 'Polenta cocida en agua', 70, 1.6, 15.0, 0.4, 100, 'g'),
('cer_copos_maiz_sin_azucar', 'Copos de maiz sin azucar', 357, 7.5, 84.0, 0.4, 100, 'g'),
('cer_granola_comun', 'Granola comun', 450, 10.0, 64.0, 17.0, 100, 'g'),

-- LEGUMBRES
('leg_lentejas_secas', 'Lentejas secas', 352, 24.6, 63.0, 1.1, 100, 'g'),
('leg_lentejas_cocidas', 'Lentejas cocidas', 116, 9.0, 20.0, 0.4, 100, 'g'),
('leg_garbanzos_secos', 'Garbanzos secos', 364, 19.0, 61.0, 6.0, 100, 'g'),
('leg_garbanzos_cocidos', 'Garbanzos cocidos', 164, 8.9, 27.4, 2.6, 100, 'g'),
('leg_porotos_negros_cocidos', 'Porotos negros cocidos', 132, 8.9, 23.7, 0.5, 100, 'g'),
('leg_porotos_blancos_cocidos', 'Porotos whites cocidos', 139, 9.7, 25.1, 0.4, 100, 'g'),
('leg_arvejas_cocidas', 'Arvejas cocidas', 84, 5.4, 15.6, 0.2, 100, 'g'),
('leg_soja_cocida', 'Soja cocida', 172, 18.2, 8.4, 9.0, 100, 'g'),
('leg_hummus', 'Hummus', 166, 7.9, 14.3, 9.6, 100, 'g'),

-- FRUTAS
('fru_banana', 'Banana', 89, 1.1, 22.8, 0.3, 100, 'g'),
('fru_manzana', 'Manzana', 52, 0.3, 13.8, 0.2, 100, 'g'),
('fru_naranja', 'Naranja', 47, 0.9, 11.8, 0.1, 100, 'g'),
('fru_mandarina', 'Mandarina', 53, 0.8, 13.3, 0.3, 100, 'g'),
('fru_pera', 'Pera', 57, 0.4, 15.2, 0.1, 100, 'g'),
('fru_durazno', 'Durazno', 39, 0.9, 9.5, 0.3, 100, 'g'),
('fru_ciruela', 'Ciruela', 46, 0.7, 11.4, 0.3, 100, 'g'),
('fru_uva', 'Uva', 69, 0.7, 18.1, 0.2, 100, 'g'),
('fru_frutilla', 'Frutilla', 32, 0.7, 7.7, 0.3, 100, 'g'),
('fru_arandanos', 'Arandanos', 57, 0.7, 14.5, 0.3, 100, 'g'),
('fru_mango', 'Mango', 60, 0.8, 15.0, 0.4, 100, 'g'),
('fru_anana', 'Anana', 50, 0.5, 13.1, 0.1, 100, 'g'),
('fru_kiwi', 'Kiwi', 61, 1.1, 14.7, 0.5, 100, 'g'),
('fru_sandia', 'Sandia', 30, 0.6, 7.6, 0.2, 100, 'g'),
('fru_melon', 'Melon', 34, 0.8, 8.2, 0.2, 100, 'g'),
('fru_palta', 'Palta', 160, 2.0, 8.5, 14.7, 100, 'g'),
('fru_limon', 'Limon', 29, 1.1, 9.3, 0.3, 100, 'g'),

-- VERDURAS Y HORTALIZAS
('ver_lechuga_cruda', 'Lechuga cruda', 15, 1.4, 2.9, 0.2, 100, 'g'),
('ver_tomate_crudo', 'Tomate crudo', 18, 0.9, 3.9, 0.2, 100, 'g'),
('ver_cebolla_cruda', 'Cebolla cruda', 40, 1.1, 9.3, 0.1, 100, 'g'),
('ver_zanahoria_cruda', 'Zanahoria cruda', 41, 0.9, 9.6, 0.2, 100, 'g'),
('ver_morron_rojo_crudo', 'Morron rojo crudo', 31, 1.0, 6.0, 0.3, 100, 'g'),
('ver_morron_verde_crudo', 'Morron verde crudo', 20, 0.9, 4.6, 0.2, 100, 'g'),
('ver_espinaca_cruda', 'Espinaca cruda', 23, 2.9, 3.6, 0.4, 100, 'g'),
('ver_acelga_cruda', 'Acelga cruda', 19, 1.8, 3.7, 0.2, 100, 'g'),
('ver_brocoli_crudo', 'Brocoli crudo', 34, 2.8, 6.6, 0.4, 100, 'g'),
('ver_coliflor_cruda', 'Coliflor cruda', 25, 1.9, 5.0, 0.3, 100, 'g'),
('ver_zapallito_crudo', 'Zapallito crudo', 17, 1.2, 3.1, 0.3, 100, 'g'),
('ver_zucchini_crudo', 'Zucchini crudo', 17, 1.2, 3.1, 0.3, 100, 'g'),
('ver_berenjena_cruda', 'Berenjena cruda', 25, 1.0, 5.9, 0.2, 100, 'g'),
('ver_pepino_crudo', 'Pepino crudo', 15, 0.7, 3.6, 0.1, 100, 'g'),
('ver_repollo_crudo', 'Repollo crudo', 25, 1.3, 5.8, 0.1, 100, 'g'),
('ver_champinones_crudos', 'Champinones crudos', 22, 3.1, 3.3, 0.3, 100, 'g'),
('ver_ajo_crudo', 'Ajo crudo', 149, 6.4, 33.1, 0.5, 100, 'g'),

-- TUBERCULOS Y SIMILARES
('tub_papa_cruda', 'Papa cruda', 77, 2.0, 17.5, 0.1, 100, 'g'),
('tub_papa_hervida', 'Papa hervida', 87, 1.9, 20.1, 0.1, 100, 'g'),
('tub_batata_cruda', 'Batata cruda', 86, 1.6, 20.1, 0.1, 100, 'g'),
('tub_batata_hervida', 'Batata hervida', 76, 1.4, 17.7, 0.1, 100, 'g'),
('tub_mandioca_cruda', 'Mandioca cruda', 160, 1.4, 38.1, 0.3, 100, 'g'),
('tub_choclo_cocido', 'Choclo cocido', 96, 3.4, 21.0, 1.5, 100, 'g'),
('tub_calabaza_cocida', 'Calabaza cocida', 20, 0.7, 4.9, 0.1, 100, 'g'),

-- FRUTOS SECOS, SEMILLAS Y GRASAS
('gra_aceite_oliva', 'Aceite de oliva', 884, 0.0, 0.0, 100.0, 100, 'g'),
('gra_aceite_girasol', 'Aceite de girasol', 884, 0.0, 0.0, 100.0, 100, 'g'),
('gra_mayonesa', 'Mayonesa', 680, 1.0, 1.0, 75.0, 100, 'g'),
('gra_mani', 'Mani', 567, 25.8, 16.1, 49.2, 100, 'g'),
('gra_mantequilla_mani', 'Mantequilla de mani', 588, 25.0, 20.0, 50.0, 100, 'g'),
('gra_almendras', 'Almendras', 579, 21.2, 21.6, 49.9, 100, 'g'),
('gra_nueces', 'Nueces', 654, 15.2, 13.7, 65.2, 100, 'g'),
('gra_castanas_caju', 'Castanas de caju', 553, 18.2, 30.2, 43.9, 100, 'g'),
('gra_semillas_chia', 'Semillas de chia', 486, 16.5, 42.1, 30.7, 100, 'g'),
('gra_semillas_lino', 'Semillas de lino', 534, 18.3, 28.9, 42.2, 100, 'g'),
('gra_semillas_girasol', 'Semillas de girasol', 584, 20.8, 20.0, 51.5, 100, 'g'),

-- AZUCARES, DULCES Y BASICOS
('bas_azucar', 'Azucar', 387, 0.0, 100.0, 0.0, 100, 'g'),
('bas_miel', 'Miel', 304, 0.3, 82.4, 0.0, 100, 'g'),
('bas_dulce_de_leche', 'Dulce de leche', 315, 7.0, 55.0, 7.0, 100, 'g'),
('bas_mermelada', 'Mermelada', 250, 0.3, 65.0, 0.1, 100, 'g'),
('bas_cacao_amargo', 'Cacao amargo', 228, 19.6, 57.9, 13.7, 100, 'g'),
('bas_chocolate_comun', 'Chocolate comun', 535, 7.7, 59.0, 30.0, 100, 'g'),
('bas_sal', 'Sal', 0, 0.0, 0.0, 0.0, 100, 'g'),
('bas_vinagre', 'Vinagre', 18, 0.0, 0.0, 0.0, 100, 'g'),
('bas_cafe_preparado_sin_azucar', 'Cafe preparado sin azucar', 1, 0.1, 0.0, 0.0, 100, 'ml'),
('bas_yerba_mate_seca', 'Yerba mate seca', 280, 12.0, 50.0, 5.0, 100, 'g')

ON CONFLICT (id_alimento) DO UPDATE SET
  nombre_alimento = EXCLUDED.nombre_alimento,
  calorias = EXCLUDED.calorias,
  proteinas = EXCLUDED.proteinas,
  carbohidratos = EXCLUDED.carbohidratos,
  grasas = EXCLUDED.grasas,
  medida_cantidad = EXCLUDED.medida_cantidad,
  medida_unidad = EXCLUDED.medida_unidad;
