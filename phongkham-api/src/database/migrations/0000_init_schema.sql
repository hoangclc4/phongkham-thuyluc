-- Create daily_sequences table
CREATE TABLE IF NOT EXISTS daily_sequences (
  entity_type VARCHAR(10) NOT NULL,
  seq_date    DATE NOT NULL,
  last_val    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (entity_type, seq_date)
);

-- Create generate_display_number function
CREATE OR REPLACE FUNCTION generate_display_number(p_type VARCHAR, p_date DATE)
RETURNS VARCHAR AS $$
DECLARE
  v_next   INTEGER;
  v_padded VARCHAR;
BEGIN
  INSERT INTO daily_sequences (entity_type, seq_date, last_val)
  VALUES (p_type, p_date, 1)
  ON CONFLICT (entity_type, seq_date)
  DO UPDATE SET last_val = daily_sequences.last_val + 1
  RETURNING last_val INTO v_next;

  v_padded := LPAD(v_next::TEXT, GREATEST(3, LENGTH(v_next::TEXT)), '0');

  RETURN p_type || '-' || TO_CHAR(p_date, 'YYYYMMDD') || '-' || v_padded;
END;
$$ LANGUAGE plpgsql;
