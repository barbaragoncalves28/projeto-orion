CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE TABLE restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('customer', 'vendor', 'admin')),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  name text NOT NULL,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, restaurant_id)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  status order_status NOT NULL DEFAULT 'pending',
  total numeric(12, 2) NOT NULL CHECK (total >= 0),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, restaurant_id)
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (order_id, restaurant_id)
    REFERENCES orders(id, restaurant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (product_id, restaurant_id)
    REFERENCES products(id, restaurant_id)
);

CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (
    name IN (
      'order_confirmed',
      'order_preparing',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled'
    )
  ),
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  processed_at timestamptz,
  failed_at timestamptz,
  dead_letter_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, name)
);

CREATE TABLE order_daily_metrics (
  metric_day date NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  delivered_orders integer NOT NULL DEFAULT 0,
  delivered_revenue numeric(12, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (metric_day, restaurant_id)
);

CREATE INDEX order_items_order_id_idx ON order_items(order_id);
CREATE INDEX orders_user_id_created_at_idx ON orders(user_id, created_at DESC);
CREATE INDEX order_status_history_order_id_idx ON order_status_history(order_id);
CREATE INDEX order_events_pending_idx
  ON order_events(next_retry_at, created_at)
  WHERE processed_at IS NULL AND dead_letter_at IS NULL;
CREATE INDEX order_events_order_id_idx ON order_events(order_id);

CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled')) OR
    (OLD.status = 'confirmed' AND NEW.status IN ('preparing', 'cancelled')) OR
    (OLD.status = 'preparing' AND NEW.status = 'out_for_delivery') OR
    (OLD.status = 'out_for_delivery' AND NEW.status = 'delivered')
  ) THEN
    RAISE EXCEPTION 'Invalid order status transition: % -> %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_validate_status_transition
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION validate_order_status_transition();

CREATE OR REPLACE FUNCTION prevent_manual_order_total_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.total IS DISTINCT FROM OLD.total
     AND current_setting('app.recalculating_order_total', true) <> 'on' THEN
    RAISE EXCEPTION 'orders.total must be recalculated from order_items';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_prevent_manual_total_update
BEFORE UPDATE OF total ON orders
FOR EACH ROW
EXECUTE FUNCTION prevent_manual_order_total_update();

CREATE OR REPLACE FUNCTION recalculate_order_total(target_order_id uuid)
RETURNS void AS $$
DECLARE
  calculated_total numeric(12, 2);
BEGIN
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO calculated_total
  FROM order_items
  WHERE order_id = target_order_id;

  PERFORM set_config('app.recalculating_order_total', 'on', true);

  UPDATE orders
  SET total = calculated_total
  WHERE id = target_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_order_total_from_items()
RETURNS trigger AS $$
BEGIN
  PERFORM recalculate_order_total(COALESCE(NEW.order_id, OLD.order_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_recalculate_order_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_order_total_from_items();

CREATE OR REPLACE FUNCTION recalculate_new_order_total()
RETURNS trigger AS $$
BEGIN
  PERFORM recalculate_order_total(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_recalculate_total_after_insert
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION recalculate_new_order_total();

CREATE OR REPLACE FUNCTION prevent_confirmed_order_items_change()
RETURNS trigger AS $$
DECLARE
  current_status order_status;
BEGIN
  SELECT status
  INTO current_status
  FROM orders
  WHERE id = COALESCE(NEW.order_id, OLD.order_id)
  FOR UPDATE;

  IF current_status <> 'pending' THEN
    RAISE EXCEPTION 'Order items are immutable after confirmation';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_immutable_after_pending
BEFORE INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION prevent_confirmed_order_items_change();
