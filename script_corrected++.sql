-- ExpenseFlow corrected schema preview
-- Derived from script.sql, but focused on the corrected target model.
-- This file is intentionally preview-oriented: no migration steps and no seed data.

create extension if not exists pgcrypto;
create extension if not exists postgis;

set check_function_bodies = false;

create table users (
    id uuid primary key default gen_random_uuid(),
    email varchar(255) not null unique,
    name varchar(255) not null,
    phone varchar(50),
    avatar_url varchar(500),
    hashed_password text,
    is_active boolean not null default true,
    last_login_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table warehouses (
    id uuid primary key default gen_random_uuid(),
    name varchar(150) not null,
    address text,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table roles (
    id uuid primary key default gen_random_uuid(),
    name varchar(100) not null unique,
    display_name varchar(255) not null,
    description text,
    is_system boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table role_permissions (
    id uuid primary key default gen_random_uuid(),
    role_id uuid not null references roles(id) on delete cascade,
    module_name varchar(50) not null,
    resource_name varchar(50) not null,
    action_name varchar(30) not null,
    unique (role_id, module_name, resource_name, action_name)
);

create table user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    role_id uuid not null references roles(id) on delete restrict,
    warehouse_id uuid references warehouses(id) on delete set null,
    assigned_by uuid references users(id) on delete set null,
    is_active boolean not null default true,
    assigned_at timestamptz not null default now(),
    expires_at timestamptz,
    unique (user_id, role_id, warehouse_id)
);

create table clients (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    company_name varchar(255),
    email varchar(255),
    phone varchar(50),
    phone_alt varchar(50),
    address_line1 varchar(255),
    address_line2 varchar(255),
    city varchar(100),
    state varchar(100),
    zip varchar(20),
    country varchar(100) default 'US',
    notes text,
    referred_by uuid references clients(id) on delete set null,
    assigned_to uuid references users(id) on delete set null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table client_contacts (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references clients(id) on delete cascade,
    name varchar(255) not null,
    role varchar(100),
    email varchar(255),
    phone varchar(50),
    is_primary boolean not null default false,
    created_at timestamptz not null default now()
);

create table suppliers (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    contact_name varchar(255),
    email varchar(255),
    phone varchar(50),
    address text,
    website varchar(255),
    payment_terms varchar(100),
    notes text,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table product_categories (
    id uuid primary key default gen_random_uuid(),
    name varchar(50) not null unique,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table product_attributes (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references product_categories(id) on delete cascade,
    attribute_name varchar(50) not null,
    data_type varchar(20) not null default 'text',
    is_required boolean not null default false,
    unit_label varchar(20),
    unique (category_id, attribute_name)
);

create table products (
    id uuid primary key default gen_random_uuid(),
    sku varchar(100) not null unique,
    name varchar(255) not null,
    description text,
    category_id uuid references product_categories(id) on delete set null,
    unit_type varchar(20) not null default 'sqft',
    price_per_unit numeric(12,4) not null default 0,
    cost_per_unit numeric(12,4) not null default 0,
    supplier_id uuid references suppliers(id) on delete set null,
    brand varchar(100),
    color varchar(100),
    finish varchar(100),
    thickness_cm numeric(6,2),
    thickness_mm numeric(6,2),
    material_type varchar(100),
    weight_kg numeric(8,3),
    dim_width_in numeric(8,2),
    dim_depth_in numeric(8,2),
    dim_height_in numeric(8,2),
    holes smallint,
    faucet_size_in numeric(6,2),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint products_unit_type_check
        check (unit_type in ('sqft', 'sqm', 'linear_ft', 'linear_m', 'piece', 'box', 'roll', 'gallon', 'liter', 'slab'))
);

create table product_attribute_values (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references products(id) on delete cascade,
    attribute_id uuid not null references product_attributes(id) on delete cascade,
    value_text text,
    value_number numeric,
    value_boolean boolean,
    value_json jsonb,
    unique (product_id, attribute_id)
);

create table inventory_movement_types (
    code varchar(50) primary key,
    name varchar(100) not null,
    direction varchar(10) not null,
    requires_reference boolean not null default false,
    description text,
    is_active boolean not null default true,
    constraint inventory_movement_types_direction_check
        check (direction in ('in', 'out', 'neutral'))
);

create table inventory (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references products(id) on delete restrict,
    warehouse_id uuid not null references warehouses(id) on delete restrict,
    quantity_on_hand numeric(12,4) not null default 0,
    quantity_reserved numeric(12,4) not null default 0,
    quantity_available numeric(12,4) generated always as (quantity_on_hand - quantity_reserved) stored,
    reorder_point numeric(12,4) default 0,
    reorder_qty numeric(12,4) default 0,
    last_updated timestamptz not null default now(),
    unique (product_id, warehouse_id)
);

create table inventory_movements (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references products(id) on delete restrict,
    warehouse_id uuid not null references warehouses(id) on delete restrict,
    movement_type varchar(50) not null references inventory_movement_types(code) on delete restrict,
    quantity numeric(12,4) not null,
    order_id uuid,
    order_item_id uuid,
    purchase_order_id uuid,
    purchase_order_item_id uuid,
    job_id uuid,
    vendor_bill_id uuid,
    adjustment_reason text,
    notes text,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint inventory_movements_single_source_check
        check (num_nonnulls(order_id, order_item_id, purchase_order_id, purchase_order_item_id, job_id, vendor_bill_id) <= 1)
);

insert into inventory_movement_types (code, name, direction, requires_reference, description) values
    ('receipt', 'Receipt', 'in', true, 'Inventory received from a purchasing or supplier flow'),
    ('issue', 'Issue', 'out', true, 'Inventory issued to an order, job, or fulfillment flow'),
    ('reservation', 'Reservation', 'neutral', true, 'Inventory reserved but not yet consumed'),
    ('release', 'Release Reservation', 'neutral', true, 'Reserved inventory returned to available'),
    ('return', 'Return', 'in', true, 'Inventory returned back into stock'),
    ('transfer_in', 'Transfer In', 'in', false, 'Inventory transferred into the current warehouse'),
    ('transfer_out', 'Transfer Out', 'out', false, 'Inventory transferred out of the current warehouse'),
    ('adjustment_in', 'Adjustment In', 'in', false, 'Positive manual or migration adjustment'),
    ('adjustment_out', 'Adjustment Out', 'out', false, 'Negative manual or migration adjustment'),
    ('correction', 'Correction', 'neutral', false, 'Administrative correction without directional stock effect');

create table tax_profiles (
    id uuid primary key default gen_random_uuid(),
    code varchar(50) not null unique,
    name varchar(120) not null,
    jurisdiction varchar(120),
    default_rate numeric(7,4) not null,
    valid_from date,
    valid_to date,
    is_active boolean not null default true
);

create table bids (
    id uuid primary key default gen_random_uuid(),
    bid_number varchar(50) not null unique,
    client_id uuid not null references clients(id) on delete restrict,
    assigned_to uuid references users(id) on delete set null,
    status varchar(50) not null default 'draft',
    project_name varchar(255),
    subdivision varchar(255),
    project_address text,
    installation_type varchar(50),
    subtotal numeric(12,2) not null default 0,
    tax_total_cache numeric(12,2) not null default 0,
    discount_amount numeric(12,2) not null default 0,
    total_amount numeric(12,2) generated always as ((subtotal + tax_total_cache) - discount_amount) stored,
    valid_until date,
    notes text,
    specifications jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint bids_installation_type_check
        check (installation_type is null or installation_type in ('spec_home', 'custom', 'commercial', 'multifamily', 'repair'))
);

create table bid_items (
    id uuid primary key default gen_random_uuid(),
    bid_id uuid not null references bids(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    description varchar(500) not null,
    quantity numeric(12,4) not null,
    unit_type varchar(20) not null default 'sqft',
    unit_price numeric(12,4) not null,
    total numeric(12,2) generated always as (quantity * unit_price) stored,
    sort_order integer not null default 0,
    specifications jsonb not null default '{}'::jsonb,
    constraint bid_items_unit_type_check
        check (unit_type in ('sqft', 'sqm', 'linear_ft', 'linear_m', 'piece', 'box', 'roll', 'gallon', 'liter', 'slab'))
);

create table quotes (
    id uuid primary key default gen_random_uuid(),
    quote_number varchar(50) not null unique,
    bid_id uuid references bids(id) on delete set null,
    client_id uuid not null references clients(id) on delete restrict,
    assigned_to uuid references users(id) on delete set null,
    status varchar(50) not null default 'draft',
    subtotal numeric(12,2) not null default 0,
    tax_total_cache numeric(12,2) not null default 0,
    discount_amount numeric(12,2) not null default 0,
    total_amount numeric(12,2) generated always as ((subtotal + tax_total_cache) - discount_amount) stored,
    valid_until date,
    notes text,
    internal_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table quote_items (
    id uuid primary key default gen_random_uuid(),
    quote_id uuid not null references quotes(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    description varchar(500) not null,
    quantity numeric(12,4) not null,
    unit_type varchar(20) not null default 'sqft',
    unit_price numeric(12,4) not null,
    discount_pct numeric(5,4) not null default 0,
    total numeric(12,2) generated always as ((quantity * unit_price) * (1 - discount_pct)) stored,
    sort_order integer not null default 0,
    constraint quote_items_unit_type_check
        check (unit_type in ('sqft', 'sqm', 'linear_ft', 'linear_m', 'piece', 'box', 'roll', 'gallon', 'liter', 'slab'))
);

create table orders (
    id uuid primary key default gen_random_uuid(),
    order_number varchar(50) not null unique,
    quote_id uuid references quotes(id) on delete set null,
    bid_id uuid references bids(id) on delete set null,
    client_id uuid not null references clients(id) on delete restrict,
    assigned_to uuid references users(id) on delete set null,
    project_manager_id uuid references users(id) on delete set null,
    status varchar(50) not null default 'pending',
    project_name varchar(255),
    project_address text,
    subdivision varchar(255),
    installation_type varchar(50),
    subtotal numeric(12,2) not null default 0,
    tax_total_cache numeric(12,2) not null default 0,
    discount_amount numeric(12,2) not null default 0,
    total_amount numeric(12,2) generated always as ((subtotal + tax_total_cache) - discount_amount) stored,
    amount_paid numeric(12,2) not null default 0,
    scheduled_date date,
    delivery_address text,
    notes text,
    internal_notes text,
    inventory_tab_status varchar(50) not null default 'not_ordered',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint orders_installation_type_check
        check (installation_type is null or installation_type in ('spec_home', 'custom', 'commercial', 'multifamily', 'repair'))
);

create table order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    description varchar(500) not null,
    material_info text,
    material_type varchar(100),
    finish varchar(100),
    thickness_label varchar(20),
    quantity numeric(12,4) not null,
    unit_type varchar(20) not null default 'sqft',
    unit_price numeric(12,4) not null,
    cost_per_unit numeric(12,4) not null default 0,
    discount_pct numeric(5,4) not null default 0,
    total numeric(12,2) generated always as ((quantity * unit_price) * (1 - discount_pct)) stored,
    slab_id uuid,
    slab_number varchar(100),
    sku varchar(100),
    material_status varchar(50) not null default 'pending',
    purchase_order_id uuid,
    po_number varchar(50),
    supplier_id uuid references suppliers(id) on delete set null,
    supplier_name varchar(255),
    sort_order integer not null default 0,
    specifications jsonb not null default '{}'::jsonb,
    constraint order_items_unit_type_check
        check (unit_type in ('sqft', 'sqm', 'linear_ft', 'linear_m', 'piece', 'box', 'roll', 'gallon', 'liter', 'slab'))
);

create table document_tax_lines (
    id uuid primary key default gen_random_uuid(),
    tax_profile_id uuid not null references tax_profiles(id) on delete restrict,
    bid_id uuid,
    quote_id uuid,
    order_id uuid,
    invoice_id uuid,
    purchase_order_id uuid,
    vendor_bill_id uuid,
    taxable_base numeric(12,2) not null,
    rate numeric(7,4) not null,
    tax_amount numeric(12,2) not null,
    constraint document_tax_lines_single_owner_check
        check (num_nonnulls(bid_id, quote_id, order_id, invoice_id, purchase_order_id, vendor_bill_id) = 1)
);

create table invoices (
    id uuid primary key default gen_random_uuid(),
    invoice_number varchar(50) not null unique,
    order_id uuid not null references orders(id) on delete restrict,
    client_id uuid not null references clients(id) on delete restrict,
    invoice_type varchar(30) not null default 'sale',
    invoice_total numeric(12,2) not null,
    paid_to_date numeric(12,2) not null default 0,
    balance_due numeric(12,2) generated always as (invoice_total - paid_to_date) stored,
    payment_status varchar(30) not null default 'unpaid',
    issue_date date not null default current_date,
    due_date date not null,
    paid_at timestamptz,
    days_overdue integer not null default 0,
    last_reminder_sent timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    constraint invoices_invoice_type_check
        check (invoice_type in ('sale', 'credit_note', 'deposit', 'refund'))
);

create table document_payments (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid,
    order_id uuid,
    purchase_order_id uuid,
    vendor_bill_id uuid,
    amount numeric(12,2) not null,
    method varchar(50) not null,
    reference varchar(100),
    paid_at timestamptz not null default now(),
    received_by uuid references users(id) on delete set null,
    notes text,
    constraint document_payments_single_owner_check
        check (num_nonnulls(invoice_id, order_id, purchase_order_id, vendor_bill_id) = 1)
);

create view payments as
select
    id,
    invoice_id,
    amount,
    method,
    reference,
    paid_at,
    received_by,
    notes
from document_payments
where invoice_id is not null;

create table jobs (
    id uuid primary key default gen_random_uuid(),
    job_number varchar(50) not null unique,
    order_id uuid not null references orders(id) on delete restrict,
    status varchar(50) not null default 'pending',
    material_status varchar(50) not null default 'pending',
    priority integer not null default 3,
    project_address text,
    subdivision varchar(255),
    installation_type varchar(50),
    project_manager_id uuid references users(id) on delete set null,
    install_date date,
    due_date date,
    estimated_hours numeric(10,2),
    actual_hours numeric(10,2),
    notes text,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint jobs_installation_type_check
        check (installation_type is null or installation_type in ('spec_home', 'custom', 'commercial', 'multifamily', 'repair'))
);

create table job_alerts (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id) on delete cascade,
    alert_type varchar(50) not null,
    title varchar(255) not null,
    description text,
    order_item_id uuid references order_items(id) on delete set null,
    purchase_order_id uuid,
    is_resolved boolean not null default false,
    resolved_at timestamptz,
    resolved_by uuid references users(id) on delete set null,
    last_action_at timestamptz,
    last_action_by uuid references users(id) on delete set null,
    last_action_type varchar(50),
    created_at timestamptz not null default now(),
    constraint job_alerts_alert_type_check
        check (alert_type in ('backordered', 'awaiting_approval', 'needs_revision', 'overdue'))
);

create table job_materials (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    slab_id uuid,
    order_item_id uuid references order_items(id) on delete set null,
    description varchar(500),
    quantity_needed numeric(12,4) not null,
    quantity_used numeric(12,4),
    unit_type varchar(20) not null default 'sqft',
    unit_cost numeric(12,4) not null default 0,
    material_status varchar(50) not null default 'pending',
    constraint job_materials_unit_type_check
        check (unit_type in ('sqft', 'sqm', 'linear_ft', 'linear_m', 'piece', 'box', 'roll', 'gallon', 'liter', 'slab'))
);

create table purchase_orders (
    id uuid primary key default gen_random_uuid(),
    po_number varchar(50) not null unique,
    supplier_id uuid not null references suppliers(id) on delete restrict,
    order_id uuid references orders(id) on delete set null,
    job_id uuid references jobs(id) on delete set null,
    status varchar(50) not null default 'draft',
    approved_amount numeric(12,2) not null default 0,
    vendor_billed numeric(12,2),
    amount_paid numeric(12,2) not null default 0,
    amount_variance numeric(12,2) generated always as (coalesce(vendor_billed, 0) - approved_amount) stored,
    has_mismatch boolean generated always as ((vendor_billed is not null) and (vendor_billed <> approved_amount)) stored,
    ordered_date date,
    expected_arrival date,
    arrived_date date,
    notes text,
    internal_notes text,
    approved_by uuid references users(id) on delete set null,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table purchase_order_items (
    id uuid primary key default gen_random_uuid(),
    purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
    order_item_id uuid references order_items(id) on delete set null,
    product_id uuid references products(id) on delete set null,
    slab_id uuid,
    description varchar(500) not null,
    quantity numeric(12,4) not null,
    unit_type varchar(20) not null default 'sqft',
    unit_price numeric(12,4) not null,
    billed_quantity numeric(12,4),
    billed_price numeric(12,4),
    total_approved numeric(12,2) generated always as (quantity * unit_price) stored,
    total_billed numeric(12,2) generated always as (coalesce(billed_quantity, quantity) * coalesce(billed_price, unit_price)) stored,
    match_status varchar(50) not null default 'pending',
    sort_order integer not null default 0,
    constraint purchase_order_items_unit_type_check
        check (unit_type in ('sqft', 'sqm', 'linear_ft', 'linear_m', 'piece', 'box', 'roll', 'gallon', 'liter', 'slab'))
);

create table vendor_bills (
    id uuid primary key default gen_random_uuid(),
    bill_number varchar(50) not null unique,
    purchase_order_id uuid references purchase_orders(id) on delete set null,
    supplier_id uuid not null references suppliers(id) on delete restrict,
    bill_total numeric(12,2) not null,
    po_total numeric(12,2),
    variance numeric(12,2) generated always as (bill_total - coalesce(po_total, bill_total)) stored,
    has_mismatch boolean generated always as ((po_total is not null) and (bill_total <> po_total)) stored,
    payment_status varchar(30) not null default 'unpaid',
    paid_to_date numeric(12,2) not null default 0,
    balance_due numeric(12,2) generated always as (bill_total - paid_to_date) stored,
    issue_date date not null default current_date,
    due_date date not null,
    days_overdue integer not null default 0,
    approved_by uuid references users(id) on delete set null,
    notes text,
    created_at timestamptz not null default now()
);

create table vendor_bill_items (
    id uuid primary key default gen_random_uuid(),
    vendor_bill_id uuid not null references vendor_bills(id) on delete cascade,
    po_item_id uuid references purchase_order_items(id) on delete set null,
    product_id uuid references products(id) on delete set null,
    description varchar(500) not null,
    billed_qty numeric(12,4) not null,
    billed_unit varchar(20) not null default 'slab',
    bill_sqft numeric(12,4),
    bill_total numeric(12,2) not null,
    po_total numeric(12,2),
    match_status varchar(50) not null default 'pending',
    sort_order integer not null default 0,
    constraint vendor_bill_items_billed_unit_check
        check (billed_unit in ('sqft', 'sqm', 'linear_ft', 'linear_m', 'piece', 'box', 'roll', 'gallon', 'liter', 'slab'))
);

create table job_stages (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id) on delete cascade,
    stage_type varchar(50) not null,
    status varchar(50) not null default 'pending',
    assigned_to uuid references users(id) on delete set null,
    scheduled_date date,
    scheduled_time time,
    started_at timestamptz,
    completed_at timestamptz,
    notes text,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    constraint job_stages_stage_type_check
        check (stage_type in ('template', 'fabrication', 'installation', 'delivery', 'qc'))
);

create table job_packets (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id) on delete cascade,
    status varchar(50) not null default 'draft',
    sent_to varchar(255),
    sent_at timestamptz,
    acknowledged_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table job_packet_checklist_items (
    id uuid primary key default gen_random_uuid(),
    packet_id uuid not null references job_packets(id) on delete cascade,
    category varchar(100),
    title varchar(255) not null,
    description text,
    status varchar(50) not null default 'pending',
    is_required boolean not null default true,
    completed_by uuid references users(id) on delete set null,
    completed_at timestamptz,
    completion_note text,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table schedule_entries (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id) on delete cascade,
    job_stage_id uuid references job_stages(id) on delete set null,
    assigned_to uuid references users(id) on delete set null,
    scheduled_date date not null,
    start_time time,
    end_time time,
    color_hex varchar(7) not null default '#E8F4FD',
    address text,
    client_name varchar(255),
    notes text,
    created_at timestamptz not null default now()
);

create table installations (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete restrict,
    lead_installer uuid references users(id) on delete set null,
    status varchar(50) not null default 'scheduled',
    scheduled_date date,
    scheduled_time time,
    completed_at timestamptz,
    address text,
    access_notes text,
    completion_notes text,
    client_signature_url varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table installation_crew (
    installation_id uuid not null references installations(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    primary key (installation_id, user_id)
);

create table countertop_drawings (
    id uuid primary key default gen_random_uuid(),
    bid_id uuid references bids(id) on delete cascade,
    quote_id uuid references quotes(id) on delete cascade,
    order_id uuid references orders(id) on delete cascade,
    job_id uuid references jobs(id) on delete cascade,
    client_id uuid references clients(id) on delete set null,
    client_name varchar(255) not null,
    project_name varchar(255),
    room_type varchar(50),
    subdivision varchar(255),
    installation_type varchar(50),
    project_manager_id uuid references users(id) on delete set null,
    version integer not null default 1,
    total_area_sqft numeric(10,4),
    total_edge_cm numeric(10,4),
    total_cutouts integer not null default 0,
    material_cost numeric(12,2),
    fabrication_cost numeric(12,2),
    installation_cost numeric(12,2),
    total_price numeric(12,2),
    waste_factor_pct numeric(5,2),
    material_needed_sqft numeric(10,4),
    install_notes text,
    client_notes text,
    internal_notes text,
    pipeline_status jsonb not null default '{}'::jsonb,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint countertop_drawings_installation_type_check
        check (installation_type is null or installation_type in ('spec_home', 'custom', 'commercial', 'multifamily', 'repair')),
    constraint countertop_drawings_single_parent_check
        check (num_nonnulls(bid_id, quote_id, order_id, job_id) = 1)
);

create table drawing_pieces (
    id uuid primary key default gen_random_uuid(),
    drawing_id uuid not null references countertop_drawings(id) on delete cascade,
    sort_order integer not null default 0,
    piece_name varchar(150),
    width_cm numeric(10,2),
    height_cm numeric(10,2),
    area_sqft numeric(10,4),
    piece_geometry geometry(Geometry, 0),
    metadata_json jsonb
);

create table drawing_versions (
    id uuid primary key default gen_random_uuid(),
    drawing_id uuid not null references countertop_drawings(id) on delete cascade,
    version_no integer not null,
    change_summary text,
    created_at timestamptz not null default now(),
    created_by uuid references users(id) on delete set null,
    unique (drawing_id, version_no)
);

create table drawing_images (
    id uuid primary key default gen_random_uuid(),
    drawing_id uuid not null references countertop_drawings(id) on delete cascade,
    image_url varchar(500) not null,
    image_type varchar(50),
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table warehouse_racks (
    id uuid primary key default gen_random_uuid(),
    warehouse_id uuid not null references warehouses(id) on delete cascade,
    rack_code varchar(100) not null,
    description text,
    is_full boolean not null default false,
    unique (warehouse_id, rack_code)
);

create table slabs (
    id uuid primary key default gen_random_uuid(),
    slab_number varchar(100) not null unique,
    product_id uuid references products(id) on delete set null,
    supplier_id uuid references suppliers(id) on delete set null,
    status varchar(50) not null default 'available',
    width_cm numeric(8,2) not null,
    height_cm numeric(8,2) not null,
    thickness_mm numeric(6,2) not null default 20,
    area_sqft numeric(10,4) generated always as ((width_cm / 30.48) * (height_cm / 30.48)) stored,
    material_name varchar(255),
    material_type varchar(100),
    material_type_label varchar(100),
    finish varchar(100),
    thickness_label varchar(20),
    color varchar(100),
    lot_number varchar(100),
    bundle_number varchar(100),
    warehouse_id uuid references warehouses(id) on delete set null,
    shelf_location varchar(100),
    purchase_price numeric(12,2),
    cost_per_sqft numeric(12,4),
    weight_kg numeric(8,3),
    received_at date not null default current_date,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    rack_id uuid references warehouse_racks(id) on delete set null,
    parent_slab_id uuid references slabs(id),
    is_remnant boolean not null default false
);

create table slab_visual_data (
    id uuid primary key default gen_random_uuid(),
    slab_id uuid not null references slabs(id) on delete cascade,
    image_url varchar(500),
    thumbnail_url varchar(500),
    is_calibrated boolean not null default false,
    has_defects boolean not null default false,
    defect_count integer not null default 0,
    image_metadata jsonb not null default '{}'::jsonb,
    calibration_data jsonb not null default '{}'::jsonb,
    outline_geometry geometry(Geometry, 0),
    calibrated_by uuid references users(id) on delete set null,
    calibrated_at timestamptz,
    uploaded_by uuid references users(id) on delete set null,
    uploaded_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    pixel_to_mm_ratio numeric(10,6),
    rectified_image_url text
);

create table slab_defects (
    id uuid primary key default gen_random_uuid(),
    slab_visual_id uuid not null references slab_visual_data(id) on delete cascade,
    defect_geometry geometry(Geometry, 0) not null,
    severity varchar(20) not null,
    created_at timestamptz not null default now(),
    constraint slab_defects_severity_check
        check (severity in ('crack', 'fissure', 'spot', 'other'))
);

create table slab_layouts (
    id uuid primary key default gen_random_uuid(),
    slab_id uuid not null references slabs(id) on delete restrict,
    job_id uuid not null references jobs(id) on delete restrict,
    yield_pct numeric(5,2),
    waste_sqft numeric(10,4),
    cut_config jsonb not null default '{}'::jsonb,
    dxf jsonb not null default '{}'::jsonb,
    dxf_export_url varchar(500),
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now()
);

create table layout_pieces (
    id uuid primary key default gen_random_uuid(),
    layout_id uuid not null references slab_layouts(id) on delete cascade,
    sort_order integer not null default 0,
    piece_name varchar(150),
    width_cm numeric(10,2),
    height_cm numeric(10,2),
    area_sqft numeric(10,4),
    piece_geometry geometry(Geometry, 0),
    metadata_json jsonb
);

create table slab_remnants (
    id uuid primary key default gen_random_uuid(),
    slab_id uuid not null references slabs(id) on delete cascade,
    job_id uuid references jobs(id) on delete set null,
    status varchar(30) not null default 'available',
    width_cm numeric(8,2) not null,
    height_cm numeric(8,2) not null,
    area_sqft numeric(10,4) generated always as ((width_cm / 30.48) * (height_cm / 30.48)) stored,
    shelf_location varchar(100),
    remnant_geometry geometry(Geometry, 0),
    notes text,
    created_at timestamptz not null default now()
);

create table slab_history (
    id uuid primary key default gen_random_uuid(),
    slab_id uuid not null references slabs(id) on delete cascade,
    action varchar(100) not null,
    job_id uuid references jobs(id) on delete set null,
    performed_by uuid references users(id) on delete set null,
    notes text,
    occurred_at timestamptz not null default now()
);

create table vein_groups (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    description text,
    created_at timestamptz not null default now()
);

create table vein_group_slabs (
    vein_group_id uuid not null references vein_groups(id) on delete cascade,
    slab_id uuid not null references slabs(id) on delete cascade,
    primary key (vein_group_id, slab_id)
);

create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete set null,
    action varchar(20) not null,
    entity_name varchar(50) not null,
    entity_id uuid not null,
    old_values jsonb,
    new_values jsonb,
    ip_address varchar(45),
    created_at timestamptz not null default now()
);

-- 1. CONFIGURACIÓN LOCAL DEL SISTEMA
-- Guarda qué módulos tiene activos este cliente y su versión actual
CREATE TABLE IF NOT EXISTS system_config (
    config_key character varying(50) PRIMARY KEY,
    config_value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. PERFILES DE USUARIO LOCALES
-- IMPORTANTE: El ID debe ser el mismo UUID que viene de public.master_users
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY, 
    full_name character varying(255) NOT NULL,
    phone character varying(50),
    avatar_url text,
    role_id uuid, -- Relación con una tabla de roles local si la tienes
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. HISTORIAL DE ACTUALIZACIONES
-- Para saber qué versiones de la app de escritorio ha pasado este cliente
CREATE TABLE IF NOT EXISTS version_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    version_number character varying(20) NOT NULL,
    installed_at timestamp with time zone DEFAULT now(),
    status character varying(20) DEFAULT 'success', -- 'success', 'failed'
    notes text
);

-- 4. LOGS DE ACTIVIDAD (Opcional pero recomendado para ERP)
-- Para saber quién hizo qué dentro de este esquema
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    action text NOT NULL,
    table_name varchar(50),
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);



alter table order_items
    add constraint order_items_slab_id_fkey
    foreign key (slab_id) references slabs(id) on delete set null;

alter table inventory_movements
    add constraint inventory_movements_order_id_fkey
    foreign key (order_id) references orders(id) on delete set null;

alter table inventory_movements
    add constraint inventory_movements_order_item_id_fkey
    foreign key (order_item_id) references order_items(id) on delete set null;

alter table inventory_movements
    add constraint inventory_movements_purchase_order_id_fkey
    foreign key (purchase_order_id) references purchase_orders(id) on delete set null;

alter table inventory_movements
    add constraint inventory_movements_purchase_order_item_id_fkey
    foreign key (purchase_order_item_id) references purchase_order_items(id) on delete set null;

alter table inventory_movements
    add constraint inventory_movements_job_id_fkey
    foreign key (job_id) references jobs(id) on delete set null;

alter table inventory_movements
    add constraint inventory_movements_vendor_bill_id_fkey
    foreign key (vendor_bill_id) references vendor_bills(id) on delete set null;

alter table document_tax_lines
    add constraint document_tax_lines_bid_id_fkey
    foreign key (bid_id) references bids(id) on delete cascade;

alter table document_tax_lines
    add constraint document_tax_lines_quote_id_fkey
    foreign key (quote_id) references quotes(id) on delete cascade;

alter table document_tax_lines
    add constraint document_tax_lines_order_id_fkey
    foreign key (order_id) references orders(id) on delete cascade;

alter table document_tax_lines
    add constraint document_tax_lines_invoice_id_fkey
    foreign key (invoice_id) references invoices(id) on delete cascade;

alter table document_tax_lines
    add constraint document_tax_lines_purchase_order_id_fkey
    foreign key (purchase_order_id) references purchase_orders(id) on delete cascade;

alter table document_tax_lines
    add constraint document_tax_lines_vendor_bill_id_fkey
    foreign key (vendor_bill_id) references vendor_bills(id) on delete cascade;

alter table document_payments
    add constraint document_payments_invoice_id_fkey
    foreign key (invoice_id) references invoices(id) on delete cascade;

alter table document_payments
    add constraint document_payments_order_id_fkey
    foreign key (order_id) references orders(id) on delete cascade;

alter table document_payments
    add constraint document_payments_purchase_order_id_fkey
    foreign key (purchase_order_id) references purchase_orders(id) on delete cascade;

alter table document_payments
    add constraint document_payments_vendor_bill_id_fkey
    foreign key (vendor_bill_id) references vendor_bills(id) on delete cascade;

alter table order_items
    add constraint order_items_purchase_order_id_fkey
    foreign key (purchase_order_id) references purchase_orders(id) on delete set null;

alter table purchase_order_items
    add constraint purchase_order_items_slab_id_fkey
    foreign key (slab_id) references slabs(id) on delete set null;

alter table job_alerts
    add constraint job_alerts_purchase_order_id_fkey
    foreign key (purchase_order_id) references purchase_orders(id) on delete set null;

alter table job_materials
    add constraint job_materials_slab_id_fkey
    foreign key (slab_id) references slabs(id) on delete set null;

create index idx_role_permissions_role_id on role_permissions(role_id);
create index idx_product_attributes_category_id on product_attributes(category_id);
create index idx_product_attribute_values_product_id on product_attribute_values(product_id);
create index idx_products_category_id on products(category_id);
create index idx_products_supplier_id on products(supplier_id);
create index idx_inventory_product_warehouse on inventory(product_id, warehouse_id);
create index idx_inventory_movements_product_id on inventory_movements(product_id);
create index idx_inventory_movements_warehouse_id on inventory_movements(warehouse_id);
create index idx_inventory_movements_order_id on inventory_movements(order_id);
create index idx_inventory_movements_order_item_id on inventory_movements(order_item_id);
create index idx_inventory_movements_purchase_order_id on inventory_movements(purchase_order_id);
create index idx_inventory_movements_purchase_order_item_id on inventory_movements(purchase_order_item_id);
create index idx_inventory_movements_job_id on inventory_movements(job_id);
create index idx_inventory_movements_vendor_bill_id on inventory_movements(vendor_bill_id);
create index idx_bids_client_id on bids(client_id);
create index idx_bid_items_bid_id on bid_items(bid_id);
create index idx_quotes_bid_id on quotes(bid_id);
create index idx_quote_items_quote_id on quote_items(quote_id);
create index idx_orders_client_id on orders(client_id);
create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_purchase_order_id on order_items(purchase_order_id);
create index idx_document_tax_lines_bid_id on document_tax_lines(bid_id);
create index idx_document_tax_lines_quote_id on document_tax_lines(quote_id);
create index idx_document_tax_lines_order_id on document_tax_lines(order_id);
create index idx_document_tax_lines_invoice_id on document_tax_lines(invoice_id);
create index idx_document_tax_lines_purchase_order_id on document_tax_lines(purchase_order_id);
create index idx_document_tax_lines_vendor_bill_id on document_tax_lines(vendor_bill_id);
create index idx_document_payments_invoice_id on document_payments(invoice_id);
create index idx_document_payments_order_id on document_payments(order_id);
create index idx_document_payments_purchase_order_id on document_payments(purchase_order_id);
create index idx_document_payments_vendor_bill_id on document_payments(vendor_bill_id);
create index idx_job_alerts_job_id on job_alerts(job_id);
create index idx_job_materials_job_id on job_materials(job_id);
create index idx_job_packets_job_id on job_packets(job_id);
create index idx_job_packet_checklist_items_packet_id on job_packet_checklist_items(packet_id);
create index idx_purchase_orders_supplier_id on purchase_orders(supplier_id);
create index idx_purchase_order_items_purchase_order_id on purchase_order_items(purchase_order_id);
create index idx_vendor_bills_purchase_order_id on vendor_bills(purchase_order_id);
create index idx_vendor_bill_items_vendor_bill_id on vendor_bill_items(vendor_bill_id);
create index idx_jobs_order_id on jobs(order_id);
create index idx_job_stages_job_id on job_stages(job_id);
create index idx_schedule_entries_job_id on schedule_entries(job_id);
create index idx_countertop_drawings_client_id on countertop_drawings(client_id);
create index idx_countertop_drawings_bid_id on countertop_drawings(bid_id);
create index idx_countertop_drawings_quote_id on countertop_drawings(quote_id);
create index idx_countertop_drawings_order_id on countertop_drawings(order_id);
create index idx_countertop_drawings_job_id on countertop_drawings(job_id);
create index idx_drawing_pieces_drawing_id on drawing_pieces(drawing_id);
create index idx_drawing_versions_drawing_id on drawing_versions(drawing_id);
create index idx_drawing_images_drawing_id on drawing_images(drawing_id);
create index idx_slabs_product_id on slabs(product_id);
create index idx_slab_visual_data_slab_id on slab_visual_data(slab_id);
create index idx_slab_defects_visual_id on slab_defects(slab_visual_id);
create index idx_slab_layouts_slab_id on slab_layouts(slab_id);
create index idx_layout_pieces_layout_id on layout_pieces(layout_id);
create index idx_slab_remnants_slab_id on slab_remnants(slab_id);
create index idx_slab_history_slab_id on slab_history(slab_id);
create index idx_vein_group_slabs_slab_id on vein_group_slabs(slab_id);
create index idx_audit_logs_entity on audit_logs(entity_name, entity_id);

create index idx_bids_specifications_gin on bids using gin (specifications);
create index idx_order_items_specifications_gin on order_items using gin (specifications);
create index idx_countertop_drawings_pipeline_status_gin on countertop_drawings using gin (pipeline_status);
create index idx_slab_visual_data_calibration_gin on slab_visual_data using gin (calibration_data);
create index idx_slab_layouts_cut_config_gin on slab_layouts using gin (cut_config);
create index idx_slab_layouts_dxf_gin on slab_layouts using gin (dxf);
create index idx_drawing_pieces_geometry_gist on drawing_pieces using gist (piece_geometry) where piece_geometry is not null;
create index idx_slab_visual_data_outline_gist on slab_visual_data using gist (outline_geometry) where outline_geometry is not null;
create index idx_slab_defects_geometry_gist on slab_defects using gist (defect_geometry);
create index idx_layout_pieces_geometry_gist on layout_pieces using gist (piece_geometry) where piece_geometry is not null;
create index idx_slab_remnants_geometry_gist on slab_remnants using gist (remnant_geometry) where remnant_geometry is not null;

create or replace function update_modified_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function sync_slab_visual_flags()
returns trigger
language plpgsql
as $$
declare
    target_visual_id uuid;
begin
    target_visual_id := coalesce(new.slab_visual_id, old.slab_visual_id);

    update slab_visual_data svd
    set defect_count = (
            select count(*)
            from slab_defects sd
            where sd.slab_visual_id = target_visual_id
        ),
        has_defects = exists (
            select 1
            from slab_defects sd
            where sd.slab_visual_id = target_visual_id
        ),
        updated_at = now()
    where svd.id = target_visual_id;

    return null;
end;
$$;

create or replace function refresh_bid_tax_cache(target_bid_id uuid)
returns void
language plpgsql
as $$
begin
    if target_bid_id is null then
        return;
    end if;

    update bids
    set tax_total_cache = coalesce((
            select sum(tax_amount)
            from document_tax_lines
            where bid_id = target_bid_id
        ), 0)
    where id = target_bid_id;
end;
$$;

create or replace function refresh_quote_tax_cache(target_quote_id uuid)
returns void
language plpgsql
as $$
begin
    if target_quote_id is null then
        return;
    end if;

    update quotes
    set tax_total_cache = coalesce((
            select sum(tax_amount)
            from document_tax_lines
            where quote_id = target_quote_id
        ), 0)
    where id = target_quote_id;
end;
$$;

create or replace function refresh_order_tax_cache(target_order_id uuid)
returns void
language plpgsql
as $$
begin
    if target_order_id is null then
        return;
    end if;

    update orders
    set tax_total_cache = coalesce((
            select sum(tax_amount)
            from document_tax_lines
            where order_id = target_order_id
        ), 0)
    where id = target_order_id;
end;
$$;

create or replace function sync_document_tax_caches()
returns trigger
language plpgsql
as $$
declare
    old_bid_id uuid;
    new_bid_id uuid;
    old_quote_id uuid;
    new_quote_id uuid;
    old_order_id uuid;
    new_order_id uuid;
begin
    old_bid_id := case when tg_op in ('UPDATE', 'DELETE') then old.bid_id else null end;
    new_bid_id := case when tg_op in ('INSERT', 'UPDATE') then new.bid_id else null end;
    old_quote_id := case when tg_op in ('UPDATE', 'DELETE') then old.quote_id else null end;
    new_quote_id := case when tg_op in ('INSERT', 'UPDATE') then new.quote_id else null end;
    old_order_id := case when tg_op in ('UPDATE', 'DELETE') then old.order_id else null end;
    new_order_id := case when tg_op in ('INSERT', 'UPDATE') then new.order_id else null end;

    perform refresh_bid_tax_cache(old_bid_id);
    perform refresh_bid_tax_cache(new_bid_id);

    perform refresh_quote_tax_cache(old_quote_id);
    perform refresh_quote_tax_cache(new_quote_id);

    perform refresh_order_tax_cache(old_order_id);
    perform refresh_order_tax_cache(new_order_id);

    return null;
end;
$$;

create or replace function refresh_invoice_paid_to_date(target_invoice_id uuid)
returns void
language plpgsql
as $$
begin
    if target_invoice_id is null then
        return;
    end if;

    update invoices
    set paid_to_date = coalesce((
            select sum(amount)
            from document_payments
            where invoice_id = target_invoice_id
        ), 0)
    where id = target_invoice_id;
end;
$$;

create or replace function refresh_order_amount_paid(target_order_id uuid)
returns void
language plpgsql
as $$
begin
    if target_order_id is null then
        return;
    end if;

    update orders
    set amount_paid = coalesce((
            select sum(amount)
            from document_payments
            where order_id = target_order_id
        ), 0)
    where id = target_order_id;
end;
$$;

create or replace function refresh_purchase_order_amount_paid(target_purchase_order_id uuid)
returns void
language plpgsql
as $$
begin
    if target_purchase_order_id is null then
        return;
    end if;

    update purchase_orders
    set amount_paid = coalesce((
            select sum(amount)
            from document_payments
            where purchase_order_id = target_purchase_order_id
        ), 0)
    where id = target_purchase_order_id;
end;
$$;

create or replace function refresh_vendor_bill_paid_to_date(target_vendor_bill_id uuid)
returns void
language plpgsql
as $$
begin
    if target_vendor_bill_id is null then
        return;
    end if;

    update vendor_bills
    set paid_to_date = coalesce((
            select sum(amount)
            from document_payments
            where vendor_bill_id = target_vendor_bill_id
        ), 0)
    where id = target_vendor_bill_id;
end;
$$;

create or replace function sync_document_payment_caches()
returns trigger
language plpgsql
as $$
declare
    old_invoice_id uuid;
    new_invoice_id uuid;
    old_order_id uuid;
    new_order_id uuid;
    old_purchase_order_id uuid;
    new_purchase_order_id uuid;
    old_vendor_bill_id uuid;
    new_vendor_bill_id uuid;
begin
    old_invoice_id := case when tg_op in ('UPDATE', 'DELETE') then old.invoice_id else null end;
    new_invoice_id := case when tg_op in ('INSERT', 'UPDATE') then new.invoice_id else null end;
    old_order_id := case when tg_op in ('UPDATE', 'DELETE') then old.order_id else null end;
    new_order_id := case when tg_op in ('INSERT', 'UPDATE') then new.order_id else null end;
    old_purchase_order_id := case when tg_op in ('UPDATE', 'DELETE') then old.purchase_order_id else null end;
    new_purchase_order_id := case when tg_op in ('INSERT', 'UPDATE') then new.purchase_order_id else null end;
    old_vendor_bill_id := case when tg_op in ('UPDATE', 'DELETE') then old.vendor_bill_id else null end;
    new_vendor_bill_id := case when tg_op in ('INSERT', 'UPDATE') then new.vendor_bill_id else null end;

    perform refresh_invoice_paid_to_date(old_invoice_id);
    perform refresh_invoice_paid_to_date(new_invoice_id);

    perform refresh_order_amount_paid(old_order_id);
    perform refresh_order_amount_paid(new_order_id);

    perform refresh_purchase_order_amount_paid(old_purchase_order_id);
    perform refresh_purchase_order_amount_paid(new_purchase_order_id);

    perform refresh_vendor_bill_paid_to_date(old_vendor_bill_id);
    perform refresh_vendor_bill_paid_to_date(new_vendor_bill_id);

    return null;
end;
$$;

create trigger trg_users_updated_at
before update on users
for each row
execute function update_modified_column();

create trigger trg_roles_updated_at
before update on roles
for each row
execute function update_modified_column();

create trigger trg_clients_updated_at
before update on clients
for each row
execute function update_modified_column();

create trigger trg_product_categories_updated_at
before update on product_categories
for each row
execute function update_modified_column();

create trigger trg_products_updated_at
before update on products
for each row
execute function update_modified_column();

create trigger trg_bids_updated_at
before update on bids
for each row
execute function update_modified_column();

create trigger trg_quotes_updated_at
before update on quotes
for each row
execute function update_modified_column();

create trigger trg_orders_updated_at
before update on orders
for each row
execute function update_modified_column();

create trigger trg_jobs_updated_at
before update on jobs
for each row
execute function update_modified_column();

create trigger trg_job_packets_updated_at
before update on job_packets
for each row
execute function update_modified_column();

create trigger trg_job_packet_checklist_items_updated_at
before update on job_packet_checklist_items
for each row
execute function update_modified_column();

create trigger trg_installations_updated_at
before update on installations
for each row
execute function update_modified_column();

create trigger trg_countertop_drawings_updated_at
before update on countertop_drawings
for each row
execute function update_modified_column();

create trigger trg_purchase_orders_updated_at
before update on purchase_orders
for each row
execute function update_modified_column();

create trigger trg_slabs_updated_at
before update on slabs
for each row
execute function update_modified_column();

create trigger trg_slab_visual_data_updated_at
before update on slab_visual_data
for each row
execute function update_modified_column();

create trigger trg_slab_defects_after_insert
after insert on slab_defects
for each row
execute function sync_slab_visual_flags();

create trigger trg_slab_defects_after_update
after update on slab_defects
for each row
execute function sync_slab_visual_flags();

create trigger trg_slab_defects_after_delete
after delete on slab_defects
for each row
execute function sync_slab_visual_flags();

create trigger trg_document_tax_lines_after_insert
after insert on document_tax_lines
for each row
execute function sync_document_tax_caches();

create trigger trg_document_tax_lines_after_update
after update on document_tax_lines
for each row
execute function sync_document_tax_caches();

create trigger trg_document_tax_lines_after_delete
after delete on document_tax_lines
for each row
execute function sync_document_tax_caches();

create trigger trg_document_payments_after_insert
after insert on document_payments
for each row
execute function sync_document_payment_caches();

create trigger trg_document_payments_after_update
after update on document_payments
for each row
execute function sync_document_payment_caches();

create trigger trg_document_payments_after_delete
after delete on document_payments
for each row
execute function sync_document_payment_caches();
