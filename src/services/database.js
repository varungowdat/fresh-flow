import { getSupabaseClient } from "../lib/supabaseClient";

/** Fetch all active deals (customer-facing view) */
export async function listActiveDeals() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("active_deals")
    .select("*")
    .order("days_left", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetch all products for a specific shop (shopkeeper dashboard) */
export async function listProducts(shopId) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("products")
    .select("*, reservations(id, customer_name, expires_at, status)")
    .order("expiry_date", { ascending: true });

  if (shopId) query = query.eq("shop_id", shopId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Create a new shop. If one already exists with same owner+name, returns existing. */
export async function findOrCreateShop(shop) {
  if (!shop || !shop.owner_name || !shop.shop_name) {
    throw new Error("owner_name and shop_name are required");
  }
  const supabase = getSupabaseClient();

  // Try to find existing shop first
  const { data: existing } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_name", shop.owner_name)
    .eq("shop_name", shop.shop_name)
    .maybeSingle();

  if (existing) return existing;

  // Create new shop
  const { data, error } = await supabase
    .from("shops")
    .insert(shop)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Create a new customer. If one already exists with same name, returns existing. */
export async function findOrCreateCustomer(customer) {
  if (!customer || !customer.name) {
    throw new Error("customer name is required");
  }
  const supabase = getSupabaseClient();

  // Try to find existing customer first
  const { data: existing } = await supabase
    .from("customers")
    .select("*")
    .eq("name", customer.name)
    .maybeSingle();

  if (existing) {
    // Optionally update location if provided and different
    if (customer.latitude && customer.longitude) {
       const { error: updateError } = await supabase.from("customers").update({
          latitude: customer.latitude,
          longitude: customer.longitude,
          pin_code: customer.pin_code
       }).eq("id", existing.id);
       if (updateError) {
         console.error("Failed to update customer location:", updateError);
       }
    }
    return existing;
  }

  // Create new customer
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** @deprecated Use findOrCreateShop instead */
export async function createShop(shop) {
  return findOrCreateShop(shop);
}

/** Insert a new near-expiry product */
export async function createProduct(product) {
  if (!product || !product.shop_id || !product.name || !product.expiry_date || product.mrp == null || product.discount == null) {
    throw new Error("Missing required fields for product");
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Reserve a product for a customer (20-min window) */
export async function reserveProduct(productId, customerName, customerPhone, customerId) {
  if (!productId) throw new Error("productId is required");
  const supabase = getSupabaseClient();

  // Mark product as reserved
  const { error: updateError } = await supabase
    .from("products")
    .update({ is_reserved: true })
    .eq("id", productId);

  if (updateError) throw updateError;

  // Insert reservation record
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      product_id: productId,
      customer_name: customerName || "Customer",
      customer_phone: customerPhone || "",
      customer_id: customerId || null,
    })
    .select()
    .single();

  if (error) {
    // Rollback product reservation status if reservation insert fails
    await supabase.from("products").update({ is_reserved: false }).eq("id", productId);
    throw error;
  }
  return data;
}

/** Release / cancel an active reservation */
export async function releaseReservation(productId) {
  if (!productId) throw new Error("productId is required");
  const supabase = getSupabaseClient();

  // Expire the active reservation for this product
  const { error: resError } = await supabase
    .from("reservations")
    .update({ status: "released" })
    .eq("product_id", productId)
    .eq("status", "active");

  if (resError) throw resError;

  // Un-reserve the product
  const { data, error } = await supabase
    .from("products")
    .update({ is_reserved: false })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
