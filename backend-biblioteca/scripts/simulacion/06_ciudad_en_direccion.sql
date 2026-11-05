-- Agrega la ciudad al final de la dirección de cada sede (la tabla no tiene columna de ciudad y el nombre
-- solo la incluye en algunas). Es idempotente: no repite la ciudad si la dirección ya la contiene.
WITH ciudad(id_biblioteca, nombre) AS (
    SELECT id, 'Medellín' FROM generate_series(11, 15) id
    UNION ALL SELECT 16, 'Caldas'
    UNION ALL SELECT 17, 'Envigado'
    UNION ALL SELECT 18, 'Envigado'
    UNION ALL SELECT 19, 'Itagüí'
    UNION ALL SELECT 20, 'Bello'
    UNION ALL SELECT id, 'Medellín' FROM generate_series(76, 97) id
    UNION ALL SELECT 98, 'La Ceja'
    UNION ALL SELECT id, 'Bogotá' FROM generate_series(99, 104) id
    UNION ALL SELECT id, 'Cali' FROM generate_series(105, 114) id
    UNION ALL SELECT id, 'Barranquilla' FROM generate_series(115, 116) id
    UNION ALL SELECT 117, 'Cartagena'
    UNION ALL SELECT 118, 'Santa Marta'
    UNION ALL SELECT 119, 'Valledupar'
    UNION ALL SELECT id, 'Montería' FROM generate_series(120, 121) id
    UNION ALL SELECT 122, 'Bucaramanga'
    UNION ALL SELECT 123, 'Cúcuta'
    UNION ALL SELECT 124, 'Pereira'
    UNION ALL SELECT 125, 'Manizales'
    UNION ALL SELECT 126, 'Ibagué'
    UNION ALL SELECT 127, 'Pasto'
    UNION ALL SELECT 128, 'Popayán'
    UNION ALL SELECT 129, 'Villavicencio'
    UNION ALL SELECT 130, 'Tunja'
)
UPDATE public.bibliotecas b
SET direccion_biblioteca = b.direccion_biblioteca || ', ' || c.nombre
FROM ciudad c
WHERE c.id_biblioteca = b.id_biblioteca
  AND b.direccion_biblioteca IS NOT NULL
  AND b.direccion_biblioteca NOT ILIKE '%' || c.nombre || '%';

SELECT count(*) FILTER (WHERE direccion_biblioteca ~ ', [A-Za-zÁÉÍÓÚáéíóúñ ]+$') AS con_ciudad, count(*) AS total FROM public.bibliotecas;
