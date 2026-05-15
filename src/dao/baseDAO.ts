import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';

// This is the type for the query filters
export type QueryFilters<T> = Partial<Record<keyof T, T[keyof T]>>;

// This is the type for the paginated data
export interface Paginated<T> {
  data: T[];
  count: number;
}

// This is the base DAO class
export class BaseDAO<Row, Insert, Update> {
  protected table: string;

  constructor(table: string) {
    this.table = table;
  }

  // This is the findById method
  async findById(id: string | number) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`[${this.table}] findById: ${error.message}`);
    return data as Row;
  }

  // This is the list method
  async list(params?: {
    filters?: QueryFilters<Row>;
    limit?: number;
    offset?: number;
    orderBy?: { column: keyof Row; ascending?: boolean };
  }): Promise<Paginated<Row>> {
    const { filters = {}, limit = 20, offset = 0, orderBy } = params ?? {};

    let query = supabase.from(this.table).select('*', { count: 'exact' });

    // filtros simples igualdad
    for (const [k, v] of Object.entries(filters)) {
      // @ts-ignore - simplificado para igualdad
      query = query.eq(k as keyof Row, v);
    }

    if (orderBy) {
      query = query.order(orderBy.column as string, {
        ascending: orderBy.ascending ?? true,
      });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(`[${this.table}] list: ${error.message}`);

    return { data: data ?? [], count: count ?? 0 };
  }

  // This is the create method
  async create(payload: Insert) {
    const { data, error } = await supabase
      .from(this.table)
      .insert([payload] as any)
      .select('*')
      .single();
    if (error) throw new Error(`[${this.table}] create: ${error.message}`);
    return data as Row;
  }

  // This is the updateById method
  async updateById(id: string | number, payload: Update) {
    const updateData: any = payload;
    const { data, error } = await supabase
      .from(this.table)
      // @ts-ignore 
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`[${this.table}] updateById: ${error.message}`);
    return data as Row;
  }

  async softDeleteById(id: string | number) {
    const { error } = await supabase
      .from(this.table)
      // @ts-ignore
      .update({ is_deleted: true })
      .eq('id', id);
    if (error) throw new Error(`[${this.table}] softDeleteById: ${error.message}`);
    console.log("Soft delete id", id, error);
    return true;
  }

  async deleteByComposite(userId: string | number, movieId: string | number) {
    const { error, count } = await supabase
      .from(this.table)
      // @ts-ignore
      .delete({count: 'exact'})
      .eq('userId', userId)
      .eq('movieId', movieId);
    if (error) throw new Error(`[${this.table}] deleteByComposite: ${error.message}`);
    return count! > 0;
  }

  // This is the deleteById method
  async deleteById(id: string | number) {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw new Error(`[${this.table}] deleteById: ${error.message}`);
    return true;
  }
}
