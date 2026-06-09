-- Table for license keys
create table if not exists licenses (
    id              uuid primary key default gen_random_uuid(),
    license_key     text not null unique,          -- chave que o usuário digita
    user_id         uuid references auth.users,    -- opcional, pode ficar nulo se quiser gerar chaves sem usuário
    fingerprint_hash text not null,                -- hash do hardware vinculado
    is_active       boolean not null default true,
    revoked_at      timestamptz,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

create index idx_licenses_key   on licenses(license_key);
create index idx_licenses_active on licenses(is_active) where is_active;
