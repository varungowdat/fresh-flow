# Supabase Setup

## 1. Create Tables

Open Supabase Dashboard, then go to SQL Editor.

Paste everything from:

```text
supabase/schema.sql
```

Click Run.

## 2. Check Local Env

The local `.env` file should have:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

Restart the dev server after changing `.env`.

## 3. Use In React

Import helpers from:

```js
import { createProduct, listActiveDeals, reserveProduct } from "./services/database";
```

Use `createProduct` in the shopkeeper upload form, `listActiveDeals` in the customer deals page, and `reserveProduct` when a customer reserves an item.

## Security Note

The policies in `supabase/schema.sql` are open for hackathon/demo speed. Before production, change them so shopkeepers can edit only their shops/products and customers can edit only their reservations.
