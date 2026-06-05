-- Fix typo for Tiến Dinh Sport
UPDATE badminton_shops
SET 
    brand = 'Tiến Dinh Sport',
    name = REPLACE(name, 'Tiến Định', 'Tiến Dinh Sport')
WHERE brand = 'Tiến Định';
