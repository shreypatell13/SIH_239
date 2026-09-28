import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { deficiencyService } from "@/server/services/deficiency.service";
import { deficiencyRepository } from "@/server/repositories/deficiency.repository";
import { prisma } from "@/server/db";
import { UserRole } from "@prisma/client";

/**
 * GET /api/officer/applications/[id]/deficiencies - Lists all deficiencies with officer metadata
 * POST /api/officer/applications/[id]/deficiencies - Allows officer to manually issue a deficiency
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === UserRole.APPLICANT) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Officer access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: { caseDossier: true },
    });

    if (!application || !application.caseDossier) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const raw = await deficiencyRepository.listByCaseId(application.caseDossier.id);
    const summary = await deficiencyService.getDeficiencySummary(id, user);

    return NextResponse.json({
      success: true,
      data: {
        deficiencies: raw,
        summary,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: { caseDossier: true },
    });

    if (!application || !application.caseDossier) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const created = await deficiencyService.issueDeficiency(
      {
        caseDossierId: application.caseDossier.id,
        issuedById: user.id,
        deficiencyType: body.deficiencyType,
        documentType: body.documentType,
        targetDocumentId: body.targetDocumentId,
        ruleResultId: body.ruleResultId,
        description: body.description,
        responseDeadline: body.responseDeadline ? new Date(body.responseDeadline) : undefined,
      },
      user
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
