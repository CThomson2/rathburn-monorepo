Can you write a trigger function please? Firstly for context, these three tables below have these FK relations. `items` has FK for materials and suppliers tables on their UUID PK.

There are two other relevant tables: `purchase_orders` and `purchase_order_lines`. The latter has an FK relation to purchase_orders (`po_id`), not nullable.

the purchase_orders table has an FK to `supplier_id`.

This is `purchase_order_lines` below. The trigger function I want to create is this: when a new record is created, it should look up `inventory.items`, which has both supplier_id and material_id fields for each record.

So BEFORE INSERT into `purchase_order_lines`, (where the item_id is required), if the `items` record with the inserted item_id record matching the `purchase_orders.supplier_id` and `purchase_order_lines.material_id` combination, skip - but if there is no match, INSERT a new row into `

```
create table inventory.purchase_order_lines (
  pol_id uuid not null default gen_random_uuid (),
  po_id uuid not null,
  item_id uuid not null,
  quantity numeric not null,
```

For context, these three tables below, involved in this functionality, have these FK relations. `items` has FK for materials and suppliers tables on their UUID PK.

```
select item_id, name, material_id, supplier_id from inventory.items limit 1;

-- | item_id                              | name                  | material_id                          | supplier_id                          |
-- | ------------------------------------ | --------------------- | ------------------------------------ | ------------------------------------ |
-- | 4406cd70-05c5-4c70-99b6-6d57d855aaf1 | Dimethylformamide     | c77775fe-3b29-445c-a06b-cd87063ac0a9 | fbeb5c65-e998-4739-b758-a494ddb23c5a |

select * from inventory.materials where material_id = 'c77775fe-3b29-445c-a06b-cd87063ac0a9';
-- | material_id                          | name              | chemical_group | cas_number | code |
-- | ------------------------------------ | ----------------- | -------------- | ---------- | ---- |
-- | c77775fe-3b29-445c-a06b-cd87063ac0a9 | Dimethylformamide | Gen Solvents   | 68-12-2    | DMF  |

select * from inventory.suppliers where supplier_id = 'fbeb5c65-e998-4739-b758-a494ddb23c5a';
-- | supplier_id                          | name   |
-- | ------------------------------------ | ------ |
-- | fbeb5c65-e998-4739-b758-a494ddb23c5a | Caldic |
```
