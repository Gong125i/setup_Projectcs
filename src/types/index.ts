export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher';
  student_id?: string;
  teacher_id?: string;
  department?: string;
  phone?: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  teacher_id: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  member_count?: number;
  members?: User[];
}

export interface Appointment {
  id: number;
  project_id: number;
  student_id: number;
  teacher_id: number;
  title: string;
  description?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  project_title?: string;
  student_first_name?: string;
  student_last_name?: string;
  student_student_id?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  teacher_teacher_id?: string;
  appointment_notes?: AppointmentNote[];
}

export interface AppointmentNote {
  id: number;
  appointment_id: number;
  user_id: number;
  note: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface TeacherSchedule {
  id?: number;
  teacher_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}
