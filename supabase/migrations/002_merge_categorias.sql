-- Fusionar y renombrar categorías de ingredientes
-- Verduras → Frutas y Verduras
UPDATE ingredientes SET categoria = 'Frutas y Verduras' WHERE categoria = 'Verduras';
-- Legumbres + Cereales → Legumbres y cereales
UPDATE ingredientes SET categoria = 'Legumbres y cereales' WHERE categoria IN ('Legumbres', 'Cereales');
-- Huevos → Despensa
UPDATE ingredientes SET categoria = 'Despensa' WHERE categoria = 'Huevos';
