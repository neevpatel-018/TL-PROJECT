import { NextRequest, NextResponse } from "next/server";
import { mockDb, isSupabaseConfigured } from "@/lib/mock-db";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const borrowSchema = z.object({
  borrower_name: z.string().trim().min(2).max(120),
  borrower_email: z.string().trim().email(),
  project_title: z.string().trim().min(2).max(160),
  item_id: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  expected_return_date: z.string().min(1),
  notes: z.string().max(1000).optional().default(""),
  user_type: z.enum(["student", "other"]).optional().default("student"),
  enrollment_number: z.string().optional().default(""),
  course_code: z.string().optional().default(""),
  year_of_study: z.string().optional().default(""),
  faculty_name: z.string().optional().default(""),
  section_number: z.string().optional().default(""),
  other_role: z.string().optional().default(""),
  other_organization: z.string().optional().default(""),
  other_phone: z.string().optional().default(""),
  other_id_number: z.string().optional().default(""),
});

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const [{ data: items }, { data: borrows }] = await Promise.all([
        admin.from("inventory_items").select("*, stock_balances(*)").eq("is_archived", false),
        admin.from("tool_borrows").select("*").order("created_at", { ascending: false }),
      ]);

      if (items && borrows) {
        return NextResponse.json({
          tools: (items as Array<{
            id: string;
            name: string;
            sku: string;
            category: string;
            unit: string;
            item_type: "consumable" | "reusable" | "machine";
            location: string;
            stock_balances?: Array<{ quantity_on_hand: number; quantity_reserved: number }>;
          }>).map((i) => {
            const stock = i.stock_balances?.[0] || { quantity_on_hand: 0, quantity_reserved: 0 };
            return {
              id: i.id,
              name: i.name,
              sku: i.sku,
              category: i.category,
              unit: i.unit,
              item_type: i.item_type,
              location: i.location,
              on_hand: stock.quantity_on_hand,
              reserved: stock.quantity_reserved,
              available: Math.max(0, stock.quantity_on_hand - stock.quantity_reserved),
            };
          }),
          borrows,
        });
      }
    } catch {
      // Fall through to mock store
    }
  }

  const inventory = mockDb.getInventory().filter((item) => !item.is_archived);
  const borrows = mockDb.getToolBorrows();
  return NextResponse.json({
    tools: inventory.map((i) => {
      const stock = i.stock_balances[0] || { quantity_on_hand: 0, quantity_reserved: 0 };
      return {
        id: i.id,
        name: i.name,
        sku: i.sku,
        category: i.category,
        unit: i.unit,
        item_type: i.item_type,
        location: i.location,
        on_hand: stock.quantity_on_hand,
        reserved: stock.quantity_reserved,
        available: Math.max(0, stock.quantity_on_hand - stock.quantity_reserved),
      };
    }),
    borrows,
  });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = borrowSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form input.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    if (isSupabaseConfigured()) {
      try {
        const admin = createAdminClient();
        const { data: item } = await admin
          .from("inventory_items")
          .select("name, stock_balances(*)")
          .eq("id", d.item_id)
          .single();

        if (item) {
          const { data: borrowRecord, error: borrowError } = await admin
            .from("tool_borrows")
            .insert({
              item_id: d.item_id,
              item_name: item.name,
              borrower_name: d.borrower_name,
              borrower_email: d.borrower_email.toLowerCase(),
              project_title: d.project_title,
              user_type: d.user_type,
              enrollment_number: d.enrollment_number,
              course_code: d.course_code,
              year_of_study: d.year_of_study,
              faculty_name: d.faculty_name,
              section_number: d.section_number,
              other_role: d.other_role,
              other_phone: d.other_phone,
              quantity: d.quantity,
              expected_return_date: d.expected_return_date,
              notes: d.notes,
              status: "active",
            })
            .select("*")
            .single();

          if (!borrowError && borrowRecord) {
            // Reserve stock
            const curStock = item.stock_balances?.[0];
            if (curStock) {
              await admin
                .from("stock_balances")
                .update({
                  quantity_reserved: (curStock.quantity_reserved || 0) + d.quantity,
                  updated_at: new Date().toISOString(),
                })
                .eq("item_id", d.item_id);
            }
            return NextResponse.json({ ok: true, borrow: borrowRecord }, { status: 201 });
          }
        }
      } catch {
        // Fall through to mock store
      }
    }

    // In-memory fallback
    const res = mockDb.borrowTool({
      borrower_name: d.borrower_name,
      borrower_email: d.borrower_email,
      project_title: d.project_title,
      item_id: d.item_id,
      quantity: d.quantity,
      expected_return_date: d.expected_return_date,
      notes: d.notes,
    });
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, borrow: res.borrow }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to process borrow request." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { borrow_id } = await req.json();
    if (!borrow_id) {
      return NextResponse.json({ error: "Missing borrow_id" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const admin = createAdminClient();
        const { data: record } = await admin
          .from("tool_borrows")
          .select("*")
          .eq("id", borrow_id)
          .single();

        if (record) {
          await admin
            .from("tool_borrows")
            .update({
              status: "returned",
              actual_return_date: new Date().toISOString().split("T")[0],
              updated_at: new Date().toISOString(),
            })
            .eq("id", borrow_id);

          // Decrement reserved stock
          const { data: item } = await admin
            .from("stock_balances")
            .select("*")
            .eq("item_id", record.item_id)
            .single();

          if (item) {
            await admin
              .from("stock_balances")
              .update({
                quantity_reserved: Math.max(0, (item.quantity_reserved || 0) - record.quantity),
                updated_at: new Date().toISOString(),
              })
              .eq("item_id", record.item_id);
          }
          return NextResponse.json({ ok: true });
        }
      } catch {
        // Fall through to mock store
      }
    }

    const success = mockDb.returnTool(borrow_id);
    if (!success) {
      return NextResponse.json({ error: "Record not found or already returned." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update borrow record." }, { status: 500 });
  }
}
