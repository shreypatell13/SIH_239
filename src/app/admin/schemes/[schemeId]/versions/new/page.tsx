"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Layers,
  FileText,
  FileCheck,
  Scale,
  GitFork,
  Calendar,
  Award,
  Sparkles,
  Eye,
  Code2,
  Lock,
} from "lucide-react";
import {
  FormSchema,
  DocumentRequirementsSchema,
  EligibilityRulesSchema,
  WorkflowConfig,
  SelectionConfig,
  ValidationResultDTO,
  FieldType,
  RuleOperator,
  RuleSource,
  RuleSeverity,
  DocumentRequirementLevel,
} from "@/server/domain/scheme/types";
import { DocumentType, CaseStage, UserRole } from "@prisma/client";

export default function SchemeVersionEditorPage() {
  const router = useRouter();
  const params = useParams();
  const schemeId = params?.schemeId as string;

  const [activeTab, setActiveTab] = useState<
    "form" | "documents" | "rules" | "workflow" | "selection" | "deadlines" | "review"
  >("form");

  const [schemeName, setSchemeName] = useState("");
  const [schemeCode, setSchemeCode] = useState("");
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // --- Draft Version State ---
  const [formSchema, setFormSchema] = useState<FormSchema>({
    version: "1.0",
    sections: [
      { id: "personal", title: "Personal Details", order: 1 },
      { id: "academic", title: "Academic Information", order: 2 },
      { id: "financial", title: "Financial Information", order: 3 },
    ],
    fields: [
      {
        id: "fullName",
        label: "Full Name",
        type: "text",
        validation: { required: true, minLength: 2 },
        sectionId: "personal",
        order: 1,
      },
      {
        id: "casteCategory",
        label: "Caste Category",
        type: "select",
        validation: { required: true, allowedValues: ["ST"] },
        sectionId: "personal",
        order: 2,
      },
      {
        id: "annualFamilyIncome",
        label: "Annual Family Income (INR)",
        type: "number",
        validation: { required: true, min: 0 },
        sectionId: "financial",
        order: 1,
      },
    ],
  });

  const [docRequirements, setDocRequirements] = useState<DocumentRequirementsSchema>({
    version: "1.0",
    requirements: [
      {
        id: "req_caste_cert",
        documentType: "CASTE_CERTIFICATE",
        label: "Scheduled Tribe Certificate",
        description: "Official ST certificate issued by competent authority",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
        maxFileSizeMb: 5,
        validityWindowMonths: 36,
        requiresExtraction: true,
      },
    ],
  });

  const [eligibilityRules, setEligibilityRules] = useState<EligibilityRulesSchema>({
    version: "1.0",
    rules: [
      {
        ruleKey: "ST_VERIFICATION",
        name: "ST Category Verification",
        description: "Applicant must be verified as Scheduled Tribe",
        source: "FORM_DATA",
        sourceField: "casteCategory",
        operator: "EQUALS",
        threshold: "ST",
        failureMessage: "Candidate category must be Scheduled Tribe (ST).",
        severity: "HARD_FAIL",
        isActive: true,
      },
    ],
  });

  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>({
    version: "1.0",
    stages: [
      {
        stageKey: "SUBMITTED",
        label: "Application Received",
        order: 1,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
      },
      {
        stageKey: "AUTOMATED_VERIFICATION",
        label: "Automated Evidence Check",
        order: 2,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
        autoAdvanceOnPass: true,
      },
      {
        stageKey: "OFFICER_REVIEW",
        label: "Verification Desk",
        order: 3,
        slaDays: 5,
        assignableRoles: ["VERIFICATION_OFFICER"],
      },
      {
        stageKey: "SANCTIONED",
        label: "Sanction Issued",
        order: 4,
        slaDays: 3,
        assignableRoles: ["SCHEME_ADMIN"],
      },
    ],
    deficiencyResponseWindowDays: 14,
    maxResubmissionAttempts: 2,
    allowWithdrawal: true,
  });

  const [selectionConfig, setSelectionConfig] = useState<SelectionConfig>({
    version: "1.0",
    maxAwardees: 500,
    quotas: [{ id: "q_general", label: "General ST Quota", percentage: 100 }],
    financialComponents: [
      {
        id: "fc_stipend",
        label: "Monthly Fellowship Grant",
        amountInr: 31000,
        frequency: "MONTHLY",
      },
    ],
    meritBasis: "ACADEMIC_SCORE",
  });

  const [applicationOpenDate, setApplicationOpenDate] = useState("2026-04-01");
  const [applicationDeadline, setApplicationDeadline] = useState("2026-10-31");

  // Validation & Publishing state
  const [validationResult, setValidationResult] = useState<ValidationResultDTO | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Load existing scheme data on mount
  useEffect(() => {
    async function loadScheme() {
      try {
        const res = await fetch(`/api/admin/schemes/${schemeId}`);
        const data = await res.json();
        if (res.ok && data.success && data.scheme) {
          setSchemeName(data.scheme.name);
          setSchemeCode(data.scheme.code);

          // If there is an active version, load it as initial draft template
          if (data.scheme.activeVersionId) {
            const verRes = await fetch(
              `/api/admin/schemes/${schemeId}/versions/${data.scheme.activeVersionId}`
            );
            const verData = await verRes.json();
            if (verRes.ok && verData.success && verData.version) {
              const v = verData.version;
              if (v.formSchema) setFormSchema(v.formSchema);
              if (v.documentRequirements) setDocRequirements(v.documentRequirements);
              if (v.eligibilityRules) setEligibilityRules(v.eligibilityRules);
              if (v.workflowConfig) setWorkflowConfig(v.workflowConfig);
              if (v.selectionConfig) setSelectionConfig(v.selectionConfig);
              if (v.applicationOpenDate)
                setApplicationOpenDate(v.applicationOpenDate.split("T")[0]);
              if (v.applicationDeadline)
                setApplicationDeadline(v.applicationDeadline.split("T")[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load initial scheme:", err);
      } finally {
        setIsLoadingInitial(false);
      }
    }
    loadScheme();
  }, [schemeId]);

  // Run validation
  async function handleValidate() {
    setIsValidating(true);
    setPublishError(null);
    try {
      const payload = {
        formSchema,
        documentRequirements: docRequirements,
        eligibilityRules,
        workflowConfig,
        selectionConfig,
        applicationOpenDate: applicationOpenDate
          ? new Date(applicationOpenDate).toISOString()
          : null,
        applicationDeadline: applicationDeadline
          ? new Date(applicationDeadline).toISOString()
          : null,
      };

      const res = await fetch("/api/admin/schemes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setValidationResult(data.validation);
      }
    } catch {
      setPublishError("Failed to run validation check");
    } finally {
      setIsValidating(false);
    }
  }

  // Publish version
  async function handlePublish() {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const payload = {
        formSchema,
        documentRequirements: docRequirements,
        eligibilityRules,
        workflowConfig,
        selectionConfig,
        applicationOpenDate: applicationOpenDate
          ? new Date(applicationOpenDate).toISOString()
          : null,
        applicationDeadline: applicationDeadline
          ? new Date(applicationDeadline).toISOString()
          : null,
      };

      const res = await fetch(`/api/admin/schemes/${schemeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPublishError(data.error || "Publication failed");
        setIsPublishing(false);
        return;
      }

      // Success -> navigate to scheme overview
      router.push(`/admin/schemes/${schemeId}`);
      router.refresh();
    } catch {
      setPublishError("An unexpected error occurred during publication");
      setIsPublishing(false);
    }
  }

  // -------------------------------------------------------------
  // Form Schema Helpers
  // -------------------------------------------------------------
  function addField(sectionId: string) {
    const newFieldId = `field_${Date.now()}`;
    setFormSchema((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: newFieldId,
          label: "New Form Field",
          type: "text",
          validation: { required: false },
          sectionId,
          order: prev.fields.filter((f) => f.sectionId === sectionId).length + 1,
        },
      ],
    }));
  }

  function removeField(fieldId: string) {
    setFormSchema((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
  }

  function updateField(fieldId: string, updates: Partial<(typeof formSchema.fields)[0]>) {
    setFormSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    }));
  }

  // -------------------------------------------------------------
  // Document Requirements Helpers
  // -------------------------------------------------------------
  function addDocRequirement() {
    const newId = `req_${Date.now()}`;
    setDocRequirements((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          id: newId,
          documentType: "OTHER",
          label: "New Required Document",
          description: "Document description and instructions",
          level: "MANDATORY",
          allowedMimeTypes: ["application/pdf"],
          maxFileSizeMb: 5,
        },
      ],
    }));
  }

  function removeDocRequirement(id: string) {
    setDocRequirements((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((r) => r.id !== id),
    }));
  }

  function updateDocRequirement(
    id: string,
    updates: Partial<(typeof docRequirements.requirements)[0]>
  ) {
    setDocRequirements((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  }

  // -------------------------------------------------------------
  // Eligibility Rules Helpers
  // -------------------------------------------------------------
  function addEligibilityRule() {
    const newKey = `RULE_${Date.now()}`;
    setEligibilityRules((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          ruleKey: newKey,
          name: "New Eligibility Rule",
          description: "Rule description",
          source: "FORM_DATA",
          sourceField: "annualFamilyIncome",
          operator: "LESS_THAN_OR_EQUALS",
          threshold: 800000,
          failureMessage: "Eligibility condition not satisfied.",
          severity: "HARD_FAIL",
          isActive: true,
        },
      ],
    }));
  }

  function removeEligibilityRule(ruleKey: string) {
    setEligibilityRules((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.ruleKey !== ruleKey),
    }));
  }

  function updateEligibilityRule(
    ruleKey: string,
    updates: Partial<(typeof eligibilityRules.rules)[0]>
  ) {
    setEligibilityRules((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.ruleKey === ruleKey ? { ...r, ...updates } : r)),
    }));
  }

  if (isLoadingInitial) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-gov-slate" />
          <span>Loading Scheme Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/admin/schemes/${schemeId}`}>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <ArrowLeft className="h-3 w-3" />
                <span>{schemeCode || "Scheme"}</span>
              </Button>
            </Link>
            <Badge className="bg-gov-slate font-mono text-[10px]">Drafting New Version</Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {schemeName} — Declarative Policy Studio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawJson(!showRawJson)}
            className="gap-1.5 border-slate-300 text-xs"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>{showRawJson ? "Hide Raw DSL" : "View Raw DSL"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setActiveTab("review");
              handleValidate();
            }}
            className="gap-1.5 bg-gov-slate text-xs hover:bg-slate-800"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Validate &amp; Publish</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="shadow-2xs flex overflow-x-auto rounded-t-lg border-b border-slate-200 bg-white">
        {[
          { id: "form", label: "1. Form Builder", icon: FileText, count: formSchema.fields.length },
          {
            id: "documents",
            label: "2. Documents",
            icon: FileCheck,
            count: docRequirements.requirements.length,
          },
          {
            id: "rules",
            label: "3. Eligibility Rules",
            icon: Scale,
            count: eligibilityRules.rules.length,
          },
          {
            id: "workflow",
            label: "4. Workflow & SLAs",
            icon: GitFork,
            count: workflowConfig.stages.length,
          },
          {
            id: "selection",
            label: "5. Grants & Selection",
            icon: Award,
            count: selectionConfig.financialComponents.length,
          },
          { id: "deadlines", label: "6. Deadlines", icon: Calendar },
          { id: "review", label: "7. Review & Publish", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                if (tab.id === "review") handleValidate();
              }}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-gov-slate bg-slate-50/50 text-gov-slate"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="py-0.2 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Form Builder */}
      {activeTab === "form" && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Dynamic Application Sections &amp; Form Fields
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define structured form inputs. Client forms in Phase 2E dynamically render from
                    this specification with zero hardcoded code.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {formSchema.sections.map((section) => {
                const sectionFields = formSchema.fields.filter((f) => f.sectionId === section.id);
                return (
                  <div
                    key={section.id}
                    className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          Section: {section.id}
                        </Badge>
                        <span className="text-sm font-bold text-slate-900">{section.title}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField(section.id)}
                        className="h-7 gap-1 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Field to Section</span>
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {sectionFields.map((field) => (
                        <div
                          key={field.id}
                          className="shadow-2xs space-y-3 rounded-md border border-slate-200 bg-white p-3.5"
                        >
                          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                            <div className="sm:col-span-3">
                              <label className="text-[11px] font-semibold text-slate-700">
                                Field ID (Unique)
                              </label>
                              <input
                                type="text"
                                value={field.id}
                                onChange={(e) => updateField(field.id, { id: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className="text-[11px] font-semibold text-slate-700">
                                Display Label
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="text-[11px] font-semibold text-slate-700">
                                Data Type
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) =>
                                  updateField(field.id, { type: e.target.value as FieldType })
                                }
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              >
                                <option value="text">Text (Single Line)</option>
                                <option value="textarea">Textarea (Multi Line)</option>
                                <option value="number">Number (Numeric)</option>
                                <option value="date">Date</option>
                                <option value="select">Dropdown Select</option>
                                <option value="boolean">Checkbox / Toggle</option>
                              </select>
                            </div>
                            <div className="flex items-center justify-center pt-4 sm:col-span-1">
                              <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                                <input
                                  type="checkbox"
                                  checked={field.validation.required ?? false}
                                  onChange={(e) =>
                                    updateField(field.id, {
                                      validation: {
                                        ...field.validation,
                                        required: e.target.checked,
                                      },
                                    })
                                  }
                                  className="rounded text-gov-slate"
                                />
                                <span className="text-[11px] font-medium text-slate-700">Req.</span>
                              </label>
                            </div>
                            <div className="flex items-center justify-end pt-4 sm:col-span-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeField(field.id)}
                                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {field.type === "select" && (
                            <div className="border-t border-slate-100 pt-2 text-xs">
                              <label className="text-[11px] font-semibold text-slate-700">
                                Allowed Options (Comma separated):
                              </label>
                              <input
                                type="text"
                                value={(field.validation.allowedValues || []).join(", ")}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    validation: {
                                      ...field.validation,
                                      allowedValues: e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    },
                                  })
                                }
                                placeholder="e.g. Option A, Option B, Option C"
                                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {sectionFields.length === 0 && (
                        <p className="py-2 text-center text-xs italic text-slate-400">
                          No fields in this section yet. Click &quot;Add Field to Section&quot;
                          above.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Document Requirements */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Document Requirements Matrix</CardTitle>
                <CardDescription className="text-xs">
                  Declare mandatory and conditional certificates. Validates MIME types, max file
                  sizes, and validity periods.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={addDocRequirement}
                className="gap-1 bg-gov-slate text-xs hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Requirement</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {docRequirements.requirements.map((req) => (
                <div
                  key={req.id}
                  className="shadow-2xs space-y-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Document Type
                      </label>
                      <select
                        value={req.documentType}
                        onChange={(e) =>
                          updateDocRequirement(req.id, {
                            documentType: e.target.value as DocumentType,
                          })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-medium"
                      >
                        <option value="CASTE_CERTIFICATE">Caste Certificate (ST)</option>
                        <option value="INCOME_CERTIFICATE">Income Certificate</option>
                        <option value="DEGREE_TRANSCRIPT">Degree Transcript</option>
                        <option value="ADMISSION_OFFER_LETTER">Admission Offer Letter</option>
                        <option value="RESEARCH_PROPOSAL">Research Proposal</option>
                        <option value="PASSPORT">Indian Passport</option>
                        <option value="OTHER">Other Official Document</option>
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Label in Portal
                      </label>
                      <input
                        type="text"
                        value={req.label}
                        onChange={(e) => updateDocRequirement(req.id, { label: e.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Requirement Level
                      </label>
                      <select
                        value={req.level}
                        onChange={(e) =>
                          updateDocRequirement(req.id, {
                            level: e.target.value as DocumentRequirementLevel,
                          })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="MANDATORY">Mandatory</option>
                        <option value="CONDITIONAL">Conditional</option>
                        <option value="OPTIONAL">Optional</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Max Size (MB)
                      </label>
                      <input
                        type="number"
                        value={req.maxFileSizeMb}
                        onChange={(e) =>
                          updateDocRequirement(req.id, { maxFileSizeMb: Number(e.target.value) })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-end pt-4 sm:col-span-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDocRequirement(req.id)}
                        className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-2 text-xs sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">
                        Description / Instructions
                      </label>
                      <input
                        type="text"
                        value={req.description}
                        onChange={(e) =>
                          updateDocRequirement(req.id, { description: e.target.value })
                        }
                        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">
                        Validity Window (Months, optional)
                      </label>
                      <input
                        type="number"
                        value={req.validityWindowMonths ?? ""}
                        onChange={(e) =>
                          updateDocRequirement(req.id, {
                            validityWindowMonths: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="e.g. 12 (must be issued within 12 months)"
                        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Eligibility Rules */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Declarative Eligibility Rules DSL</CardTitle>
                <CardDescription className="text-xs">
                  Zero code execution. Rules are strictly declarative assertions evaluated by the
                  deterministic rule engine.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={addEligibilityRule}
                className="gap-1 bg-gov-slate text-xs hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Rule</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {eligibilityRules.rules.map((rule) => (
                <div
                  key={rule.ruleKey}
                  className="shadow-2xs space-y-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Rule Key (SCREAMING_SNAKE)
                      </label>
                      <input
                        type="text"
                        value={rule.ruleKey}
                        onChange={(e) =>
                          updateEligibilityRule(rule.ruleKey, {
                            ruleKey: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Source Type
                      </label>
                      <select
                        value={rule.source}
                        onChange={(e) =>
                          updateEligibilityRule(rule.ruleKey, {
                            source: e.target.value as RuleSource,
                          })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="FORM_DATA">Form Data Input</option>
                        <option value="EXTRACTED_FIELD">OCR Extracted Field</option>
                        <option value="COMPUTED">Computed System Value</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700">Field Key</label>
                      <input
                        type="text"
                        value={rule.sourceField}
                        onChange={(e) =>
                          updateEligibilityRule(rule.ruleKey, { sourceField: e.target.value })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">Severity</label>
                      <select
                        value={rule.severity}
                        onChange={(e) =>
                          updateEligibilityRule(rule.ruleKey, {
                            severity: e.target.value as RuleSeverity,
                          })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="HARD_FAIL">Hard Failure (Blocks)</option>
                        <option value="SOFT_FLAG">Soft Flag (Review)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-end pt-4 sm:col-span-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEligibilityRule(rule.ruleKey)}
                        className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-center gap-3 border-t border-slate-100 pt-2 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-semibold text-slate-700">Operator</label>
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          updateEligibilityRule(rule.ruleKey, {
                            operator: e.target.value as RuleOperator,
                          })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="EQUALS">== Equals</option>
                        <option value="NOT_EQUALS">!= Not Equals</option>
                        <option value="LESS_THAN">&lt; Less Than</option>
                        <option value="LESS_THAN_OR_EQUALS">&lt;= Less Than or Equals</option>
                        <option value="GREATER_THAN">&gt; Greater Than</option>
                        <option value="GREATER_THAN_OR_EQUALS">&gt;= Greater Than or Equals</option>
                        <option value="WITHIN_MONTHS">Within N Months</option>
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Comparison Threshold
                      </label>
                      <input
                        type="text"
                        value={String(rule.threshold)}
                        onChange={(e) =>
                          updateEligibilityRule(rule.ruleKey, {
                            threshold: isNaN(Number(e.target.value))
                              ? e.target.value
                              : Number(e.target.value),
                          })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Failure Explanation
                      </label>
                      <input
                        type="text"
                        value={rule.failureMessage}
                        onChange={(e) =>
                          updateEligibilityRule(rule.ruleKey, { failureMessage: e.target.value })
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Workflow & SLAs */}
      {activeTab === "workflow" && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Case Workflow Stages &amp; SLA Milestones</CardTitle>
              <CardDescription className="text-xs">
                Governs the state transitions, role authorizations, and turnaround targets for
                applications under this scheme version.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">Order</th>
                      <th className="px-3 py-2.5">Stage Key</th>
                      <th className="px-3 py-2.5">Stage Label</th>
                      <th className="px-3 py-2.5">Target SLA (Days)</th>
                      <th className="px-3 py-2.5">Assignable Role</th>
                      <th className="px-3 py-2.5">Auto Advance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {workflowConfig.stages.map((stg, idx) => (
                      <tr key={stg.stageKey} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                          {stg.stageKey}
                        </td>
                        <td className="px-3 py-2.5">{stg.label}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={stg.slaDays}
                            onChange={(e) => {
                              const newStages = [...workflowConfig.stages];
                              newStages[idx].slaDays = Number(e.target.value);
                              setWorkflowConfig({ ...workflowConfig, stages: newStages });
                            }}
                            className="w-16 rounded border border-slate-300 px-2 py-0.5 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-[10px]">
                            {stg.assignableRoles.join(", ")}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {stg.autoAdvanceOnPass ? (
                            <Badge className="bg-emerald-600 text-[10px]">
                              Yes (On Rules Pass)
                            </Badge>
                          ) : (
                            <span className="text-slate-400">Manual Officer Review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Deficiency Response Window (Calendar Days)
                  </label>
                  <input
                    type="number"
                    value={workflowConfig.deficiencyResponseWindowDays}
                    onChange={(e) =>
                      setWorkflowConfig({
                        ...workflowConfig,
                        deficiencyResponseWindowDays: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                  />
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Days granted to student to correct documents before case is flagged as expired.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Max Resubmission Attempts
                  </label>
                  <input
                    type="number"
                    value={workflowConfig.maxResubmissionAttempts}
                    onChange={(e) =>
                      setWorkflowConfig({
                        ...workflowConfig,
                        maxResubmissionAttempts: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                  />
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Maximum deficiency correction cycles allowed before officer escalation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: Selection & Grants */}
      {activeTab === "selection" && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Grant Components &amp; Selection Policy</CardTitle>
              <CardDescription className="text-xs">
                Configure sanction caps, stipend/contingency amounts, and selection merit criteria.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Maximum Total Sanctions / Cycle
                  </label>
                  <input
                    type="number"
                    value={selectionConfig.maxAwardees}
                    onChange={(e) =>
                      setSelectionConfig({
                        ...selectionConfig,
                        maxAwardees: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Merit Ranking Basis
                  </label>
                  <select
                    value={selectionConfig.meritBasis}
                    onChange={(e) =>
                      setSelectionConfig({
                        ...selectionConfig,
                        meritBasis: e.target.value as SelectionConfig["meritBasis"],
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    <option value="ACADEMIC_SCORE">Academic Merit (Qualifying Percentage)</option>
                    <option value="INCOME_INVERTED">Economic Priority (Lower Income First)</option>
                    <option value="COMPOSITE">
                      Composite Score (Ranking + Academic + Category)
                    </option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="mb-2 text-xs font-bold uppercase text-slate-800">
                  Financial Grant Breakdown
                </h4>
                <div className="space-y-2">
                  {selectionConfig.financialComponents.map((fc, idx) => (
                    <div
                      key={fc.id}
                      className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                    >
                      <input
                        type="text"
                        value={fc.label}
                        onChange={(e) => {
                          const newComps = [...selectionConfig.financialComponents];
                          newComps[idx].label = e.target.value;
                          setSelectionConfig({ ...selectionConfig, financialComponents: newComps });
                        }}
                        className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                      <div className="flex w-36 items-center gap-1">
                        <span className="text-xs text-slate-500">₹</span>
                        <input
                          type="number"
                          value={fc.amountInr}
                          onChange={(e) => {
                            const newComps = [...selectionConfig.financialComponents];
                            newComps[idx].amountInr = Number(e.target.value);
                            setSelectionConfig({
                              ...selectionConfig,
                              financialComponents: newComps,
                            });
                          }}
                          className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                        />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {fc.frequency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 6: Deadlines */}
      {activeTab === "deadlines" && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Application Submission Window</CardTitle>
              <CardDescription className="text-xs">
                Set active application intake dates. Student portal accepts new cases strictly
                within this window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Application Open Date
                  </label>
                  <input
                    type="date"
                    value={applicationOpenDate}
                    onChange={(e) => setApplicationOpenDate(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Application Hard Deadline
                  </label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 7: Review & Publish */}
      {activeTab === "review" && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Pre-Publish Validation &amp; Summary</CardTitle>
                  <CardDescription className="text-xs">
                    Run automated structural and semantic validation before publishing this
                    immutable SchemeVersion.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="gap-1.5 text-xs"
                >
                  {isValidating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-gov-saffron" />
                  )}
                  <span>Re-run Validation</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {publishError && (
                <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{publishError}</span>
                </div>
              )}

              {validationResult && (
                <div className="space-y-4">
                  <div
                    className={`rounded-lg border p-4 ${
                      validationResult.isValid
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-rose-200 bg-rose-50 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {validationResult.isValid ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <span>Validation Passed — Configuration Ready for Publication</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-rose-600" />
                          <span>
                            Validation Failed — {validationResult.errors.length} error(s) must be
                            resolved
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/10 pt-3 text-xs sm:grid-cols-5">
                      <div>
                        <span className="block text-slate-500">Form Fields:</span>
                        <span className="font-bold">{validationResult.summary.fieldsCount}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Mandatory Docs:</span>
                        <span className="font-bold">
                          {validationResult.summary.mandatoryDocsCount}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Eligibility Rules:</span>
                        <span className="font-bold">{validationResult.summary.rulesCount}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Workflow Stages:</span>
                        <span className="font-bold">{validationResult.summary.stagesCount}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Max Awardees:</span>
                        <span className="font-bold">{selectionConfig.maxAwardees}</span>
                      </div>
                    </div>
                  </div>

                  {/* Errors List */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-rose-700">
                        Errors (Blocking)
                      </h4>
                      <div className="space-y-1">
                        {validationResult.errors.map((err, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800"
                          >
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                            <span className="font-mono text-[11px] font-bold">[{err.field}]:</span>
                            <span>{err.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings List */}
                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-amber-700">Warnings</h4>
                      <div className="space-y-1">
                        {validationResult.warnings.map((warn, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                            <span className="font-mono text-[11px] font-bold">[{warn.field}]:</span>
                            <span>{warn.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-slate-200 pt-2">
              <p className="text-[11px] text-slate-500">
                Publishing executes an atomic database transaction. The previously active version
                will be superseded.
              </p>
              <Button
                size="sm"
                onClick={() => setShowPublishModal(true)}
                disabled={!validationResult?.isValid || isPublishing}
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Publish New Version</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Raw JSON Debug View */}
      {showRawJson && (
        <Card className="shadow-xs border-slate-200 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-sm text-emerald-400">
              Raw Declarative JSON Payload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-x-auto rounded border border-slate-800 bg-slate-950 p-3 font-mono text-[11px]">
              {JSON.stringify(
                {
                  formSchema,
                  documentRequirements: docRequirements,
                  eligibilityRules,
                  workflowConfig,
                  selectionConfig,
                  applicationOpenDate,
                  applicationDeadline,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Lock className="h-5 w-5 text-gov-slate" />
              <span>Confirm Version Publication</span>
            </div>
            <p className="text-xs text-slate-600">
              You are about to publish a new active version for <strong>{schemeName}</strong> (
              {schemeCode}).
            </p>
            <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Form Fields:</span>
                <span className="font-semibold">{formSchema.fields.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Required Documents:</span>
                <span className="font-semibold">{docRequirements.requirements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Eligibility Rules:</span>
                <span className="font-semibold">{eligibilityRules.rules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Workflow Stages:</span>
                <span className="font-semibold">{workflowConfig.stages.length}</span>
              </div>
            </div>
            <p className="rounded border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-700">
              ⚠️ Once published, this version cannot be modified. Existing historical applications
              remain safely anchored to their original version.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPublishing}
                onClick={() => setShowPublishModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPublishing}
                onClick={handlePublish}
                className="gap-1.5 bg-gov-slate hover:bg-slate-800"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Confirm &amp; Publish</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
