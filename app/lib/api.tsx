const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";


export interface MembershipBenefit {
  id: number;
  name: string;
}

export interface Membership {
  id: number;
  name: string;
  price: number;
  active_days: number;
  description: string | null;
  level: number;
  benefits: MembershipBenefit[];
}

export interface MembershipPayload {
  name: string;
  price: number;
  active_days: number;
  description: string;
  benefit_ids: number[];
}

export interface ServiceName {
  id: number;
  name: string;
  created_at?: string;
}

export interface Staff {
  id: number;
  name: string;
  contact: string | null;
  image: string | null;
  description: string | null;
  created_at?: string;
}

export interface ServiceType {
  id: number;
  name: string;
  created_at?: string;
  services: ServiceName[];
}

export interface RoomName {
  id: number;
  name: string;
  capacity: number;
  created_at?: string;
}

export interface RoomType {
  id: number;
  name: string;
  created_at?: string;
  rooms: RoomName[];
}

export interface OperationalHours {
  [day: string]: {
    open: string;
    close: string;
    isClosed: boolean;
  };
}
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}
export interface Branch {
  id: number;
  name: string;
  address: string;
  contact: string;
  operational_hours: OperationalHours;
  time_slots: string[];
  services: string[];
  is_active: boolean;
  created_at: string;
  admin_count: number;
}

export interface BranchListResponse {
  success: boolean;
  data: {
    branches: Branch[];
    total_all: number;
    total_shown: number;
  };
}

export interface CreateBranchPayload {
  branch_name: string;
  branch_address: string;
  branch_contact: string;
  operational_hours: OperationalHours;
  time_slots: string[];
  services: string[];
  admin_email: string;
  admin_password: string;
  admin_phone: string;
  admin_role: "pusat" | "cabang";
}


interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    admin: {
      id: number;
      email: string;
      role: string;
      photo: string | null;
      branch: {
        id: number;
        name: string;
        address: string;
      } | null;
    };
  };
}

export interface OperationalHourDay {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface ProfileData {
  admin: {
    id: number;
    email: string;
    phone: string;
    role: string;
    photo: string | null;
    created_at: string;
  };
  branch: {
    id: number;
    name: string;
    address: string;
    contact: string;
    operational_hours: Record<string, OperationalHourDay>;
    time_slots: string[];
    services: string[];
    photo: string | null; 
  } | null;
}
export interface ProfileResponse {
  success: boolean;
  data: ProfileData;
}


export interface ClashError {
  type: "room" | "staff";
  message: string;
}

export interface CopyClashError {
  schedule: string; 
  clashes: ClashError[];
}

export interface ScheduleStaff {
  id: number;
  name: string;
}

export interface Schedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  timezone: string;
  slot: number;   // ← tambahkan ini
  service_type: { id: number; name: string };
  service_name: { id: number; name: string };
  room_type: { id: number; name: string };
  room_name: { id: number; name: string; capacity: number };
  staffs: ScheduleStaff[];
}

export interface SchedulePayload {
  service_type_id: number;
  service_name_id: number;
  room_type_id: number;
  room_name_id: number;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  staff_ids: number[];
}


export const authAPI = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {

      throw new Error(data.message || "Login gagal");
    }

    return data;
  },

  getMe: async (token: string) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  
};

const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const branchAPI = {
  getAll: async (): Promise<BranchListResponse> => {
    const res = await fetch(`${API_URL}/branches`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memuat data cabang");
    return data;
  },

  create: async (payload: CreateBranchPayload): Promise<ApiResponse> => {
    const res = await fetch(`${API_URL}/branches`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menambahkan cabang");
    return data;
  },

  delete: async (branchId: number): Promise<ApiResponse> => {
    const res = await fetch(`${API_URL}/branches/${branchId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menghapus cabang");
    return data;
  },
};

export const profileAPI = {

  get: async (): Promise<ProfileResponse> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memuat profil");
    return data;
  },



  update: async (payload: {
  email?: string;
  phone?: string;
  branch_name?: string;
  branch_address?: string;
  branch_contact?: string;
  operational_hours?: Record<string, OperationalHourDay>;
  time_slots?: string;
  photoFile?: File | null;
  branchPhotoFile?: File | null;  
}): Promise<{ success: boolean; message: string; data: ProfileData }> => {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  if (payload.email) formData.append("email", payload.email);
  if (payload.phone) formData.append("phone", payload.phone);
  if (payload.branch_name) formData.append("branch_name", payload.branch_name);
  if (payload.branch_address) formData.append("branch_address", payload.branch_address);
  if (payload.branch_contact) formData.append("branch_contact", payload.branch_contact);
  if (payload.operational_hours) {
    formData.append("operational_hours", JSON.stringify(payload.operational_hours));
  }
  if (payload.time_slots) formData.append("time_slots", payload.time_slots);
  if (payload.photoFile) formData.append("photo", payload.photoFile);
  if (payload.branchPhotoFile) formData.append("branch_photo", payload.branchPhotoFile);

  const res = await fetch(`${API_URL}/profile`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal menyimpan perubahan");
  return data;
},
};

export const getAdminPhotoUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${BACKEND_BASE_URL}/uploads/admins/${filename}`;
};

export const getBranchPhotoUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${BACKEND_BASE_URL}/uploads/branches/${filename}`;
};



export const serviceAPI = {
  getAll: async (): Promise<{ success: boolean; data: ServiceType[] }> => {
    const res = await fetch(`${API_URL}/services`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },


  createType: async (name: string): Promise<{ success: boolean; message: string; data: ServiceType }> => {
    const res = await fetch(`${API_URL}/services/types`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  updateType: async (typeId: number, name: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/services/types/${typeId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteType: async (typeId: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/services/types/${typeId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

 
  createName: async (typeId: number, name: string): Promise<{ success: boolean; message: string; data: ServiceName }> => {
    const res = await fetch(`${API_URL}/services/types/${typeId}/names`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  updateName: async (nameId: number, name: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/services/names/${nameId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteName: async (nameId: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/services/names/${nameId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
};


export const roomAPI = {
  getAll: async (): Promise<{ success: boolean; data: RoomType[] }> => {
    const res = await fetch(`${API_URL}/rooms`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  createType: async (name: string): Promise<{ success: boolean; message: string; data: RoomType }> => {
    const res = await fetch(`${API_URL}/rooms/types`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  updateType: async (typeId: number, name: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/rooms/types/${typeId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteType: async (typeId: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/rooms/types/${typeId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },


  createRoom: async (typeId: number, name: string, capacity: number): Promise<{ success: boolean; message: string; data: RoomName }> => {
    const res = await fetch(`${API_URL}/rooms/types/${typeId}/rooms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, capacity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  updateRoom: async (roomId: number, name: string, capacity: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/rooms/rooms/${roomId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, capacity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteRoom: async (roomId: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/rooms/rooms/${roomId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },
};



export const getStaffPhotoUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${BACKEND_BASE_URL}/uploads/staffs/${filename}`;
};



export const staffAPI = {
  getAll: async (): Promise<{ success: boolean; data: Staff[] }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memuat data staff");
    return data;
  },

  create: async (payload: {
    name: string;
    contact: string;
    description: string;
    imageFile: File | null;
  }): Promise<{ success: boolean; message: string; data: Staff }> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("name", payload.name);
    formData.append("contact", payload.contact);
    formData.append("description", payload.description);
    if (payload.imageFile) {
      formData.append("staff_image", payload.imageFile);
    }

    const res = await fetch(`${API_URL}/staff`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menambahkan staff");
    return data;
  },

  update: async (
    staffId: number,
    payload: {
      name: string;
      contact: string;
      description: string;
      imageFile: File | null;
    }
  ): Promise<{ success: boolean; message: string; data: Staff }> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("name", payload.name);
    formData.append("contact", payload.contact);
    formData.append("description", payload.description);
    if (payload.imageFile) {
      formData.append("staff_image", payload.imageFile);
    }

    const res = await fetch(`${API_URL}/staff/${staffId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memperbarui staff");
    return data;
  },

  delete: async (staffId: number): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/staff/${staffId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menghapus staff");
    return data;
  },
};



export const membershipAPI = {
  getAll: async (): Promise<{ success: boolean; data: Membership[] }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/memberships`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memuat membership");
    return data;
  },

  create: async (payload: MembershipPayload): Promise<{ success: boolean; message: string; data: Membership }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/memberships`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menambahkan membership");
    return data;
  },

  update: async (id: number, payload: MembershipPayload): Promise<{ success: boolean; message: string; data: Membership }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/memberships/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memperbarui membership");
    return data;
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/memberships/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menghapus membership");
    return data;
  },
};




export const scheduleAPI = {
  getByDate: async (
    serviceNameId: number,
    date: string
  ): Promise<{ success: boolean; data: Schedule[] }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_URL}/schedules?service_name_id=${serviceNameId}&date=${date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memuat jadwal");
    return data;
  },

  create: async (
    payload: SchedulePayload
  ): Promise<{ success: boolean; message: string; data?: Schedule; clashes?: ClashError[] }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) throw new Error(data.message || "Gagal membuat jadwal");
    return data;
  },

  update: async (
    id: number,
    payload: SchedulePayload
  ): Promise<{ success: boolean; message: string; data?: Schedule; clashes?: ClashError[] }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) throw new Error(data.message || "Gagal memperbarui jadwal");
    return data;
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/schedules/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal menghapus jadwal");
    return data;
  },

  copy: async (
    serviceNameId: number,
    sourceDate: string,
    targetDate: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: { copied_count: number; target_date: string };
    copy_clashes?: CopyClashError[];
  }> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/schedules/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        service_name_id: serviceNameId,
        source_date: sourceDate,
        target_date: targetDate,
      }),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) throw new Error(data.message || "Gagal menyalin jadwal");
    return data;
  },
};