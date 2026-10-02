export type MockProject = {
  id: string;
  reference_code: string;
  title: string;
  lead_name: string;
  lead_email: string;
  organization: string;
  team_members: string;
  summary: string;
  resources_description: string;
  safety_notes: string;
  start_date: string | null;
  end_date: string | null;
  submitted_by: string | null;
  user_type?: "student" | "other";
  enrollment_number?: string;
  course_code?: string;
  year_of_study?: string;
  faculty_name?: string;
  section_number?: string;
  au_id_verified?: boolean;
  other_role?: string;
  other_organization?: string;
  other_phone?: string;
  other_id_number?: string;
  other_purpose?: string;
  borrowed_tools_summary?: string;
  approval_status?: "PENDING" | "YES" | "NO";
  status: "pending" | "approved" | "rejected" | "needs_changes" | "in_progress" | "completed" | "cancelled";
  review_note: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MockInventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  item_type: "consumable" | "reusable" | "machine";
  reorder_level: number;
  location: string;
  is_archived: boolean;
  stock_balances: {
    quantity_on_hand: number;
    quantity_reserved: number;
  }[];
};

export type MockResourceRequest = {
  id: string;
  project_id: string;
  status: string;
  created_at: string;
  projects: { title: string; reference_code: string } | null;
  resource_request_lines: {
    id: string;
    quantity_requested: number;
    quantity_approved: number;
    inventory_items: { name: string; unit: string } | null;
  }[];
};

export type MockToolBorrow = {
  id: string;
  borrower_name: string;
  borrower_email: string;
  project_title: string;
  item_id: string;
  item_name: string;
  quantity: number;
  borrowed_date: string;
  expected_return_date: string;
  status: "active" | "returned" | "overdue";
  approval_status?: "PENDING" | "YES" | "NO";
  return_condition?: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED";
  actual_return_date?: string;
  notes?: string;
};

// Global in-memory storage retained across requests in the Node process
const globalProjects: MockProject[] = [
  {
    id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    reference_code: "TL-2026-AGRI9201",
    title: "Autonomous Drone for Crop Health Monitoring",
    lead_name: "Aarav Patel",
    lead_email: "aarav.p@ahduni.edu.in",
    organization: "Ahmedabad University",
    team_members: "Devanshi Shah (devanshi.s@ahduni.edu.in)\nRohan Mehta (rohan.m@ahduni.edu.in)",
    summary: "A multi-rotor drone equipped with multispectral imaging sensors to assess crop health and optimize water consumption across agricultural plots.",
    resources_description: "3D printer for lightweight frame parts, Soldering station, Microcontrollers",
    safety_notes: "Flights conducted outdoors only in designated clear zones; propeller guards mandatory.",
    start_date: "2026-10-01",
    end_date: "2026-12-20",
    submitted_by: null,
    status: "pending",
    review_note: "",
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "a3bb189e-8bf9-3888-9912-ace4e6543002",
    reference_code: "TL-2026-ROVR4418",
    title: "Smart Campus Clean-up Rover",
    lead_name: "Priya Nair",
    lead_email: "priya.n@ahduni.edu.in",
    organization: "Ahmedabad University",
    team_members: "Karan Verma\nAnanya Sen",
    summary: "An autonomous electric rover designed to detect and pick up recyclable plastic bottles and cans along campus pedestrian paths.",
    resources_description: "Arduino Uno, Jumper wires, Motor drivers, 3D printing filament",
    safety_notes: "Emergency hardware stop button installed on the exterior of the chassis.",
    start_date: "2026-10-05",
    end_date: "2026-11-30",
    submitted_by: null,
    status: "pending",
    review_note: "",
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const globalInventory: MockInventoryItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Arduino Uno R3",
    sku: "DEV-ARD-001",
    category: "Microcontrollers",
    unit: "pcs",
    item_type: "reusable",
    reorder_level: 5,
    location: "Bin A-12",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 14, quantity_reserved: 2 }],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Raspberry Pi 4 (4GB)",
    sku: "SBC-RPI-004",
    category: "Single Board Computers",
    unit: "pcs",
    item_type: "reusable",
    reorder_level: 3,
    location: "Cabinet B-04",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 6, quantity_reserved: 1 }],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "PLA 3D Printer Filament (White 1kg)",
    sku: "FIL-PLA-WHT",
    category: "3D Printing",
    unit: "spool",
    item_type: "consumable",
    reorder_level: 4,
    location: "Shelf C-01",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 2, quantity_reserved: 0 }],
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Soldering Station 60W (ESD-Safe)",
    sku: "TLS-SLD-060",
    category: "Tools & Equipment",
    unit: "unit",
    item_type: "machine",
    reorder_level: 2,
    location: "Workbench 2",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 5, quantity_reserved: 0 }],
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Jumper Wires (M-to-M 40pcs)",
    sku: "WIR-JMP-MM40",
    category: "Cables & Wires",
    unit: "pack",
    item_type: "consumable",
    reorder_level: 10,
    location: "Bin D-03",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 25, quantity_reserved: 3 }],
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    name: "Digital Storage Oscilloscope (100MHz 2-Ch)",
    sku: "EQP-OSC-100",
    category: "Test & Measurement",
    unit: "unit",
    item_type: "machine",
    reorder_level: 1,
    location: "Bench T-01",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 4, quantity_reserved: 1 }],
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    name: "True-RMS Digital Multimeter",
    sku: "TLS-MM-TRMS",
    category: "Test & Measurement",
    unit: "unit",
    item_type: "reusable",
    reorder_level: 2,
    location: "Drawer M-02",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 8, quantity_reserved: 2 }],
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    name: "Adjustable DC Power Supply (30V / 5A)",
    sku: "PWR-SUP-3005",
    category: "Power Equipment",
    unit: "unit",
    item_type: "machine",
    reorder_level: 2,
    location: "Bench T-02",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 5, quantity_reserved: 1 }],
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    name: "Precision Electronics Hand Tool Kit (18-pc)",
    sku: "TLS-KIT-E18",
    category: "Hand Tools",
    unit: "set",
    item_type: "reusable",
    reorder_level: 3,
    location: "Tool Wall W-01",
    is_archived: false,
    stock_balances: [{ quantity_on_hand: 10, quantity_reserved: 1 }],
  },
];

const globalToolBorrows: MockToolBorrow[] = [
  {
    id: "brw-001",
    borrower_name: "Aarav Patel",
    borrower_email: "aarav.p@ahduni.edu.in",
    project_title: "Autonomous Drone for Crop Health Monitoring",
    item_id: "66666666-6666-6666-6666-666666666666",
    item_name: "Digital Storage Oscilloscope (100MHz 2-Ch)",
    quantity: 1,
    borrowed_date: "2026-10-01",
    expected_return_date: "2026-10-08",
    status: "active",
    notes: "Signal analysis for ESC flight controller telemetry",
  },
  {
    id: "brw-002",
    borrower_name: "Priya Nair",
    borrower_email: "priya.n@ahduni.edu.in",
    project_title: "Smart Campus Clean-up Rover",
    item_id: "77777777-7777-7777-7777-777777777777",
    item_name: "True-RMS Digital Multimeter",
    quantity: 1,
    borrowed_date: "2026-09-28",
    expected_return_date: "2026-10-05",
    status: "active",
    notes: "Battery pack load testing",
  },
];

const globalRequests: MockResourceRequest[] = [
  {
    id: "req-001",
    project_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    projects: {
      title: "Autonomous Drone for Crop Health Monitoring",
      reference_code: "TL-2026-AGRI9201",
    },
    resource_request_lines: [
      {
        id: "line-1",
        quantity_requested: 2,
        quantity_approved: 0,
        inventory_items: { name: "PLA 3D Printer Filament (White 1kg)", unit: "spool" },
      },
      {
        id: "line-2",
        quantity_requested: 1,
        quantity_approved: 0,
        inventory_items: { name: "Raspberry Pi 4 (4GB)", unit: "pcs" },
      },
    ],
  },
];

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url.startsWith("https://") &&
    !url.includes("YOUR_PROJECT") &&
    !url.includes("placeholder")
  );
}

export const mockDb = {
  getProjects(): MockProject[] {
    return [...globalProjects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  getPendingProjects(): MockProject[] {
    return globalProjects.filter((p) => p.status === "pending");
  },
  getProjectById(id: string): MockProject | undefined {
    return globalProjects.find((p) => p.id === id);
  },
  addProject(data: Omit<MockProject, "id" | "created_at" | "updated_at">): MockProject {
    const project: MockProject = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalProjects.unshift(project);
    return project;
  },
  updateProjectStatus(id: string, status: MockProject["status"], review_note: string, reviewerId?: string): MockProject | null {
    const p = globalProjects.find((x) => x.id === id);
    if (!p) return null;
    p.status = status;
    p.review_note = review_note;
    p.reviewed_by = reviewerId || "staff-user";
    p.reviewed_at = new Date().toISOString();
    p.updated_at = new Date().toISOString();
    return p;
  },
  getInventory(): MockInventoryItem[] {
    return [...globalInventory];
  },
  getResourceRequests(): MockResourceRequest[] {
    return [...globalRequests];
  },
  getToolBorrows(): MockToolBorrow[] {
    return [...globalToolBorrows];
  },
  borrowTool(data: {
    borrower_name: string;
    borrower_email: string;
    project_title: string;
    item_id: string;
    quantity: number;
    expected_return_date: string;
    notes?: string;
  }): { success: boolean; error?: string; borrow?: MockToolBorrow } {
    const item = globalInventory.find((i) => i.id === data.item_id);
    if (!item) return { success: false, error: "Tool or equipment not found." };
    const stock = item.stock_balances[0];
    const available = (stock?.quantity_on_hand || 0) - (stock?.quantity_reserved || 0);
    if (available < data.quantity) {
      return { success: false, error: `Only ${available} ${item.unit} available to borrow.` };
    }
    // reserve or decrease stock balance
    if (stock) {
      stock.quantity_reserved = (stock.quantity_reserved || 0) + data.quantity;
    }
    const record: MockToolBorrow = {
      id: `brw-${crypto.randomUUID().slice(0, 6)}`,
      borrower_name: data.borrower_name,
      borrower_email: data.borrower_email,
      project_title: data.project_title,
      item_id: item.id,
      item_name: item.name,
      quantity: data.quantity,
      borrowed_date: new Date().toISOString().split("T")[0],
      expected_return_date: data.expected_return_date,
      status: "active",
      notes: data.notes || "",
    };
    globalToolBorrows.unshift(record);
    return { success: true, borrow: record };
  },
  returnTool(borrowId: string): boolean {
    const record = globalToolBorrows.find((b) => b.id === borrowId);
    if (!record || record.status === "returned") return false;
    record.status = "returned";
    record.return_condition = "RETURNED PROPERLY";
    record.actual_return_date = new Date().toISOString().split("T")[0];
    const item = globalInventory.find((i) => i.id === record.item_id);
    if (item && item.stock_balances[0]) {
      item.stock_balances[0].quantity_reserved = Math.max(
        0,
        (item.stock_balances[0].quantity_reserved || 0) - record.quantity
      );
    }
    return true;
  },
  updateProjectApproval(
    referenceCode: string,
    approval: "PENDING" | "YES" | "NO",
    notes?: string,
    reviewer?: string
  ): boolean {
    const p = globalProjects.find((x) => x.reference_code === referenceCode);
    if (!p) return false;
    p.approval_status = approval;
    if (approval === "YES") p.status = "approved";
    if (approval === "NO") p.status = "rejected";
    if (approval === "PENDING") p.status = "pending";
    if (notes) p.review_note = notes;
    if (reviewer) p.reviewed_by = reviewer;
    p.reviewed_at = new Date().toISOString();
    p.updated_at = new Date().toISOString();
    return true;
  },
  updateToolBorrowStatus(
    borrowId: string,
    approval: "PENDING" | "YES" | "NO",
    returnCondition: "RETURNED PROPERLY" | "NOT RETURNED / IN USE" | "OVERDUE / DAMAGED",
    notes?: string
  ): boolean {
    const b = globalToolBorrows.find((x) => x.id === borrowId);
    if (!b) return false;
    b.approval_status = approval;
    b.return_condition = returnCondition;
    if (returnCondition === "RETURNED PROPERLY") {
      b.status = "returned";
      b.actual_return_date = new Date().toISOString().split("T")[0];
      const item = globalInventory.find((i) => i.id === b.item_id);
      if (item && item.stock_balances[0]) {
        item.stock_balances[0].quantity_reserved = Math.max(
          0,
          (item.stock_balances[0].quantity_reserved || 0) - b.quantity
        );
      }
    } else {
      b.status = "active";
    }
    if (notes) b.notes = notes;
    return true;
  },
};
