-- Function to generate a random license key (hex 32 chars)
create or replace function public.generate_license_key()
returns text language sql stable as $$
    select encode(gen_random_bytes(16), 'hex');
$$;

-- Function to bind a license key to a hardware fingerprint
create or replace function public.bind_license(
    p_license_key text,
    p_fingerprint_hash text
) returns table (
    success boolean,
    message text
) language plpgsql as $$
declare
    v_lic licenses%rowtype;
begin
    -- busca a chave informada
    select * into v_lic
    from licenses
    where license_key = p_license_key
      and is_active;

    if not found then
        return query select false, 'Chave inválida ou já revogada';
    end if;

    -- se já estiver vinculada a outro hardware → bloqueia
    if v_lic.fingerprint_hash <> '' and v_lic.fingerprint_hash <> p_fingerprint_hash then
        return query select false, 'Esta chave já está vinculada a outro dispositivo';
    end if;

    -- atualiza o fingerprint (primeira vinculação ou reativação no mesmo aparelho)
    update licenses
       set fingerprint_hash = p_fingerprint_hash,
           updated_at       = now()
     where id = v_lic.id
     returning * into v_lic;

    return query select true, 'Chave vinculada com sucesso';
end;
$$;

-- Function to verify a license key against hardware fingerprint
create or replace function public.verify_license(
    p_license_key text,
    p_fingerprint_hash text
) returns table (
    valid boolean,
    message text
) language plpgsql as $$
declare
    v_lic licenses%rowtype;
begin
    select * into v_lic
    from licenses
    where license_key = p_license_key
      and is_active;

    if not found then
        return query select false, 'Chave inválida ou revogada';
    end if;

    if v_lic.fingerprint_hash <> p_fingerprint_hash then
        return query select false, 'Hardware não corresponde à chave';
    end if;

    return query select true, 'Licença válida';
end;
$$;
