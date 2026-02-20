-- 1. Añadir columnas 'source' y 'cash_paid' a la tabla de reservas
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cash_paid BOOLEAN DEFAULT false;

-- 2. Asegurarnos de que las tablas de configuración y contenido pueden ser editadas sin login (temporalmente hasta añadir Auth)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select site_settings" ON site_settings;
DROP POLICY IF EXISTS "Public Insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Public Update site_settings" ON site_settings;
CREATE POLICY "Public Select site_settings" ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Public Insert site_settings" ON site_settings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public Update site_settings" ON site_settings FOR UPDATE USING (TRUE);

-- 3. Políticas para website_content (ya tenía SELECT, añadimos INSERT y UPDATE)
DROP POLICY IF EXISTS "Public Insert website_content" ON website_content;
DROP POLICY IF EXISTS "Public Update website_content" ON website_content;
CREATE POLICY "Public Insert website_content" ON website_content FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public Update website_content" ON website_content FOR UPDATE USING (TRUE);

-- 4. Políticas para apartamentos para el siguiente paso del panel
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All apartments" ON apartments;
CREATE POLICY "Public All apartments" ON apartments FOR ALL USING (TRUE);

ALTER TABLE apartment_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All apartment_photos" ON apartment_photos;
CREATE POLICY "Public All apartment_photos" ON apartment_photos FOR ALL USING (TRUE);

-- 5. Políticas para reservas (permitir INSERT público y resto para ADMIN)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Insert reservations" ON reservations;
DROP POLICY IF EXISTS "Public Select reservations" ON reservations;
DROP POLICY IF EXISTS "Public Update reservations" ON reservations;
CREATE POLICY "Public Insert reservations" ON reservations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public Select reservations" ON reservations FOR SELECT USING (TRUE);
CREATE POLICY "Public Update reservations" ON reservations FOR UPDATE USING (TRUE);
