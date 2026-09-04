"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkWrapper } from "@/components/ui/link-button";
import { User, Mail, Phone, Shield, Calendar, Edit2, CheckCircle2, MapPin, GraduationCap } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  education?: string;
  avatarUrl?: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export function StudentProfileClient({ user }: { user: User | null }) {
  return (
      <div className="mx-auto max-w-4xl space-y-6">
        <StudentPageHeader
          title="Profile"
          description="Manage your personal information, account access and security settings."
          icon={<User className="h-6 w-6" aria-hidden="true" />}
          eyebrow="Your account"
        />

        {/* Profile Card */}
        <Card className="overflow-hidden rounded-2xl border-primary-100">
          <CardHeader className="border-b border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50">
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-1 ring-primary-100">
                <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.name ?? "User"} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Full Name</label>
                    <p className="mt-1 text-lg font-medium text-slate-900">{user?.name ?? "—"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Email</label>
                    <p className="mt-1 text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {user?.email ?? "—"}
                      {user?.emailVerifiedAt && (
                        <Badge variant="success" className="ml-2">Verified</Badge>
                      )}
                      {!user?.emailVerifiedAt && (
                        <Badge variant="warning" className="ml-2">Not Verified</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Phone</label>
                    <p className="mt-1 text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {user?.phone ?? "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Member Since</label>
                    <p className="mt-1 text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Address</label>
                    <p className="mt-1 flex items-start gap-2 text-sm font-medium text-slate-900"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{user?.address ?? "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500">Education</label>
                    <p className="mt-1 flex items-start gap-2 text-sm font-medium text-slate-900"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{user?.education ?? "Not provided"}</p>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <LinkWrapper href="/student/profile/edit">
                    <Edit2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Edit Profile
                  </LinkWrapper>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Shield className="h-5 w-5 text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription className="text-xs">Manage your password and security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">Change Password</p>
                <p className="text-sm text-slate-500">Update your password to keep your account secure</p>
              </div>
              <Button asChild variant="outline">
                <LinkWrapper href="/student/profile/password">Change Password</LinkWrapper>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your current account status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Active</p>
                <p className="text-sm text-slate-500">Your account is active and in good standing.</p>
              </div>
              <Badge variant="success" className="ml-auto">Active</Badge>
            </div>
          </CardContent>
        </Card>

      </div>
  );
}
