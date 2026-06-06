import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";
import type { Metadata } from "next";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import { getProjectById } from "@/lib/db/projects";
import { listProjectMembers, getProjectMemberRole } from "@/lib/db/project-members";
import { PROJECT_ROLE_LABELS } from "@/lib/validations/project-member";
import {
  addProjectMemberAction,
  updateProjectMemberRoleAction,
  removeProjectMemberAction,
} from "./actions";
import AddMemberForm from "@/components/projects/AddMemberForm";
import RemoveMemberButton from "@/components/projects/RemoveMemberButton";
import UpdateMemberRoleSelect from "@/components/projects/UpdateMemberRoleSelect";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  return {
    title: project
      ? `Thành viên – ${project.name} | FS Dòng Tiền BĐS`
      : "Thành viên | FS Dòng Tiền BĐS",
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  OWNER: "bg-amber-50 text-amber-700 border-amber-200",
  EDITOR: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWER: "bg-gray-50 text-gray-600 border-gray-200",
};

export default async function ThanhVienPage({ params }: Props) {
  const { id } = await params;

  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const project = await getProjectById(id);
  if (!project) notFound();

  await assertProjectAccess(session.user.id, id).catch(() => notFound());

  const [members, myRole] = await Promise.all([
    listProjectMembers(id),
    getProjectMemberRole(id, session.user.id),
  ]);

  const isOwner = session.user.role === "ADMIN" || myRole === "OWNER";

  const addAction = addProjectMemberAction.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/du-an/${id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại dự án
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-gray-400" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Thành viên dự án</h1>
            <p className="mt-0.5 text-sm text-gray-500">{project.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isOwner && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Thêm thành viên</h2>
            <AddMemberForm action={addAction} />
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Danh sách thành viên ({members.length})
            </h2>
          </div>

          {members.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">Chưa có thành viên nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {members.map((member) => {
                const isSelf = member.userId === session.user.id;
                const updateAction = updateProjectMemberRoleAction.bind(null, id, member.id);
                const removeAction = removeProjectMemberAction.bind(null, id, member.id);
                const displayName = member.user.name ?? member.user.email;

                return (
                  <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        {displayName[0].toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {member.user.name ?? "—"}
                        {isSelf && (
                          <span className="ml-1.5 text-xs font-normal text-gray-400">
                            (bạn)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-gray-500">{member.user.email}</p>
                    </div>

                    <div className="flex-shrink-0">
                      {isOwner && !isSelf ? (
                        <UpdateMemberRoleSelect
                          currentRole={member.role}
                          action={updateAction}
                        />
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            ROLE_BADGE_CLASS[member.role] ?? ROLE_BADGE_CLASS.VIEWER
                          }`}
                        >
                          {PROJECT_ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      )}
                    </div>

                    <div className="flex-shrink-0 hidden sm:block text-xs text-gray-400 w-20 text-right">
                      {formatDate(member.createdAt)}
                    </div>

                    <div className="flex-shrink-0 w-10 flex justify-center">
                      {isOwner && (
                        <RemoveMemberButton
                          action={removeAction}
                          memberName={displayName}
                          isSelf={isSelf}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
