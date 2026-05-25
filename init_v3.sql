--
-- PostgreSQL database dump
--

\restrict 9kVgCBJ2zM6v6smPd1a77fgiJOaftZmWhl1R2CWpQ7OkeCIqzeh8PogCRkBPGHl

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

-- Started on 2026-05-13 04:39:15 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 4081 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 339 (class 1255 OID 17294)
-- Name: confirm_stock(uuid, integer); Type: FUNCTION; Schema: public; Owner: vnb_admin
--

CREATE FUNCTION public.confirm_stock(p_variant_id uuid, p_quantity integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE product_variants SET
        reserved_stock = GREATEST(reserved_stock - p_quantity, 0),
        updated_at     = now()
    WHERE id = p_variant_id AND deleted_at IS NULL;
END;
$$;


ALTER FUNCTION public.confirm_stock(p_variant_id uuid, p_quantity integer) OWNER TO vnb_admin;

--
-- TOC entry 338 (class 1255 OID 17293)
-- Name: release_stock(uuid, integer); Type: FUNCTION; Schema: public; Owner: vnb_admin
--

CREATE FUNCTION public.release_stock(p_variant_id uuid, p_quantity integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE product_variants SET
        available_stock = available_stock + p_quantity,
        reserved_stock  = GREATEST(reserved_stock - p_quantity, 0),
        updated_at      = now()
    WHERE id = p_variant_id AND deleted_at IS NULL;
END;
$$;


ALTER FUNCTION public.release_stock(p_variant_id uuid, p_quantity integer) OWNER TO vnb_admin;

--
-- TOC entry 337 (class 1255 OID 17292)
-- Name: reserve_stock(uuid, integer); Type: FUNCTION; Schema: public; Owner: vnb_admin
--

CREATE FUNCTION public.reserve_stock(p_variant_id uuid, p_quantity integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_avail INTEGER;
BEGIN
    -- Lock row để tránh race condition
    SELECT available_stock INTO v_avail
    FROM product_variants
    WHERE id = p_variant_id AND deleted_at IS NULL
    FOR UPDATE;

    IF v_avail IS NULL OR v_avail < p_quantity THEN
        RETURN FALSE;
    END IF;

    UPDATE product_variants SET
        available_stock = available_stock - p_quantity,
        reserved_stock  = reserved_stock  + p_quantity,
        updated_at      = now()
    WHERE id = p_variant_id;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.reserve_stock(p_variant_id uuid, p_quantity integer) OWNER TO vnb_admin;

--
-- TOC entry 325 (class 1255 OID 16503)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: vnb_admin
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO vnb_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16521)
-- Name: addresses; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label character varying(60),
    street_line1 character varying(255) NOT NULL,
    street_line2 character varying(255),
    ward character varying(100),
    district character varying(100) NOT NULL,
    province character varying(100) NOT NULL,
    country_code character(2) DEFAULT 'VN'::bpchar NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.addresses OWNER TO vnb_admin;

--
-- TOC entry 248 (class 1259 OID 17125)
-- Name: admin_permissions; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.admin_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource character varying(60) NOT NULL,
    action character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_permissions OWNER TO vnb_admin;

--
-- TOC entry 249 (class 1259 OID 17134)
-- Name: admin_role_permissions; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.admin_role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.admin_role_permissions OWNER TO vnb_admin;

--
-- TOC entry 247 (class 1259 OID 17114)
-- Name: admin_roles; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.admin_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(60) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_roles OWNER TO vnb_admin;

--
-- TOC entry 250 (class 1259 OID 17149)
-- Name: admin_user_roles; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.admin_user_roles (
    admin_user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE public.admin_user_roles OWNER TO vnb_admin;

--
-- TOC entry 246 (class 1259 OID 17100)
-- Name: admin_users; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(80) NOT NULL,
    last_name character varying(80) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_users OWNER TO vnb_admin;

--
-- TOC entry 251 (class 1259 OID 17164)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id uuid,
    entity_type character varying(60) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    before_state jsonb,
    after_state jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT audit_logs_action_check CHECK (((action)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'restore'::character varying])::text[])))
);


ALTER TABLE public.audit_logs OWNER TO vnb_admin;

--
-- TOC entry 252 (class 1259 OID 17181)
-- Name: banners; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by uuid,
    title character varying(255) NOT NULL,
    image_url text NOT NULL,
    link_url text,
    placement character varying(40) NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT banners_placement_check CHECK (((placement)::text = ANY ((ARRAY['homepage_hero'::character varying, 'homepage_mid'::character varying, 'category_top'::character varying, 'popup'::character varying])::text[])))
);


ALTER TABLE public.banners OWNER TO vnb_admin;

--
-- TOC entry 253 (class 1259 OID 17199)
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    body_html text NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_posts_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.blog_posts OWNER TO vnb_admin;

--
-- TOC entry 218 (class 1259 OID 16539)
-- Name: brands; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(120) NOT NULL,
    slug character varying(120) NOT NULL,
    country_of_origin character varying(80),
    description text,
    logo_url text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.brands OWNER TO vnb_admin;

--
-- TOC entry 257 (class 1259 OID 17275)
-- Name: campaign_recipients; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.campaign_recipients (
    campaign_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    sent_at timestamp with time zone,
    opened_at timestamp with time zone
);


ALTER TABLE public.campaign_recipients OWNER TO vnb_admin;

--
-- TOC entry 256 (class 1259 OID 17260)
-- Name: campaigns; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(30) NOT NULL,
    target_segment character varying(100),
    channel character varying(20) NOT NULL,
    content_template text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    recipient_count integer DEFAULT 0 NOT NULL,
    open_count integer DEFAULT 0 NOT NULL,
    click_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaigns_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'scheduled'::character varying, 'sending'::character varying, 'sent'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT campaigns_type_check CHECK (((type)::text = ANY ((ARRAY['email'::character varying, 'sms'::character varying, 'push'::character varying, 'zalo'::character varying])::text[])))
);


ALTER TABLE public.campaigns OWNER TO vnb_admin;

--
-- TOC entry 227 (class 1259 OID 16713)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    quantity smallint DEFAULT 1 NOT NULL,
    price_snapshot numeric(12,0) NOT NULL,
    customizations jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart_items OWNER TO vnb_admin;

--
-- TOC entry 226 (class 1259 OID 16698)
-- Name: carts; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.carts OWNER TO vnb_admin;

--
-- TOC entry 219 (class 1259 OID 16554)
-- Name: categories; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid,
    name character varying(120) NOT NULL,
    slug character varying(120) NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO vnb_admin;

--
-- TOC entry 228 (class 1259 OID 16740)
-- Name: discounts; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.discounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    value numeric(10,2) NOT NULL,
    min_order_amount numeric(12,0) DEFAULT 0 NOT NULL,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT discounts_type_check CHECK (((type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying, 'free_shipping'::character varying])::text[]))),
    CONSTRAINT discounts_value_check CHECK ((value >= (0)::numeric))
);


ALTER TABLE public.discounts OWNER TO vnb_admin;

--
-- TOC entry 243 (class 1259 OID 17034)
-- Name: loyalty_accounts; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.loyalty_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points_balance integer DEFAULT 0 NOT NULL,
    points_lifetime integer DEFAULT 0 NOT NULL,
    tier_id uuid,
    tier_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loyalty_accounts_points_balance_check CHECK ((points_balance >= 0))
);


ALTER TABLE public.loyalty_accounts OWNER TO vnb_admin;

--
-- TOC entry 242 (class 1259 OID 17021)
-- Name: loyalty_tiers; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.loyalty_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    min_lifetime_points integer DEFAULT 0 NOT NULL,
    discount_pct numeric(5,2) DEFAULT 0 NOT NULL,
    free_shipping_above numeric(12,0),
    birthday_bonus_pct smallint DEFAULT 0 NOT NULL,
    points_multiplier numeric(4,2) DEFAULT 1.0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.loyalty_tiers OWNER TO vnb_admin;

--
-- TOC entry 244 (class 1259 OID 17060)
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    order_id uuid,
    type character varying(20) NOT NULL,
    points_delta integer NOT NULL,
    balance_after integer NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loyalty_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['earn'::character varying, 'redeem'::character varying, 'expire'::character varying, 'adjust'::character varying, 'bonus'::character varying])::text[])))
);


ALTER TABLE public.loyalty_transactions OWNER TO vnb_admin;

--
-- TOC entry 255 (class 1259 OID 17241)
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.notification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    channel character varying(20) NOT NULL,
    type character varying(50) NOT NULL,
    subject character varying(255),
    body_preview text,
    status character varying(20) DEFAULT 'sent'::character varying NOT NULL,
    external_id character varying(100),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    CONSTRAINT notification_logs_channel_check CHECK (((channel)::text = ANY ((ARRAY['email'::character varying, 'sms'::character varying, 'push'::character varying, 'zalo'::character varying])::text[]))),
    CONSTRAINT notification_logs_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'delivered'::character varying, 'failed'::character varying, 'bounced'::character varying])::text[])))
);


ALTER TABLE public.notification_logs OWNER TO vnb_admin;

--
-- TOC entry 254 (class 1259 OID 17221)
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_order_update boolean DEFAULT true NOT NULL,
    email_promotion boolean DEFAULT false NOT NULL,
    sms_order_update boolean DEFAULT true NOT NULL,
    sms_promotion boolean DEFAULT false NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    zalo_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO vnb_admin;

--
-- TOC entry 222 (class 1259 OID 16622)
-- Name: option_values; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.option_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    option_id uuid NOT NULL,
    value character varying(100) NOT NULL,
    "position" smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.option_values OWNER TO vnb_admin;

--
-- TOC entry 231 (class 1259 OID 16811)
-- Name: order_discounts; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.order_discounts (
    order_id uuid NOT NULL,
    discount_id uuid NOT NULL,
    applied_amount numeric(12,0) NOT NULL
);


ALTER TABLE public.order_discounts OWNER TO vnb_admin;

--
-- TOC entry 230 (class 1259 OID 16789)
-- Name: order_items; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    variant_id uuid,
    product_name character varying(255) NOT NULL,
    variant_label character varying(255),
    quantity smallint NOT NULL,
    unit_price numeric(12,0) NOT NULL,
    subtotal numeric(12,0) NOT NULL,
    customizations jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO vnb_admin;

--
-- TOC entry 229 (class 1259 OID 16756)
-- Name: orders; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    shipping_address_id uuid,
    order_number character varying(30) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    subtotal numeric(12,0) NOT NULL,
    shipping_fee numeric(12,0) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,0) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,0) DEFAULT 0 NOT NULL,
    total_amount numeric(12,0) NOT NULL,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    payment_method character varying(30),
    notes text,
    placed_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['unpaid'::character varying, 'pending'::character varying, 'paid'::character varying, 'partially_refunded'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO vnb_admin;

--
-- TOC entry 235 (class 1259 OID 16897)
-- Name: payment_methods_saved; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.payment_methods_saved (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gateway character varying(30) NOT NULL,
    type character varying(20) NOT NULL,
    last4 character(4),
    brand character varying(20),
    expiry_month character(2),
    expiry_year character(4),
    gateway_token text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_methods_saved_type_check CHECK (((type)::text = ANY ((ARRAY['card'::character varying, 'wallet'::character varying, 'bank_account'::character varying])::text[])))
);


ALTER TABLE public.payment_methods_saved OWNER TO vnb_admin;

--
-- TOC entry 234 (class 1259 OID 16874)
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    gateway character varying(30) NOT NULL,
    gateway_txn_id character varying(100),
    method character varying(30),
    amount numeric(12,0) NOT NULL,
    currency character(3) DEFAULT 'VND'::bpchar NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    gateway_response jsonb DEFAULT '{}'::jsonb NOT NULL,
    initiated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT payment_transactions_gateway_check CHECK (((gateway)::text = ANY ((ARRAY['vnpay'::character varying, 'momo'::character varying, 'zalopay'::character varying, 'cod'::character varying, 'bank_transfer'::character varying, 'card'::character varying])::text[]))),
    CONSTRAINT payment_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'success'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.payment_transactions OWNER TO vnb_admin;

--
-- TOC entry 245 (class 1259 OID 17080)
-- Name: point_redemptions; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.point_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    account_id uuid NOT NULL,
    points_used integer NOT NULL,
    discount_applied numeric(12,0) NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT point_redemptions_points_used_check CHECK ((points_used > 0))
);


ALTER TABLE public.point_redemptions OWNER TO vnb_admin;

--
-- TOC entry 225 (class 1259 OID 16681)
-- Name: product_images; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    url text NOT NULL,
    alt_text character varying(255),
    is_primary boolean DEFAULT false NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_images OWNER TO vnb_admin;

--
-- TOC entry 221 (class 1259 OID 16606)
-- Name: product_options; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.product_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name character varying(80) NOT NULL,
    "position" smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_options OWNER TO vnb_admin;

--
-- TOC entry 223 (class 1259 OID 16638)
-- Name: product_variants; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    sku character varying(100) NOT NULL,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    price numeric(12,0) NOT NULL,
    sale_price numeric(12,0),
    available_stock integer DEFAULT 0 NOT NULL,
    reserved_stock integer DEFAULT 0 NOT NULL,
    image_url text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_variants_available_stock_check CHECK ((available_stock >= 0)),
    CONSTRAINT product_variants_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT product_variants_reserved_stock_check CHECK ((reserved_stock >= 0)),
    CONSTRAINT product_variants_sale_price_check CHECK ((sale_price >= (0)::numeric))
);


ALTER TABLE public.product_variants OWNER TO vnb_admin;

--
-- TOC entry 220 (class 1259 OID 16570)
-- Name: products; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    skill_level character varying(20),
    flex character varying(20),
    weight_class character varying(10),
    specifications jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_flex_check CHECK (((flex)::text = ANY ((ARRAY['extra-stiff'::character varying, 'stiff'::character varying, 'medium'::character varying, 'flexible'::character varying, 'extra-flexible'::character varying])::text[]))),
    CONSTRAINT products_skill_level_check CHECK (((skill_level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'professional'::character varying])::text[]))),
    CONSTRAINT products_weight_class_check CHECK (((weight_class)::text = ANY ((ARRAY['2U'::character varying, '3U'::character varying, '4U'::character varying, '5U'::character varying, '6U'::character varying])::text[])))
);


ALTER TABLE public.products OWNER TO vnb_admin;

--
-- TOC entry 236 (class 1259 OID 16914)
-- Name: refunds; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid NOT NULL,
    initiated_by uuid,
    amount numeric(12,0) NOT NULL,
    reason character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    gateway_refund_id character varying(100),
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT refunds_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT refunds_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'processing'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.refunds OWNER TO vnb_admin;

--
-- TOC entry 232 (class 1259 OID 16826)
-- Name: reviews; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    order_item_id uuid,
    rating smallint NOT NULL,
    body text,
    is_verified_purchase boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO vnb_admin;

--
-- TOC entry 241 (class 1259 OID 17006)
-- Name: shipment_events; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.shipment_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shipment_id uuid NOT NULL,
    location character varying(255),
    description text NOT NULL,
    status_code character varying(50),
    occurred_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shipment_events OWNER TO vnb_admin;

--
-- TOC entry 240 (class 1259 OID 16979)
-- Name: shipments; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.shipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    method_id uuid,
    tracking_number character varying(100),
    carrier_status character varying(100),
    internal_status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    weight_g integer,
    dimensions_cm jsonb,
    shipping_fee_charged numeric(10,0),
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    estimated_delivery timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT shipments_internal_status_check CHECK (((internal_status)::text = ANY ((ARRAY['pending'::character varying, 'picked_up'::character varying, 'in_transit'::character varying, 'out_for_delivery'::character varying, 'delivered'::character varying, 'failed'::character varying, 'returned'::character varying])::text[])))
);


ALTER TABLE public.shipments OWNER TO vnb_admin;

--
-- TOC entry 237 (class 1259 OID 16935)
-- Name: shipping_carriers; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.shipping_carriers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    api_endpoint text,
    api_key_enc text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shipping_carriers OWNER TO vnb_admin;

--
-- TOC entry 238 (class 1259 OID 16947)
-- Name: shipping_methods; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.shipping_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    carrier_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    service_code character varying(50),
    estimated_days_min smallint DEFAULT 1 NOT NULL,
    estimated_days_max smallint DEFAULT 5 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shipping_methods OWNER TO vnb_admin;

--
-- TOC entry 239 (class 1259 OID 16963)
-- Name: shipping_rates; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.shipping_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    method_id uuid NOT NULL,
    province_code character varying(10),
    min_weight_g integer DEFAULT 0 NOT NULL,
    max_weight_g integer,
    base_fee numeric(10,0) NOT NULL,
    per_kg_fee numeric(10,0) DEFAULT 0 NOT NULL,
    free_above_order numeric(12,0),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shipping_rates OWNER TO vnb_admin;

--
-- TOC entry 216 (class 1259 OID 16504)
-- Name: users; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(80) NOT NULL,
    last_name character varying(80) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role character varying(20) DEFAULT 'CUSTOMER'::character varying NOT NULL,
    verification_token character varying(255),
    verification_expires_at timestamp with time zone,
    reset_password_token character varying(255),
    reset_password_expires_at timestamp with time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['CUSTOMER'::character varying, 'VIP'::character varying, 'BANNED'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO vnb_admin;

--
-- TOC entry 224 (class 1259 OID 16665)
-- Name: variant_option_values; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.variant_option_values (
    variant_id uuid NOT NULL,
    option_value_id uuid NOT NULL
);


ALTER TABLE public.variant_option_values OWNER TO vnb_admin;

--
-- TOC entry 233 (class 1259 OID 16854)
-- Name: wishlists; Type: TABLE; Schema: public; Owner: vnb_admin
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wishlists OWNER TO vnb_admin;

--
-- TOC entry 3700 (class 2606 OID 16531)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 3843 (class 2606 OID 17131)
-- Name: admin_permissions admin_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3847 (class 2606 OID 17138)
-- Name: admin_role_permissions admin_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_role_permissions
    ADD CONSTRAINT admin_role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 3839 (class 2606 OID 17122)
-- Name: admin_roles admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3849 (class 2606 OID 17153)
-- Name: admin_user_roles admin_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_user_roles
    ADD CONSTRAINT admin_user_roles_pkey PRIMARY KEY (admin_user_id, role_id);


--
-- TOC entry 3835 (class 2606 OID 17110)
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- TOC entry 3851 (class 2606 OID 17173)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3855 (class 2606 OID 17192)
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- TOC entry 3858 (class 2606 OID 17210)
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- TOC entry 3704 (class 2606 OID 16548)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- TOC entry 3873 (class 2606 OID 17280)
-- Name: campaign_recipients campaign_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_pkey PRIMARY KEY (campaign_id, user_id);


--
-- TOC entry 3871 (class 2606 OID 17274)
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- TOC entry 3753 (class 2606 OID 16725)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3749 (class 2606 OID 16705)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- TOC entry 3710 (class 2606 OID 16561)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3759 (class 2606 OID 16752)
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3823 (class 2606 OID 17045)
-- Name: loyalty_accounts loyalty_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3818 (class 2606 OID 17031)
-- Name: loyalty_tiers loyalty_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_tiers
    ADD CONSTRAINT loyalty_tiers_pkey PRIMARY KEY (id);


--
-- TOC entry 3829 (class 2606 OID 17067)
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3869 (class 2606 OID 17253)
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3864 (class 2606 OID 17233)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 3733 (class 2606 OID 16629)
-- Name: option_values option_values_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.option_values
    ADD CONSTRAINT option_values_pkey PRIMARY KEY (id);


--
-- TOC entry 3775 (class 2606 OID 16815)
-- Name: order_discounts order_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.order_discounts
    ADD CONSTRAINT order_discounts_pkey PRIMARY KEY (order_id, discount_id);


--
-- TOC entry 3773 (class 2606 OID 16798)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3767 (class 2606 OID 16772)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3793 (class 2606 OID 16907)
-- Name: payment_methods_saved payment_methods_saved_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.payment_methods_saved
    ADD CONSTRAINT payment_methods_saved_pkey PRIMARY KEY (id);


--
-- TOC entry 3788 (class 2606 OID 16887)
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3833 (class 2606 OID 17087)
-- Name: point_redemptions point_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.point_redemptions
    ADD CONSTRAINT point_redemptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3747 (class 2606 OID 16691)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- TOC entry 3728 (class 2606 OID 16613)
-- Name: product_options product_options_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_options
    ADD CONSTRAINT product_options_pkey PRIMARY KEY (id);


--
-- TOC entry 3739 (class 2606 OID 16654)
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- TOC entry 3723 (class 2606 OID 16584)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3796 (class 2606 OID 16923)
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- TOC entry 3779 (class 2606 OID 16836)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3816 (class 2606 OID 17014)
-- Name: shipment_events shipment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipment_events
    ADD CONSTRAINT shipment_events_pkey PRIMARY KEY (id);


--
-- TOC entry 3811 (class 2606 OID 16990)
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- TOC entry 3798 (class 2606 OID 16944)
-- Name: shipping_carriers shipping_carriers_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipping_carriers
    ADD CONSTRAINT shipping_carriers_pkey PRIMARY KEY (id);


--
-- TOC entry 3803 (class 2606 OID 16956)
-- Name: shipping_methods shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 3807 (class 2606 OID 16971)
-- Name: shipping_rates shipping_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT shipping_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 3845 (class 2606 OID 17133)
-- Name: admin_permissions uq_admin_permission; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT uq_admin_permission UNIQUE (resource, action);


--
-- TOC entry 3841 (class 2606 OID 17124)
-- Name: admin_roles uq_admin_roles_name; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT uq_admin_roles_name UNIQUE (name);


--
-- TOC entry 3837 (class 2606 OID 17112)
-- Name: admin_users uq_admin_users_email; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT uq_admin_users_email UNIQUE (email);


--
-- TOC entry 3862 (class 2606 OID 17212)
-- Name: blog_posts uq_blog_posts_slug; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT uq_blog_posts_slug UNIQUE (slug);


--
-- TOC entry 3706 (class 2606 OID 16550)
-- Name: brands uq_brands_name; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT uq_brands_name UNIQUE (name);


--
-- TOC entry 3708 (class 2606 OID 16552)
-- Name: brands uq_brands_slug; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT uq_brands_slug UNIQUE (slug);


--
-- TOC entry 3800 (class 2606 OID 16946)
-- Name: shipping_carriers uq_carriers_code; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipping_carriers
    ADD CONSTRAINT uq_carriers_code UNIQUE (code);


--
-- TOC entry 3757 (class 2606 OID 16727)
-- Name: cart_items uq_cart_variant; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id);


--
-- TOC entry 3713 (class 2606 OID 16563)
-- Name: categories uq_categories_slug; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT uq_categories_slug UNIQUE (slug);


--
-- TOC entry 3762 (class 2606 OID 16754)
-- Name: discounts uq_discounts_code; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT uq_discounts_code UNIQUE (code);


--
-- TOC entry 3820 (class 2606 OID 17033)
-- Name: loyalty_tiers uq_loyalty_tiers_name; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_tiers
    ADD CONSTRAINT uq_loyalty_tiers_name UNIQUE (name);


--
-- TOC entry 3825 (class 2606 OID 17047)
-- Name: loyalty_accounts uq_loyalty_user; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT uq_loyalty_user UNIQUE (user_id);


--
-- TOC entry 3866 (class 2606 OID 17235)
-- Name: notification_preferences uq_notif_prefs_user; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT uq_notif_prefs_user UNIQUE (user_id);


--
-- TOC entry 3735 (class 2606 OID 16631)
-- Name: option_values uq_option_values; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.option_values
    ADD CONSTRAINT uq_option_values UNIQUE (option_id, value);


--
-- TOC entry 3769 (class 2606 OID 16774)
-- Name: orders uq_orders_number; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT uq_orders_number UNIQUE (order_number);


--
-- TOC entry 3790 (class 2606 OID 16889)
-- Name: payment_transactions uq_payment_gateway_txn; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT uq_payment_gateway_txn UNIQUE (gateway, gateway_txn_id);


--
-- TOC entry 3730 (class 2606 OID 16615)
-- Name: product_options uq_product_options; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_options
    ADD CONSTRAINT uq_product_options UNIQUE (product_id, name);


--
-- TOC entry 3725 (class 2606 OID 16586)
-- Name: products uq_products_slug; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_slug UNIQUE (slug);


--
-- TOC entry 3813 (class 2606 OID 16992)
-- Name: shipments uq_shipments_tracking; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT uq_shipments_tracking UNIQUE (tracking_number);


--
-- TOC entry 3696 (class 2606 OID 16516)
-- Name: users uq_users_email; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);


--
-- TOC entry 3741 (class 2606 OID 16656)
-- Name: product_variants uq_variants_sku; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT uq_variants_sku UNIQUE (sku);


--
-- TOC entry 3782 (class 2606 OID 16862)
-- Name: wishlists uq_wishlist; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT uq_wishlist UNIQUE (user_id, variant_id);


--
-- TOC entry 3698 (class 2606 OID 16514)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3744 (class 2606 OID 16669)
-- Name: variant_option_values variant_option_values_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.variant_option_values
    ADD CONSTRAINT variant_option_values_pkey PRIMARY KEY (variant_id, option_value_id);


--
-- TOC entry 3784 (class 2606 OID 16860)
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- TOC entry 3701 (class 1259 OID 16538)
-- Name: idx_addresses_province; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_addresses_province ON public.addresses USING btree (province, district);


--
-- TOC entry 3702 (class 1259 OID 16537)
-- Name: idx_addresses_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_addresses_user ON public.addresses USING btree (user_id);


--
-- TOC entry 3852 (class 1259 OID 17180)
-- Name: idx_audit_logs_admin; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_audit_logs_admin ON public.audit_logs USING btree (admin_user_id, created_at DESC);


--
-- TOC entry 3853 (class 1259 OID 17179)
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- TOC entry 3856 (class 1259 OID 17198)
-- Name: idx_banners_active; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_banners_active ON public.banners USING btree (placement, is_active, sort_order) WHERE (is_active = true);


--
-- TOC entry 3859 (class 1259 OID 17219)
-- Name: idx_blog_posts_slug_trgm; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_blog_posts_slug_trgm ON public.blog_posts USING gin (slug public.gin_trgm_ops);


--
-- TOC entry 3860 (class 1259 OID 17218)
-- Name: idx_blog_posts_status; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status, published_at DESC);


--
-- TOC entry 3874 (class 1259 OID 17291)
-- Name: idx_campaign_recipients_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_campaign_recipients_user ON public.campaign_recipients USING btree (user_id);


--
-- TOC entry 3754 (class 1259 OID 16738)
-- Name: idx_cart_items_cart; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_cart_items_cart ON public.cart_items USING btree (cart_id);


--
-- TOC entry 3755 (class 1259 OID 16739)
-- Name: idx_cart_items_variant; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_cart_items_variant ON public.cart_items USING btree (variant_id);


--
-- TOC entry 3750 (class 1259 OID 16712)
-- Name: idx_carts_session; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_carts_session ON public.carts USING btree (session_id);


--
-- TOC entry 3751 (class 1259 OID 16711)
-- Name: idx_carts_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_carts_user ON public.carts USING btree (user_id);


--
-- TOC entry 3711 (class 1259 OID 16569)
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);


--
-- TOC entry 3760 (class 1259 OID 16755)
-- Name: idx_discounts_active; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_discounts_active ON public.discounts USING btree (code, is_active) WHERE (is_active = true);


--
-- TOC entry 3821 (class 1259 OID 17058)
-- Name: idx_loyalty_accounts_tier; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_loyalty_accounts_tier ON public.loyalty_accounts USING btree (tier_id);


--
-- TOC entry 3826 (class 1259 OID 17078)
-- Name: idx_loyalty_txn_account; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_loyalty_txn_account ON public.loyalty_transactions USING btree (account_id, created_at DESC);


--
-- TOC entry 3827 (class 1259 OID 17079)
-- Name: idx_loyalty_txn_order; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_loyalty_txn_order ON public.loyalty_transactions USING btree (order_id);


--
-- TOC entry 3867 (class 1259 OID 17259)
-- Name: idx_notif_logs_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_notif_logs_user ON public.notification_logs USING btree (user_id, sent_at DESC);


--
-- TOC entry 3731 (class 1259 OID 16637)
-- Name: idx_option_values_option; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_option_values_option ON public.option_values USING btree (option_id);


--
-- TOC entry 3770 (class 1259 OID 16809)
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- TOC entry 3771 (class 1259 OID 16810)
-- Name: idx_order_items_variant; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_order_items_variant ON public.order_items USING btree (variant_id);


--
-- TOC entry 3763 (class 1259 OID 16787)
-- Name: idx_orders_payment; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_orders_payment ON public.orders USING btree (payment_status);


--
-- TOC entry 3764 (class 1259 OID 16786)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status, placed_at DESC);


--
-- TOC entry 3765 (class 1259 OID 16785)
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- TOC entry 3785 (class 1259 OID 16895)
-- Name: idx_payment_txn_order; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_payment_txn_order ON public.payment_transactions USING btree (order_id);


--
-- TOC entry 3786 (class 1259 OID 16896)
-- Name: idx_payment_txn_status; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_payment_txn_status ON public.payment_transactions USING btree (status, initiated_at DESC);


--
-- TOC entry 3830 (class 1259 OID 17099)
-- Name: idx_point_redemptions_account; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_point_redemptions_account ON public.point_redemptions USING btree (account_id);


--
-- TOC entry 3831 (class 1259 OID 17098)
-- Name: idx_point_redemptions_order; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_point_redemptions_order ON public.point_redemptions USING btree (order_id);


--
-- TOC entry 3745 (class 1259 OID 16697)
-- Name: idx_product_images_product; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id);


--
-- TOC entry 3726 (class 1259 OID 16621)
-- Name: idx_product_options_product; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_product_options_product ON public.product_options USING btree (product_id);


--
-- TOC entry 3714 (class 1259 OID 16597)
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3715 (class 1259 OID 16602)
-- Name: idx_products_cat_flex; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_cat_flex ON public.products USING btree (category_id, flex, weight_class) WHERE (deleted_at IS NULL);


--
-- TOC entry 3716 (class 1259 OID 16598)
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3717 (class 1259 OID 16599)
-- Name: idx_products_flex; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_flex ON public.products USING btree (flex) WHERE (deleted_at IS NULL);


--
-- TOC entry 3718 (class 1259 OID 16604)
-- Name: idx_products_name_trgm; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_name_trgm ON public.products USING gin (name public.gin_trgm_ops);


--
-- TOC entry 3719 (class 1259 OID 16601)
-- Name: idx_products_skill_level; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_skill_level ON public.products USING btree (skill_level) WHERE (deleted_at IS NULL);


--
-- TOC entry 3720 (class 1259 OID 16603)
-- Name: idx_products_specs_gin; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_specs_gin ON public.products USING gin (specifications);


--
-- TOC entry 3721 (class 1259 OID 16600)
-- Name: idx_products_weight_class; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_products_weight_class ON public.products USING btree (weight_class) WHERE (deleted_at IS NULL);


--
-- TOC entry 3794 (class 1259 OID 16934)
-- Name: idx_refunds_transaction; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_refunds_transaction ON public.refunds USING btree (transaction_id);


--
-- TOC entry 3776 (class 1259 OID 16852)
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- TOC entry 3777 (class 1259 OID 16853)
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- TOC entry 3791 (class 1259 OID 16913)
-- Name: idx_saved_methods_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_saved_methods_user ON public.payment_methods_saved USING btree (user_id);


--
-- TOC entry 3814 (class 1259 OID 17020)
-- Name: idx_shipment_events_shipment; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_shipment_events_shipment ON public.shipment_events USING btree (shipment_id, occurred_at DESC);


--
-- TOC entry 3808 (class 1259 OID 17003)
-- Name: idx_shipments_order; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_shipments_order ON public.shipments USING btree (order_id);


--
-- TOC entry 3809 (class 1259 OID 17004)
-- Name: idx_shipments_status; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_shipments_status ON public.shipments USING btree (internal_status);


--
-- TOC entry 3801 (class 1259 OID 16962)
-- Name: idx_shipping_methods_carrier; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_shipping_methods_carrier ON public.shipping_methods USING btree (carrier_id);


--
-- TOC entry 3804 (class 1259 OID 16977)
-- Name: idx_shipping_rates_method; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_shipping_rates_method ON public.shipping_rates USING btree (method_id);


--
-- TOC entry 3805 (class 1259 OID 16978)
-- Name: idx_shipping_rates_province; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_shipping_rates_province ON public.shipping_rates USING btree (province_code);


--
-- TOC entry 3691 (class 1259 OID 16519)
-- Name: idx_users_deleted; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_users_deleted ON public.users USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- TOC entry 3692 (class 1259 OID 16518)
-- Name: idx_users_first_name; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_users_first_name ON public.users USING btree (first_name);


--
-- TOC entry 3693 (class 1259 OID 16517)
-- Name: idx_users_last_name; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_users_last_name ON public.users USING btree (last_name);


--
-- TOC entry 3694 (class 1259 OID 25489)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 3736 (class 1259 OID 16663)
-- Name: idx_variants_in_stock; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_variants_in_stock ON public.product_variants USING btree (product_id, available_stock) WHERE ((deleted_at IS NULL) AND (available_stock > 0));


--
-- TOC entry 3737 (class 1259 OID 16662)
-- Name: idx_variants_product; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_variants_product ON public.product_variants USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3742 (class 1259 OID 16680)
-- Name: idx_vov_option_value; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_vov_option_value ON public.variant_option_values USING btree (option_value_id);


--
-- TOC entry 3780 (class 1259 OID 16873)
-- Name: idx_wishlists_user; Type: INDEX; Schema: public; Owner: vnb_admin
--

CREATE INDEX idx_wishlists_user ON public.wishlists USING btree (user_id);


--
-- TOC entry 3932 (class 2620 OID 17113)
-- Name: admin_users trg_admin_users_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3933 (class 2620 OID 17220)
-- Name: blog_posts trg_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3926 (class 2620 OID 16553)
-- Name: brands trg_brands_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3931 (class 2620 OID 17059)
-- Name: loyalty_accounts trg_loyalty_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_loyalty_accounts_updated_at BEFORE UPDATE ON public.loyalty_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3929 (class 2620 OID 16788)
-- Name: orders trg_orders_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3927 (class 2620 OID 16605)
-- Name: products trg_products_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3930 (class 2620 OID 17005)
-- Name: shipments trg_shipments_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3925 (class 2620 OID 16520)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3928 (class 2620 OID 16664)
-- Name: product_variants trg_variants_updated_at; Type: TRIGGER; Schema: public; Owner: vnb_admin
--

CREATE TRIGGER trg_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3875 (class 2606 OID 16532)
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3914 (class 2606 OID 17144)
-- Name: admin_role_permissions admin_role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_role_permissions
    ADD CONSTRAINT admin_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.admin_permissions(id) ON DELETE CASCADE;


--
-- TOC entry 3915 (class 2606 OID 17139)
-- Name: admin_role_permissions admin_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_role_permissions
    ADD CONSTRAINT admin_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id) ON DELETE CASCADE;


--
-- TOC entry 3916 (class 2606 OID 17154)
-- Name: admin_user_roles admin_user_roles_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_user_roles
    ADD CONSTRAINT admin_user_roles_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- TOC entry 3917 (class 2606 OID 17159)
-- Name: admin_user_roles admin_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.admin_user_roles
    ADD CONSTRAINT admin_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id) ON DELETE CASCADE;


--
-- TOC entry 3918 (class 2606 OID 17174)
-- Name: audit_logs audit_logs_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;


--
-- TOC entry 3919 (class 2606 OID 17193)
-- Name: banners banners_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON DELETE SET NULL;


--
-- TOC entry 3920 (class 2606 OID 17213)
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;


--
-- TOC entry 3923 (class 2606 OID 17281)
-- Name: campaign_recipients campaign_recipients_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- TOC entry 3924 (class 2606 OID 17286)
-- Name: campaign_recipients campaign_recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3886 (class 2606 OID 16728)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- TOC entry 3887 (class 2606 OID 16733)
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 3885 (class 2606 OID 16706)
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3876 (class 2606 OID 16564)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 3908 (class 2606 OID 17053)
-- Name: loyalty_accounts loyalty_accounts_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL;


--
-- TOC entry 3909 (class 2606 OID 17048)
-- Name: loyalty_accounts loyalty_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3910 (class 2606 OID 17068)
-- Name: loyalty_transactions loyalty_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id);


--
-- TOC entry 3911 (class 2606 OID 17073)
-- Name: loyalty_transactions loyalty_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 3922 (class 2606 OID 17254)
-- Name: notification_logs notification_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3921 (class 2606 OID 17236)
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3880 (class 2606 OID 16632)
-- Name: option_values option_values_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.option_values
    ADD CONSTRAINT option_values_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.product_options(id) ON DELETE CASCADE;


--
-- TOC entry 3892 (class 2606 OID 16821)
-- Name: order_discounts order_discounts_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.order_discounts
    ADD CONSTRAINT order_discounts_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id);


--
-- TOC entry 3893 (class 2606 OID 16816)
-- Name: order_discounts order_discounts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.order_discounts
    ADD CONSTRAINT order_discounts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3890 (class 2606 OID 16799)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3891 (class 2606 OID 16804)
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;


--
-- TOC entry 3888 (class 2606 OID 16780)
-- Name: orders orders_shipping_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id) ON DELETE SET NULL;


--
-- TOC entry 3889 (class 2606 OID 16775)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3900 (class 2606 OID 16908)
-- Name: payment_methods_saved payment_methods_saved_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.payment_methods_saved
    ADD CONSTRAINT payment_methods_saved_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3899 (class 2606 OID 16890)
-- Name: payment_transactions payment_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3912 (class 2606 OID 17093)
-- Name: point_redemptions point_redemptions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.point_redemptions
    ADD CONSTRAINT point_redemptions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id);


--
-- TOC entry 3913 (class 2606 OID 17088)
-- Name: point_redemptions point_redemptions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.point_redemptions
    ADD CONSTRAINT point_redemptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3884 (class 2606 OID 16692)
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3879 (class 2606 OID 16616)
-- Name: product_options product_options_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_options
    ADD CONSTRAINT product_options_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3881 (class 2606 OID 16657)
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3877 (class 2606 OID 16587)
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- TOC entry 3878 (class 2606 OID 16592)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 3901 (class 2606 OID 16929)
-- Name: refunds refunds_initiated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3902 (class 2606 OID 16924)
-- Name: refunds refunds_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.payment_transactions(id);


--
-- TOC entry 3894 (class 2606 OID 16847)
-- Name: reviews reviews_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- TOC entry 3895 (class 2606 OID 16837)
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3896 (class 2606 OID 16842)
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3907 (class 2606 OID 17015)
-- Name: shipment_events shipment_events_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipment_events
    ADD CONSTRAINT shipment_events_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- TOC entry 3905 (class 2606 OID 16998)
-- Name: shipments shipments_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_method_id_fkey FOREIGN KEY (method_id) REFERENCES public.shipping_methods(id) ON DELETE SET NULL;


--
-- TOC entry 3906 (class 2606 OID 16993)
-- Name: shipments shipments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3903 (class 2606 OID 16957)
-- Name: shipping_methods shipping_methods_carrier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.shipping_carriers(id);


--
-- TOC entry 3904 (class 2606 OID 16972)
-- Name: shipping_rates shipping_rates_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT shipping_rates_method_id_fkey FOREIGN KEY (method_id) REFERENCES public.shipping_methods(id) ON DELETE CASCADE;


--
-- TOC entry 3882 (class 2606 OID 16675)
-- Name: variant_option_values variant_option_values_option_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.variant_option_values
    ADD CONSTRAINT variant_option_values_option_value_id_fkey FOREIGN KEY (option_value_id) REFERENCES public.option_values(id) ON DELETE RESTRICT;


--
-- TOC entry 3883 (class 2606 OID 16670)
-- Name: variant_option_values variant_option_values_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.variant_option_values
    ADD CONSTRAINT variant_option_values_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 3897 (class 2606 OID 16863)
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3898 (class 2606 OID 16868)
-- Name: wishlists wishlists_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vnb_admin
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


-- Completed on 2026-05-13 04:39:15 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict 9kVgCBJ2zM6v6smPd1a77fgiJOaftZmWhl1R2CWpQ7OkeCIqzeh8PogCRkBPGHl

