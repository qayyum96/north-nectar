-- Undoing an import restores "no unit cost" when the size had none before the import (the
-- previous version kept the imported cost).
create or replace function public.admin_undo_import(p_import uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_import public.imports%rowtype;
  m record;
  v_stock integer;
  v_reserved integer;
  v_cost integer;
  v_variants text[];
begin
  if not public.has_role('{owner,manager}') then raise exception 'NOT_ALLOWED'; end if;
  select * into v_import from public.imports where id = p_import for update;
  if not found then raise exception 'IMPORT_NOT_FOUND'; end if;
  if v_import.status = 'undone' then return; end if;
  if v_import.kind = 'products' then raise exception 'CANNOT_UNDO_PRODUCTS'; end if;

  select array_agg(distinct variant_id) into v_variants from public.stock_movements where import_id = p_import;

  for m in select variant_id, sum(quantity)::integer as qty from public.stock_movements
           where import_id = p_import group by variant_id order by variant_id loop
    select stock, reserved, unit_cost into v_stock, v_reserved, v_cost from public.product_variants
      where id = m.variant_id for update;
    if v_stock - m.qty < v_reserved or v_stock - m.qty < 0 then
      raise exception 'STOCK_ALREADY_USED:%', m.variant_id;
    end if;
    if m.qty <> 0 then
      update public.product_variants set stock = stock - m.qty where id = m.variant_id;
      insert into public.stock_movements
        (variant_id, type, quantity, balance_after, unit_cost, reference, reason, actor_id, import_id)
      values (m.variant_id, 'adjustment', -m.qty, v_stock - m.qty, v_cost, 'Import undone',
        'Reverses an undone import', auth.uid(), p_import);
    end if;
  end loop;

  delete from public.purchases where import_id = p_import;

  if v_import.kind = 'purchases' and v_variants is not null then
    update public.product_variants v set unit_cost = coalesce((
      select l.unit_cost from public.purchase_lines l join public.purchases p on p.id = l.purchase_id
      where l.variant_id = v.id order by p.purchase_date desc, p.created_at desc limit 1
    ), (
      select s.unit_cost from public.stock_movements s
      where s.variant_id = v.id and s.unit_cost is not null
        and s.import_id is distinct from p_import
      order by s.created_at desc limit 1
    ))
    where v.id = any (v_variants);
  end if;

  update public.imports set status = 'undone', undone_at = now() where id = p_import;
end $$;
revoke all on function public.admin_undo_import(uuid) from public, anon;
grant execute on function public.admin_undo_import(uuid) to authenticated;
