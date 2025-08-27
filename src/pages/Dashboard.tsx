import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Project, Appointment } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsResponse, appointmentsResponse] = await Promise.all([
          apiService.getProjects(),
          apiService.getAppointments()
        ]);

        setProjects(projectsResponse.projects);
        setAppointments(appointmentsResponse.appointments);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'กำลังดำเนินการ';
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอการยืนยัน';
      case 'cancelled':
        return 'ยกเลิก';
      case 'rejected':
        return 'ปฏิเสธ';
      case 'completed':
        return 'เสร็จสิ้น';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  const upcomingAppointments = appointments
    .filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 5);

  const activeProjects = projects.filter(project => project.status === 'active');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          สวัสดี, {user?.first_name} {user?.last_name}
        </h1>
        <p className="text-gray-600">
          ยินดีต้อนรับสู่ระบบจัดการการนัดหมายระหว่างนักศึกษากับอาจารย์ที่ปรึกษาโครงงาน
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">📁</span>
              โครงงานทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{projects.length}</div>
            <p className="text-sm text-gray-600 mt-1">
              โครงงานที่คุณเกี่ยวข้อง
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">📅</span>
              การนัดหมายทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{appointments.length}</div>
            <p className="text-sm text-gray-600 mt-1">
              การนัดหมายทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">⏰</span>
              การนัดหมายที่ใกล้ถึง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {upcomingAppointments.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              การนัดหมายที่กำลังจะถึง
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>การนัดหมายที่ใกล้ถึง</CardTitle>
            <CardDescription>
              การนัดหมายที่กำลังจะถึงในเร็วๆ นี้
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">ไม่มีการนัดหมายที่ใกล้ถึง</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{appointment.title}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.appointment_date).toLocaleDateString('th-TH')} 
                        เวลา {appointment.start_time} - {appointment.end_time}
                      </p>
                      {appointment.location && (
                        <p className="text-sm text-gray-500">📍 {appointment.location}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>โครงงานที่กำลังดำเนินการ</CardTitle>
            <CardDescription>
              โครงงานที่กำลังดำเนินการอยู่
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">ไม่มีโครงงานที่กำลังดำเนินการ</p>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((project) => (
                  <div key={project.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{project.title}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        สมาชิก: {project.member_count || 0} คน
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                        กำลังดำเนินการ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
